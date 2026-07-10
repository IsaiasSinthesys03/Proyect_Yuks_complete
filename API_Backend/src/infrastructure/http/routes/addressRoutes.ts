import { FastifyInstance } from 'fastify';
import { AddressController } from '../controllers/AddressController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Plugin de Fastify: Rutas de la Libreta de Direcciones (REQ-FE-09, REQ-FE-17).
 * TODAS las rutas están protegidas por JWT de usuario.
 *
 * Uso: fastify.register(buildAddressRoutes(addressController), { prefix: '/api/profile/addresses' });
 */
export function buildAddressRoutes(addressController: AddressController) {
  return async function addressRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', authMiddleware);

    fastify.get('/', async (request, reply) => {
      return addressController.list(request, reply);
    });

    fastify.post('/', async (request, reply) => {
      return addressController.create(request, reply);
    });

    fastify.put('/:id', async (request, reply) => {
      return addressController.update(request, reply);
    });

    fastify.delete('/:id', async (request, reply) => {
      return addressController.delete(request, reply);
    });

    fastify.patch('/:id/default', async (request, reply) => {
      return addressController.setDefault(request, reply);
    });
  };
}
