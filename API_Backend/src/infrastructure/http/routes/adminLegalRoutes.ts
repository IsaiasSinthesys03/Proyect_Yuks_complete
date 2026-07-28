import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { AdminLegalController } from '../controllers/AdminLegalController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/**
 * Rutas CMS de Textos Legales (Fase 30). Cadena: ipAllowlist → auth → admin.
 * Uso: fastify.register(buildAdminLegalRoutes(controller), { prefix: '/api/admin/legal' });
 */
export function buildAdminLegalRoutes(controller: AdminLegalController) {
  return async function adminLegalRoutes(fastify: FastifyInstance): Promise<void> {
    await fastify.register(multipart, {
      limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
    });
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    fastify.get('/', async (req, reply) => controller.list(req, reply));
    fastify.get('/:slug', async (req, reply) => controller.get(req, reply));
    fastify.put('/:slug', async (req, reply) => controller.update(req, reply));
    fastify.post('/:slug/pdf', async (req, reply) => controller.uploadDocumentPdf(req, reply));
  };
}
