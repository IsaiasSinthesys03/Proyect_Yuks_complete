import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

/**
 * Registra `@fastify/rate-limit` con una política estricta, pensada para
 * proteger `/api/admin/auth/login` contra fuerza bruta (REQ-SEC-10).
 *
 * DECISIÓN DE DISEÑO: se usa el plugin oficial de Fastify en vez de un
 * `preHandler` artesanal — reimplementar rate limiting a mano (contadores
 * en memoria sin distribución, sin manejo correcto de ventanas deslizantes)
 * es, en sí mismo, un riesgo de seguridad. El plugin se registra DENTRO del
 * plugin encapsulado de las rutas de auth admin (mismo patrón que
 * `registerRawBodyParser` para los webhooks), de modo que el límite solo
 * aplica a esas rutas, sin penalizar el resto de la API.
 *
 * Política: máximo 5 intentos por minuto por IP. Al exceder el límite,
 * Fastify responde automáticamente HTTP 429 Too Many Requests.
 */
export async function registerAdminRateLimit(fastify: FastifyInstance): Promise<void> {
  await fastify.register(rateLimit, {
    max: 5,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en un minuto.',
    }),
  });
}
