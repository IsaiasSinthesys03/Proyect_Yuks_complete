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
}
