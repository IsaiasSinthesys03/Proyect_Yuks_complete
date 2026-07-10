import { FastifyInstance } from 'fastify';
import { AdminDonationController } from '../controllers/AdminDonationController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

/**
 * Plugin de Fastify: Rutas de Donaciones para el CMS (CMS-FE-13).
 *
 * Protegido con la cadena completa de seguridad administrativa:
 *   IP Allowlist → JWT Admin → Rol ADMIN
 *
 * Uso: fastify.register(buildAdminDonationRoutes(controller), { prefix: '/api/admin/donations' });
 */
export function buildAdminDonationRoutes(adminDonationController: AdminDonationController) {
  return async function adminDonationRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);

    fastify.get('/', async (request, reply) => {
      return adminDonationController.listDonations(request, reply);
    });
  };
}
