import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Plugin de Fastify: Rutas de Pedidos (REQ-FE-23).
 * TODAS las rutas están protegidas por JWT de usuario.
 *
 * Uso: fastify.register(buildOrderRoutes(orderController), { prefix: '/api/profile/orders' });
 */
export function buildOrderRoutes(orderController: OrderController) {
  return async function orderRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', authMiddleware);

    fastify.get('/', async (request, reply) => {
      return orderController.listOrders(request, reply);
    });

    fastify.get('/:id', async (request, reply) => {
      return orderController.getOrderDetail(request, reply);
    });

    fastify.post('/:id/cancel', async (request, reply) => {
      return orderController.cancelOrder(request, reply);
    });
  };
}
