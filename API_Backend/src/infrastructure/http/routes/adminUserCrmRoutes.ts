import { FastifyInstance } from 'fastify';
import { AdminUserCrmController } from '../controllers/AdminUserCrmController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/**
 * Plugin de Fastify: Rutas CMS de CRM de Usuarios (Fase 24).
 *
 * Cadena de seguridad en todos los endpoints:
 *   ipAllowlist → auth → admin → adminAuditContext
 *
 * Uso: fastify.register(buildAdminUserCrmRoutes(controller), { prefix: '/api/admin/users' });
 */
export function buildAdminUserCrmRoutes(controller: AdminUserCrmController) {
  return async function adminUserCrmRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    /** Listar todos los usuarios con paginación */
    fastify.get('/', async (request, reply) => {
      return controller.listUsers(request, reply);
    });

    /** Banear un usuario (protegido contra auto-ban en BanUserUseCase) */
    fastify.post('/:id/ban', async (request, reply) => {
      return controller.banUser(request, reply);
    });

    /** Desbanear un usuario */
    fastify.delete('/:id/ban', async (request, reply) => {
      return controller.unbanUser(request, reply);
    });
  };
}
