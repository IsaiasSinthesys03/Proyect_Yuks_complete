import { FastifyInstance } from 'fastify';
import { ProfileController } from '../controllers/ProfileController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Plugin de Fastify: Rutas del Perfil Autenticado (REQ-FE-14, REQ-FE-15).
 * TODAS las rutas están protegidas por JWT de usuario.
 *
 * Uso: fastify.register(buildProfileRoutes(profileController), { prefix: '/api/profile' });
 */
export function buildProfileRoutes(profileController: ProfileController) {
  return async function profileRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', authMiddleware);

    fastify.get('/', async (request, reply) => {
      return profileController.getProfile(request, reply);
    });

    fastify.put('/', async (request, reply) => {
      return profileController.updateProfile(request, reply);
    });
  };
}
