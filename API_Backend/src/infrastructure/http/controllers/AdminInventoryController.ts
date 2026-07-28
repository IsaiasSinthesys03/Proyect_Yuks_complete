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

  /** GET /api/admin/inventory?page=&limit=&search=&status= */
  async inventory(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const q = request.query as { page?: string; limit?: string; search?: string; status?: string };
    const page = q.page ? parseInt(q.page, 10) : undefined;
    const limit = q.limit ? parseInt(q.limit, 10) : undefined;
    const result = await this.getInventory.execute(page, limit, q.search, q.status);
    reply.status(200).send({ success: true, data: result });
  }

  /** GET /api/admin/products?page=&limit=&includeDeleted=true&search=&status= */
  async products(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const q = request.query as { page?: string; limit?: string; includeDeleted?: string; search?: string; status?: string };
    const page = q.page ? parseInt(q.page, 10) : undefined;
    const limit = q.limit ? parseInt(q.limit, 10) : undefined;
    const includeDeleted = q.includeDeleted === 'true' || q.status === 'ARCHIVED' || q.status === 'ALL';
    const result = await this.listProducts.execute(page, limit, includeDeleted, q.search, q.status);
    reply.status(200).send({ success: true, data: result });
  }
}
