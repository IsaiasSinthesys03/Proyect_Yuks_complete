import { FastifyRequest, FastifyReply } from 'fastify';
import {
  GetInventoryMonitorUseCase,
  ListAdminProductsUseCase,
} from '../../../application/use_cases/admin/inventory/InventoryUseCases';

/** Controlador de lectura del catálogo administrativo (Fase 35, CMS-FE-16/CMS-FE-06). */
export class AdminInventoryController {
  constructor(
    private readonly getInventory: GetInventoryMonitorUseCase,
    private readonly listProducts: ListAdminProductsUseCase,
  ) {}

  /** GET /api/admin/inventory?page=&limit= */
  async inventory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const q = request.query as { page?: string; limit?: string };
    const page = q.page ? parseInt(q.page, 10) : undefined;
    const limit = q.limit ? parseInt(q.limit, 10) : undefined;
    const result = await this.getInventory.execute(page, limit);
    reply.status(200).send({ success: true, data: result });
  }

  /** GET /api/admin/products?page=&limit=&includeDeleted=true */
  async products(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const q = request.query as { page?: string; limit?: string; includeDeleted?: string };
    const page = q.page ? parseInt(q.page, 10) : undefined;
    const limit = q.limit ? parseInt(q.limit, 10) : undefined;
    const includeDeleted = q.includeDeleted === 'true';
    const result = await this.listProducts.execute(page, limit, includeDeleted);
    reply.status(200).send({ success: true, data: result });
  }
}
