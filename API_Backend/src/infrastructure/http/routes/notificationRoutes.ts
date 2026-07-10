import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Rutas de la bandeja de notificaciones (Fase 32, REQ-FE-24). Requieren JWT.
 * Uso: fastify.register(buildNotificationRoutes(controller), { prefix: '/api/profile/notifications' });
 */
export function buildNotificationRoutes(controller: NotificationController) {
  return async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', authMiddleware);

    fastify.get('/', async (req, reply) => controller.list(req, reply));
    fastify.get('/unread-count', async (req, reply) => controller.unreadCount(req, reply));
    fastify.patch('/read-all', async (req, reply) => controller.readAll(req, reply));
    fastify.patch('/:id/read', async (req, reply) => controller.read(req, reply));
  };
}
