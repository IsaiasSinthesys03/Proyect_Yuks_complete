import { FastifyRequest, FastifyReply } from 'fastify';
import { GetActiveBannersUseCase } from '../../../application/use_cases/admin/banners/BannerUseCases';
import { GetLegalDocumentUseCase } from '../../../application/use_cases/admin/legal/LegalDocumentUseCases';
import { LegalDocumentNotFoundError } from '../../../domain/errors/LegalDocumentErrors';

/**
 * Controlador Público de Contenido (Fase 30).
 *
 * Sirve el contenido que el storefront consume sin autenticación:
 *   - Banners activos y vigentes (para el carrusel del Landing).
 *   - Documentos legales por slug (términos, privacidad, etc.).
 */
export class PublicContentController {
  constructor(
    private readonly getActiveBanners: GetActiveBannersUseCase,
    private readonly getLegalDocument: GetLegalDocumentUseCase,
  ) {}

  /** GET /api/content/banners — banners activos y vigentes. */
  async banners(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const banners = await this.getActiveBanners.execute();
    reply.status(200).send({ success: true, data: banners });
  }

  /** GET /api/content/home-videos — videos activos de youtube para la landing page. */
  async youtubeVideos(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Avoid circular dependencies, import here or pass it in constructor
      const repo = new (require('../../../infrastructure/database/repositories/YoutubeVideoRepository').YoutubeVideoRepository)(
        require('../../../infrastructure/database/client').db
      );
      const videos = await repo.findActive();
      reply.status(200).send({ success: true, data: videos });
    } catch (err) {
      console.error('[PublicContentController.youtubeVideos]', err);
      reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
    }
  }

  /** GET /api/content/legal/:slug — documento legal público. */
  async legal(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { slug } = request.params as { slug: string };
      const doc = await this.getLegalDocument.execute(slug);
      reply.status(200).send({ success: true, data: doc });
    } catch (err) {
      if (err instanceof LegalDocumentNotFoundError) {
        return void reply.status(404).send({ success: false, error: err.message });
      }
      console.error('[PublicContentController]', err);
      reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
    }
  }

  /** GET /api/content/store-config — configuración pública (redes, whatsapp, etc.) */
  async storeConfig(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const repo = new (require('../../../infrastructure/database/repositories/SystemSettingsRepository').SystemSettingsRepository)(
        require('../../../infrastructure/cache/redis-client').redisConnection
      );
      const allSettings = await repo.getAll();
      const publicSettings = {
        socialFacebookUrl: allSettings.socialFacebookUrl,
        socialInstagramUrl: allSettings.socialInstagramUrl,
        socialTwitterUrl: allSettings.socialTwitterUrl,
        supportWhatsapp: allSettings.supportWhatsapp,
        supportEmail: allSettings.supportEmail,
      };
      reply.status(200).send({ success: true, data: publicSettings });
    } catch (err) {
      console.error('[PublicContentController.storeConfig]', err);
      reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
    }
  }
}
