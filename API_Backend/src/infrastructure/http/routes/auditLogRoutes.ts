import { FastifyInstance } from 'fastify';
import { AuditLogController } from '../controllers/AuditLogController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/**
 * Plugin de Fastify: Rutas del Visor de Bitácora (CMS-FE-10).
 * Cadena completa de seguridad administrativa.
 *
 * Uso: fastify.register(buildAuditLogRoutes(auditLogController), { prefix: '/api/admin/audit-logs' });
 */
export function buildAuditLogRoutes(auditLogController: AuditLogController) {
  return async function auditLogRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    fastify.get('/', async (request, reply) => {
      return auditLogController.list(request, reply);
    });
  };
}
