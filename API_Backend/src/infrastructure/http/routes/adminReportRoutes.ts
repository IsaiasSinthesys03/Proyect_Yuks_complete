import { FastifyInstance } from 'fastify';
import { AdminReportController } from '../controllers/AdminReportController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

/**
 * Rutas de Reportes del CMS (CMS-BE-05, Fase 31). Cadena: ipAllowlist → auth → admin.
 * Uso: fastify.register(buildAdminReportRoutes(controller), { prefix: '/api/admin/reports' });
 */
export function buildAdminReportRoutes(controller: AdminReportController) {
  return async function adminReportRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);

    fastify.post('/', async (req, reply) => controller.generate(req, reply));
    fastify.get('/:jobId/download', async (req, reply) => controller.download(req, reply));
  };
}
