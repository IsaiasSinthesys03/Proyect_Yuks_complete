import { FastifyInstance } from 'fastify';
import { AdminProductController } from '../controllers/AdminProductController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import { adminAuditContextMiddleware } from '../middlewares/adminAuditContextMiddleware';

/**
 * Plugin de Fastify: Rutas CMS de Catálogo — Productos y Variantes (Fase 22).
 *
 * Cadena de seguridad en todos los endpoints:
 *   ipAllowlist → auth → admin → adminAuditContext
 *
 * Uso: fastify.register(buildAdminProductRoutes(controller), { prefix: '/api/admin/products' });
 */
export function buildAdminProductRoutes(controller: AdminProductController) {
  return async function adminProductRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);
    fastify.addHook('preHandler', adminAuditContextMiddleware);

    // ==========================================
    // Productos
    // ==========================================

    /** Crear producto */
    fastify.post('/', async (request, reply) => {
      return controller.createProduct(request, reply);
    });

    /** Actualizar producto con OCC (body debe incluir `version`) */
    fastify.put('/:id', async (request, reply) => {
      return controller.updateProduct(request, reply);
    });

    /** Soft-delete de producto */
    fastify.delete('/:id', async (request, reply) => {
      return controller.softDeleteProduct(request, reply);
    });

    // ==========================================
    // Variantes (anidadas bajo el producto)
    // ==========================================

    /** Crear variante para un producto */
    fastify.post('/:id/variants', async (request, reply) => {
      return controller.createVariant(request, reply);
    });

    /** Actualizar SKU/talla/color de una variante */
    fastify.patch('/:id/variants/:variantId', async (request, reply) => {
      return controller.updateVariant(request, reply);
    });

    /** Ajustar stock por delta (positivo o negativo) */
    fastify.patch('/:id/variants/:variantId/stock', async (request, reply) => {
      return controller.adjustStock(request, reply);
    });
  };
}
