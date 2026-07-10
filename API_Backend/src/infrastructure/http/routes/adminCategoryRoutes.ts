import { FastifyInstance } from 'fastify';
import { AdminCategoryController } from '../controllers/AdminCategoryController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/**
 * Plugin de Fastify: Rutas CMS de Categorías (Fase 22).
 *
 * Cadena de seguridad completa en todos los endpoints:
 *   ipAllowlist → auth → admin → adminAuditContext
 *
 * Lectura de categorías: usar el endpoint público `GET /api/products/categories`.
 * Escritura admin (find-or-create): este plugin.
 *
 * Uso: fastify.register(buildAdminCategoryRoutes(controller), { prefix: '/api/admin/categories' });
 */
export function buildAdminCategoryRoutes(controller: AdminCategoryController) {
  return async function adminCategoryRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    /** Encontrar o crear categoría (idempotente) */
    fastify.post('/', async (request, reply) => {
      return controller.findOrCreate(request, reply);
    });
  };
}
