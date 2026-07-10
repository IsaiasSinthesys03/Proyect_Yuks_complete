import { FastifyInstance } from 'fastify';

/**
 * Registra un Content-Type Parser que preserva el body como Buffer crudo.
 *
 * REQ-BE-02: La verificación de firma HMAC de Stripe (`stripe.webhooks.constructEvent`)
 * exige el body EXACTO tal como llegó por la red — cualquier serialización/parseo
 * JSON previo invalida la firma. Por eso este parser NO hace `JSON.parse`.
 *
 * Uso: llamar dentro de un plugin de Fastify encapsulado (ej. webhookRoutes)
 * para que el raw body solo aplique a esas rutas, no globalmente.
 */
export function registerRawBodyParser(fastify: FastifyInstance): void {
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_request, body, done) => {
      done(null, body);
    }
  );
}
