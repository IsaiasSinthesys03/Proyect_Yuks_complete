import { FastifyInstance } from 'fastify';
import { WishlistController } from '../controllers/WishlistController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Rutas de Wishlist (REQ-FE-19, Fase 31). Todas requieren usuario autenticado.
 * Uso: fastify.register(buildWishlistRoutes(controller), { prefix: '/api/profile/wishlist' });
 */
export function buildWishlistRoutes(controller: WishlistController) {
  return async function wishlistRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', authMiddleware);

    fastify.get('/', async (req, reply) => controller.list(req, reply));
    fastify.post('/', async (req, reply) => controller.add(req, reply));
    fastify.delete('/:productId', async (req, reply) => controller.remove(req, reply));
  };
}
