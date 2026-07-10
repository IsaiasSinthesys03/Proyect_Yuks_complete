import { FastifyInstance } from 'fastify';
import { CouponController } from '../controllers/CouponController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Plugin de Fastify: Rutas de Cupones (CMS-FE-15, REQ-FE-21).
 * TODAS las rutas están protegidas por JWT de usuario.
 *
 * Uso: fastify.register(buildCouponRoutes(couponController), { prefix: '/api/profile/coupons' });
 */
export function buildCouponRoutes(couponController: CouponController) {
  return async function couponRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', authMiddleware);

    // GET /api/profile/coupons — cupones vigentes con `expiresAt` real para
    // la cuenta regresiva FOMO del perfil (Fase 44, REQ-FE-21).
    fastify.get('/', async (request, reply) => {
      return couponController.listAvailable(request, reply);
    });

    fastify.post('/redeem', async (request, reply) => {
      return couponController.redeem(request, reply);
    });
  };
}
