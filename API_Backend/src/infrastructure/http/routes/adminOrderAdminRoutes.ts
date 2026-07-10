import { FastifyInstance } from 'fastify';
import { AdminOrderAdminController } from '../controllers/AdminOrderAdminController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/**
 * Plugin de Fastify: Rutas CMS de Pedidos / Kanban (Fase 24).
 *
 * Cadena de seguridad en todos los endpoints:
 *   ipAllowlist → auth → admin → adminAuditContext
 *
 * Uso: fastify.register(buildAdminOrderAdminRoutes(controller), { prefix: '/api/admin/orders' });
 */
export function buildAdminOrderAdminRoutes(controller: AdminOrderAdminController) {
  return async function adminOrderAdminRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    /** Listar todos los pedidos con filtros opcionales (Kanban) */
    fastify.get('/', async (request, reply) => {
      return controller.listOrders(request, reply);
    });

    /** Actualizar estado de un pedido (máquina de estados estricta) */
    fastify.patch('/:id/status', async (request, reply) => {
      return controller.updateOrderStatus(request, reply);
    });
  };
}
