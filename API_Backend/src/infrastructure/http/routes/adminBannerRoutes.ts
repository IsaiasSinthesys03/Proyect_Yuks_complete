import { FastifyInstance } from 'fastify';
import { AdminBannerController } from '../controllers/AdminBannerController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

/**
 * Rutas CMS de Banners (Fase 30). Cadena: ipAllowlist → auth → admin.
 * Uso: fastify.register(buildAdminBannerRoutes(controller), { prefix: '/api/admin/banners' });
 */
export function buildAdminBannerRoutes(controller: AdminBannerController) {
  return async function adminBannerRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);

    fastify.get('/', async (req, reply) => controller.list(req, reply));
    fastify.post('/', async (req, reply) => controller.create(req, reply));
    fastify.put('/:id', async (req, reply) => controller.update(req, reply));
    fastify.delete('/:id', async (req, reply) => controller.remove(req, reply));
  };
}
