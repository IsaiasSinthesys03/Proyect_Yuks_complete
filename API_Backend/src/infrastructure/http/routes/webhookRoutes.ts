import { FastifyInstance } from 'fastify';
import { WebhookController } from '../controllers/WebhookController';
import { registerRawBodyParser } from '../middlewares/rawBodyMiddleware';

/**
 * Plugin de Fastify: Ruta del Webhook de Stripe (REQ-BE-02).
 *
 * Completamente PÚBLICA — Stripe no envía JWT de usuario. La seguridad
 * se garantiza exclusivamente mediante verificación de firma HMAC dentro
 * del Use Case, usando el body raw preservado por `registerRawBodyParser`.
 *
 * El parser raw se registra DENTRO de este plugin encapsulado de Fastify,
 * por lo que solo afecta a estas rutas — el resto de la API sigue
 * parseando JSON normalmente.
 *
 * Uso: fastify.register(buildWebhookRoutes(webhookController), { prefix: '/api/webhooks' });
 */
export function buildWebhookRoutes(webhookController: WebhookController) {
  return async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
    registerRawBodyParser(fastify);

    fastify.post('/stripe', async (request, reply) => {
      return webhookController.handleStripeWebhook(request, reply);
    });
  };
}
