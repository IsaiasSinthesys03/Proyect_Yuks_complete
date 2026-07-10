import { FastifyInstance } from 'fastify';
import { AdminInventoryController } from '../controllers/AdminInventoryController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

/**
 * Rutas de lectura del catálogo administrativo (Fase 35). Cadena: ipAllowlist → auth → admin.
 * Se registra con prefijo `/api/admin` y define rutas absolutas dentro:
 *   - GET /api/admin/inventory  → Monitor Global de Inventario (CMS-FE-16)
 *   - GET /api/admin/products   → Listado admin de productos, incl. descontinuados (CMS-FE-06)
 *
 * Uso: fastify.register(buildAdminInventoryRoutes(controller), { prefix: '/api/admin' });
 */
export function buildAdminInventoryRoutes(controller: AdminInventoryController) {
  return async function adminInventoryRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    fastify.addHook('preHandler', authMiddleware);
    fastify.addHook('preHandler', adminMiddleware);

    fastify.get('/inventory', async (req, reply) => controller.inventory(req, reply));
    fastify.get('/products', async (req, reply) => controller.products(req, reply));
  };
}
