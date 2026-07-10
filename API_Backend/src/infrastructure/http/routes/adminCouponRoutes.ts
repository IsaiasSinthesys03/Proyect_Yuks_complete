import { FastifyInstance } from 'fastify';
import { AdminCouponController } from '../controllers/AdminCouponController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/**
 * Plugin de Fastify: Rutas CMS de Cupones (Fase 24).
 *
 * Cadena de seguridad en todos los endpoints:
 *   ipAllowlist → auth → admin → adminAuditContext
 *
 * Uso: fastify.register(buildAdminCouponRoutes(controller), { prefix: '/api/admin/coupons' });
 */
export function buildAdminCouponRoutes(controller: AdminCouponController) {
  return async function adminCouponRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    /** Listar cupones (Fase 30) */
    fastify.get('/', async (request, reply) => {
      return controller.listCoupons(request, reply);
    });

    /** Detalle de un cupón (Fase 30) */
    fastify.get('/:id', async (request, reply) => {
      return controller.getCoupon(request, reply);
    });

    /** Crear cupón */
    fastify.post('/', async (request, reply) => {
      return controller.createCoupon(request, reply);
    });

    /** Actualizar campos de un cupón */
    fastify.put('/:id', async (request, reply) => {
      return controller.updateCoupon(request, reply);
    });

    /** Invertir estado activo/inactivo del cupón */
    fastify.patch('/:id/toggle', async (request, reply) => {
      return controller.toggleCoupon(request, reply);
    });
  };
}
