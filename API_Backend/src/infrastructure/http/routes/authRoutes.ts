import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';

/**
 * Plugin de Fastify: Rutas de Autenticación.
 *
 * Registra las rutas públicas de Auth bajo el prefijo definido en el servidor.
 * Recibe el AuthController ya inyectado desde el Composition Root (main.ts),
 * respetando la Inversión de Dependencias.
 *
 * Uso:
 *   fastify.register(buildAuthRoutes(authController), { prefix: '/api/auth' });
 */
export function buildAuthRoutes(authController: AuthController) {
  return async function authRoutes(fastify: FastifyInstance): Promise<void> {
    // --- Rutas Públicas (no requieren JWT) ---

    fastify.post('/register', async (request, reply) => {
      return authController.register(request, reply);
    });

    fastify.post('/login', async (request, reply) => {
      return authController.login(request, reply);
    });
  };
}
