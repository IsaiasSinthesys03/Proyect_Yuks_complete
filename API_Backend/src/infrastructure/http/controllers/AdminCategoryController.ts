import { FastifyRequest, FastifyReply } from 'fastify';
import { FindOrCreateCategoryUseCase } from '../../../application/use_cases/admin/catalog/FindOrCreateCategoryUseCase';

/**
 * Controlador HTTP para gestión de categorías desde el CMS admin.
 *
 * Deliberadamente delgado: el único endpoint de escritura es "find or create"
 * (idempotente). La lectura de categorías usa el endpoint público existente
 * `GET /api/products/categories`.
 */
export class AdminCategoryController {
  constructor(
    private readonly findOrCreateCategoryUseCase: FindOrCreateCategoryUseCase
  ) {}

  async findOrCreate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = request.adminContext!;
      const body = request.body as { name: string };

      if (!body.name || body.name.trim() === '') {
        return void reply.status(400).send({ success: false, error: 'El campo name es obligatorio.' });
      }

      const category = await this.findOrCreateCategoryUseCase.execute(
        { name: body.name.trim() },
        context
      );
      reply.status(200).send({ success: true, data: category });
    } catch (err) {
      console.error('[AdminCategoryController]', err);
      reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
    }
  }
}
