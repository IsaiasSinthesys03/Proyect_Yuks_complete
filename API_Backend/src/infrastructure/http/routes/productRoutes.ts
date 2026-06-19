import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/ProductController';

/**
 * Plugin de Fastify: Rutas del Catálogo de Productos.
 *
 * Registra las rutas públicas de productos bajo el prefijo definido en el servidor.
 * Recibe el ProductController ya inyectado desde el Composition Root (main.ts),
 * respetando la Inversión de Dependencias.
 *
 * IMPORTANTE — Orden de las rutas:
 * Las rutas estáticas (/top-sales, /categories) se registran ANTES que la
 * ruta dinámica (/:id) para evitar que Fastify las confunda con un parámetro UUID.
 *
 * Uso:
 *   fastify.register(buildProductRoutes(productController), { prefix: '/api/products' });
 */
export function buildProductRoutes(productController: ProductController) {
  return async function productRoutes(fastify: FastifyInstance): Promise<void> {
    // --- Rutas Públicas (no requieren JWT) ---

    // GET /api/products — Catálogo paginado + búsqueda + filtros
    fastify.get('/', async (request, reply) => {
      return productController.listProducts(request, reply);
    });

    // GET /api/products/top-sales — Top 10 más vendidos (Landing Page)
    fastify.get('/top-sales', async (request, reply) => {
      return productController.getTopProducts(request, reply);
    });

    // GET /api/products/categories — Lista de categorías para filtros
    fastify.get('/categories', async (request, reply) => {
      return productController.listCategories(request, reply);
    });

    // GET /api/products/:id — Detalle individual de producto + variantes
    fastify.get('/:id', async (request, reply) => {
      return productController.getProductDetail(request, reply);
    });
  };
}
