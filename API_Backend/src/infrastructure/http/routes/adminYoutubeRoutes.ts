import { FastifyInstance } from 'fastify';
import { AdminYoutubeVideoController } from '../controllers/AdminYoutubeVideoController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

export function buildAdminYoutubeRoutes(controller: AdminYoutubeVideoController) {
  return async function adminYoutubeRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    fastify.get('/', async (request, reply) => controller.list(request, reply));
    fastify.post('/', async (request, reply) => controller.create(request, reply));
    fastify.put('/:id', async (request, reply) => controller.update(request, reply));
    fastify.delete('/:id', async (request, reply) => controller.remove(request, reply));
    fastify.patch('/reorder', async (request, reply) => controller.reorder(request, reply));
  };
}
