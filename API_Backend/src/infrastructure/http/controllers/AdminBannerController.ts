import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateBannerUseCase,
  UpdateBannerUseCase,
  DeleteBannerUseCase,
  ListBannersUseCase,
} from '../../../application/use_cases/admin/banners/BannerUseCases';
import { CreateBannerDTO, UpdateBannerDTO } from '../../../domain/types/BannerDTOs';
import { BannerNotFoundError, InvalidBannerError } from '../../../domain/errors/BannerErrors';

/** Controlador CMS de Banners (Fase 30). */
export class AdminBannerController {
  constructor(
    private readonly createBanner: CreateBannerUseCase,
    private readonly updateBanner: UpdateBannerUseCase,
    private readonly deleteBanner: DeleteBannerUseCase,
    private readonly listBanners: ListBannersUseCase,
  ) {}

  async list(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const banners = await this.listBanners.execute();
    reply.status(200).send({ success: true, data: banners });
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const banner = await this.createBanner.execute(request.body as CreateBannerDTO);
      reply.status(201).send({ success: true, data: banner });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const banner = await this.updateBanner.execute(id, request.body as UpdateBannerDTO);
      reply.status(200).send({ success: true, data: banner });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      await this.deleteBanner.execute(id);
      reply.status(200).send({ success: true, message: 'Banner eliminado.' });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof InvalidBannerError) {
      return void reply.status(400).send({ success: false, error: err.message });
    }
    if (err instanceof BannerNotFoundError) {
      return void reply.status(404).send({ success: false, error: err.message });
    }
    console.error('[AdminBannerController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
