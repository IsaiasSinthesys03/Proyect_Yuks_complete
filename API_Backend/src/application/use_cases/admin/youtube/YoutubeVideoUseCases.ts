import { YoutubeVideoRepository } from '../../../../infrastructure/database/repositories/YoutubeVideoRepository';
import { CreateYoutubeVideoDTO, UpdateYoutubeVideoDTO, ReorderYoutubeVideosDTO } from '../../../../domain/types/YoutubeVideoDTOs';
import { YoutubeVideoNotFoundError, InvalidYoutubeUrlError } from '../../../../domain/errors/YoutubeVideoErrors';
import { YoutubeVideoRow } from '../../../../infrastructure/database/schema/db-types';
import { IAuditLogRepository } from '../../../interfaces/IAuditLogRepository';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';

export class ListYoutubeVideosUseCase {
  constructor(private readonly repo: YoutubeVideoRepository) {}
  async execute(activeOnly: boolean = false): Promise<YoutubeVideoRow[]> {
    return activeOnly ? this.repo.findActive() : this.repo.findAll();
  }
}

export class CreateYoutubeVideoUseCase {
  constructor(
    private readonly repo: YoutubeVideoRepository,
    private readonly auditLog: IAuditLogRepository
  ) {}
  
  async execute(dto: CreateYoutubeVideoDTO, context: AdminAuditContext): Promise<YoutubeVideoRow> {
    const videoId = this.extractVideoId(dto.youtube_url);
    if (!videoId) throw new InvalidYoutubeUrlError();
    
    const position = await this.repo.getNextPosition();
    const video = await this.repo.create({
      title: dto.title,
      youtube_url: dto.youtube_url,
      video_id: videoId,
      position,
      is_active: dto.is_active ?? true
    });

    await this.auditLog.write({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      ipAddress: context.ip,
      action: 'CREATE',
      entityType: 'youtube_videos',
      entityId: video.id,
      oldValue: null,
      newValue: video,
    });

    return video;
  }
  
  private extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}

export class UpdateYoutubeVideoUseCase {
  constructor(
    private readonly repo: YoutubeVideoRepository,
    private readonly auditLog: IAuditLogRepository
  ) {}
  
  async execute(id: string, dto: UpdateYoutubeVideoDTO, context: AdminAuditContext): Promise<YoutubeVideoRow> {
    const video = await this.repo.findById(id);
    if (!video) throw new YoutubeVideoNotFoundError(id);
    
    const patch: any = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.position !== undefined) patch.position = dto.position;
    if (dto.is_active !== undefined) patch.is_active = dto.is_active;
    if (dto.youtube_url !== undefined) {
      const videoId = this.extractVideoId(dto.youtube_url);
      if (!videoId) throw new InvalidYoutubeUrlError();
      patch.youtube_url = dto.youtube_url;
      patch.video_id = videoId;
    }
    
    const updated = await this.repo.update(id, patch);

    await this.auditLog.write({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      ipAddress: context.ip,
      action: 'UPDATE',
      entityType: 'youtube_videos',
      entityId: video.id,
      oldValue: video,
      newValue: updated,
    });

    return updated;
  }
  
  private extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}

export class DeleteYoutubeVideoUseCase {
  constructor(
    private readonly repo: YoutubeVideoRepository,
    private readonly auditLog: IAuditLogRepository
  ) {}
  
  async execute(id: string, context: AdminAuditContext): Promise<void> {
    const video = await this.repo.findById(id);
    if (!video) throw new YoutubeVideoNotFoundError(id);
    await this.repo.delete(id);

    await this.auditLog.write({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      ipAddress: context.ip,
      action: 'SOFT_DELETE',
      entityType: 'youtube_videos',
      entityId: video.id,
      oldValue: video,
      newValue: null,
    });
  }
}

export class ReorderYoutubeVideosUseCase {
  constructor(private readonly repo: YoutubeVideoRepository) {}
  
  async execute(dto: ReorderYoutubeVideosDTO): Promise<void> {
    // In a real scenario we'd use a transaction, but for simplicity here:
    for (const item of dto.videos) {
      const video = await this.repo.findById(item.id);
      if (video) {
        await this.repo.update(item.id, { position: item.position });
      }
    }
  }
}
