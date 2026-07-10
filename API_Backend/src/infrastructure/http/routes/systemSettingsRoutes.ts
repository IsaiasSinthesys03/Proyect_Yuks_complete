import { FastifyInstance } from 'fastify';
import { SystemSettingsController } from '../controllers/SystemSettingsController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/**
 * Plugin de Fastify: Rutas de Configuración Global (CMS-FE-11).
 * Cadena completa de seguridad administrativa.
 *
 * Uso: fastify.register(buildSystemSettingsRoutes(systemSettingsController), { prefix: '/api/admin/settings' });
 */
export function buildSystemSettingsRoutes(systemSettingsController: SystemSettingsController) {
  return async function systemSettingsRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    fastify.get('/', async (request, reply) => {
      return systemSettingsController.get(request, reply);
    });

    fastify.put('/', async (request, reply) => {
      return systemSettingsController.update(request, reply);
    });

    // Fase 31 — Cambio del Código de Desarrollador con Re-Auth defensivo.
    fastify.put('/developer-code', async (request, reply) => {
      return systemSettingsController.changeDeveloperCode(request, reply);
    });
  };
}
