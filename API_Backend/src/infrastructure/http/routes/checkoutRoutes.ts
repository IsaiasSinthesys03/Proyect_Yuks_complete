import { FastifyInstance } from 'fastify';
import { CheckoutController } from '../controllers/CheckoutController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkoutBodySchema } from '../schemas/validationSchemas';

/**
 * Plugin de Fastify: Ruta del Motor de Checkout (REQ-BE-01).
 * Protegida por JWT de usuario.
 *
 * Uso: fastify.register(buildCheckoutRoutes(checkoutController), { prefix: '/api' });
 */
export function buildCheckoutRoutes(checkoutController: CheckoutController) {
  return async function checkoutRoutes(fastify: FastifyInstance): Promise<void> {
    // GET /api/checkout/config — PÚBLICO (Fase 42): la barra de envío gratis del
    // carrito la ven también los invitados. No expone datos sensibles. Por eso el
    // authMiddleware pasó de hook de plugin a preHandler por-ruta en el POST.
    fastify.get('/checkout/config', async (request, reply) => {
      return checkoutController.getConfig(request, reply);
    });

    // Schema estricto (Fase 34): un body sin items/addressId/termsVersion, o con
    // tipos incorrectos, retorna 400 en la fase de validación — antes del Use Case.
    fastify.post('/checkout', { preHandler: authMiddleware, schema: { body: checkoutBodySchema } }, async (request, reply) => {
      return checkoutController.processCheckout(request, reply);
    });

    fastify.post('/checkout/coverage', { preHandler: authMiddleware }, async (request, reply) => {
      return checkoutController.checkCoverage(request, reply);
    });

    fastify.post('/checkout/validate-cart', async (request, reply) => {
      return checkoutController.validateCart(request, reply);
    });
  };
}
