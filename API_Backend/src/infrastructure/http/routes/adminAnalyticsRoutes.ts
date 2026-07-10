import { FastifyInstance } from 'fastify';
import { AdminAnalyticsController } from '../controllers/AdminAnalyticsController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

/**
 * Rutas de Analytics del CMS (Fase 30). Cadena: ipAllowlist → auth → admin.
 * Uso: fastify.register(buildAdminAnalyticsRoutes(controller), { prefix: '/api/admin/analytics' });
 */
export function buildAdminAnalyticsRoutes(controller: AdminAnalyticsController) {
  return async function adminAnalyticsRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);

    fastify.get('/summary', async (req, reply) => controller.summary(req, reply));
    fastify.get('/sales-over-time', async (req, reply) => controller.salesOverTime(req, reply));
    fastify.get('/top-products', async (req, reply) => controller.topProducts(req, reply));
  };
}
