import { FastifyInstance } from 'fastify';
import { AdminLegalController } from '../controllers/AdminLegalController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

/**
 * Rutas CMS de Textos Legales (Fase 30). Cadena: ipAllowlist → auth → admin.
 * Uso: fastify.register(buildAdminLegalRoutes(controller), { prefix: '/api/admin/legal' });
 */
export function buildAdminLegalRoutes(controller: AdminLegalController) {
  return async function adminLegalRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);

    fastify.get('/', async (req, reply) => controller.list(req, reply));
    fastify.get('/:slug', async (req, reply) => controller.get(req, reply));
    fastify.put('/:slug', async (req, reply) => controller.update(req, reply));
  };
}
