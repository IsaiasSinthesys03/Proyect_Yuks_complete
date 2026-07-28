import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateYoutubeVideoUseCase,
  UpdateYoutubeVideoUseCase,
  DeleteYoutubeVideoUseCase,
  ListYoutubeVideosUseCase,
  ReorderYoutubeVideosUseCase
} from '../../../application/use_cases/admin/youtube/YoutubeVideoUseCases';
import { CreateYoutubeVideoDTO, UpdateYoutubeVideoDTO, ReorderYoutubeVideosDTO } from '../../../domain/types/YoutubeVideoDTOs';
import { YoutubeVideoNotFoundError, InvalidYoutubeUrlError } from '../../../domain/errors/YoutubeVideoErrors';

export class AdminYoutubeVideoController {
  constructor(
    private readonly createVideo: CreateYoutubeVideoUseCase,
    private readonly updateVideo: UpdateYoutubeVideoUseCase,
    private readonly deleteVideo: DeleteYoutubeVideoUseCase,
    private readonly listVideos: ListYoutubeVideosUseCase,
    private readonly reorderVideos: ReorderYoutubeVideosUseCase,
  ) {}

  async list(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const videos = await this.listVideos.execute();
    reply.status(200).send({ success: true, data: videos });
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const video = await this.createVideo.execute(request.body as CreateYoutubeVideoDTO, request.adminContext!);
      reply.status(201).send({ success: true, data: video });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const video = await this.updateVideo.execute(id, request.body as UpdateYoutubeVideoDTO, request.adminContext!);
      reply.status(200).send({ success: true, data: video });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      await this.deleteVideo.execute(id, request.adminContext!);
      reply.status(200).send({ success: true, message: 'Video eliminado.' });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async reorder(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      await this.reorderVideos.execute(request.body as ReorderYoutubeVideosDTO);
      reply.status(200).send({ success: true, message: 'Videos reordenados.' });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof InvalidYoutubeUrlError) {
      return void reply.status(400).send({ success: false, error: err.message });
    }
    if (err instanceof YoutubeVideoNotFoundError) {
      return void reply.status(404).send({ success: false, error: err.message });
    }
    console.error('[AdminYoutubeVideoController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
