import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { AdminMediaController } from '../controllers/AdminMediaController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/** Límite de tamaño de archivo: 8 MB. Defensa en la primera línea (antes de leer el stream). */
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

/**
 * Plugin de Fastify: Rutas CMS de Media — Upload de Imágenes (Fase 23).
 *
 * `@fastify/multipart` se registra AQUÍ (scope del plugin), NO globalmente.
 * Esto garantiza que solo estas rutas parseen multipart/form-data, reduciendo
 * la superficie de ataque del resto de la API.
 *
 * Cadena de seguridad completa en todos los endpoints:
 *   ipAllowlist → auth → admin → adminAuditContext
 *
 * Uso: fastify.register(buildAdminMediaRoutes(controller), { prefix: '/api/admin/products' });
 */
export function buildAdminMediaRoutes(controller: AdminMediaController) {
  return async function adminMediaRoutes(fastify: FastifyInstance): Promise<void> {

    // Registrar multipart SOLO en este plugin (scope aislado).
    // `limits.fileSize` actúa como primera línea de defensa ante archivos gigantes:
    // el stream se trunca antes de llenarse la memoria del proceso.
    await fastify.register(multipart, {
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,    // Máximo 1 archivo por request
        fields: 0,   // No se aceptan campos de texto adicionales
        parts: 1,    // 1 parte total (el archivo)
      },
    });

    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    /**
     * POST /api/admin/products/:id/image
     *
     * Body: multipart/form-data con un campo "image" (JPEG, PNG o WEBP, máx 8 MB).
     * SVG y cualquier otro tipo es rechazado con HTTP 415.
     *
     * Pipeline interno:
     *   1. Límite de 8 MB por @fastify/multipart (stream truncation)
     *   2. Magic number via file-type (no extensión)
     *   3. Rechazo explícito de SVG e imágenes no JPEG/PNG/WEBP
     *   4. sharp con failOn:'error' (anti-decompression-bomb)
     *   5. Límite de dimensiones 8000×8000px
     *   6. Resize a 1080×1080 WEBP, quality 85
     *   7. Nombre UUID aleatorio (anti path-traversal)
     *   8. Upload a S3
     *   9. Actualización de product.image_url con audit log
     */
    fastify.post('/:id/image', async (request, reply) => {
      return controller.uploadProductImage(request, reply);
    });
  };
}
