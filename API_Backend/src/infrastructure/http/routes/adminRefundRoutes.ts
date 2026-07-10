import { FastifyInstance } from 'fastify';
import { AdminRefundController } from '../controllers/AdminRefundController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';
import { refundBodySchema } from '../schemas/validationSchemas';

/**
 * Plugin de Fastify: Rutas CMS de Reembolsos (Fase 25).
 *
 * Cadena de seguridad (5 capas para operación financiera):
 *   ipAllowlist → auth (JWT) → admin (RBAC) → adminAuditContext → Argon2 re-auth (en use case)
 *
 * Registro:
 *   fastify.register(buildAdminRefundRoutes(controller), { prefix: '/api/admin/orders' });
 *   → URL final: POST /api/admin/orders/:id/refund
 *
 * Se registra bajo el prefijo /api/admin/orders (no un plugin separado)
 * porque el refund es semánticamente una acción sobre un pedido.
 */
export function buildAdminRefundRoutes(controller: AdminRefundController) {
  return async function adminRefundRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    /**
     * Ejecutar un reembolso manual sobre un pedido.
     * Requiere re-autenticación con contraseña actual del admin.
     *
     * Body: { amount: number, reason: string, currentPassword: string }
     */
    fastify.post('/:id/refund', { schema: { body: refundBodySchema } }, async (request, reply) => {
      return controller.processRefund(request, reply);
    });
  };
}
