import * as crypto from 'crypto';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { IBannerRepository } from '../../../interfaces/IBannerRepository';
import { IMediaStorageService } from '../../../interfaces/IMediaStorageService';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { BannerNotFoundError } from '../../../../domain/errors/BannerErrors';
import {
  UnsupportedMediaTypeError,
  StorageServiceError,
} from '../../../../domain/errors/MediaErrors';

const ALLOWED_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']);

export class UploadBannerVideoUseCase {
  constructor(
    private readonly repo: IBannerRepository,
    private readonly mediaStorage: IMediaStorageService,
  ) {}

  async execute(
    bannerId: string,
    fileBuffer: Buffer,
    context: AdminAuditContext,
  ): Promise<{ videoUrl: string }> {
    const banner = await this.repo.findById(bannerId);
    if (!banner) throw new BannerNotFoundError(bannerId);

    const detected = await fileTypeFromBuffer(fileBuffer);
    const mimeType = detected?.mime ?? 'application/octet-stream';

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new UnsupportedMediaTypeError(mimeType);
    }

    const extension = detected?.ext ?? 'bin';
    const safeFilename = `banner-bg-${crypto.randomUUID()}.${extension}`;

    let videoUrl: string;
    try {
      videoUrl = await this.mediaStorage.upload(fileBuffer, safeFilename, mimeType);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      throw new StorageServiceError(message);
    }

    await this.repo.update(bannerId, { videoUrl });

    return { videoUrl };
  }
}
