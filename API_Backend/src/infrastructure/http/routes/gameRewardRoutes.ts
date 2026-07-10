import { FastifyInstance } from 'fastify';
import { RewardController } from '../controllers/RewardController';
import { m2mAuthMiddleware } from '../middlewares/m2mAuthMiddleware';
import { STRICT_RATE_LIMIT } from '../schemas/validationSchemas';

/**
 * Plugin de Fastify: Rutas del Game Bridge M2M (REQ-BE-05, Q11).
 * Consumidas por el backend del videojuego. Protegidas por token M2M
 * estático, NUNCA por JWT de usuario.
 *
 * Uso: fastify.register(buildGameRewardRoutes(rewardController), { prefix: '/api/game/rewards' });
 */
export function buildGameRewardRoutes(rewardController: RewardController) {
  return async function gameRewardRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', m2mAuthMiddleware);

    // Rate limit HIPER-ESTRICTO (5/min, Fase 34, REQ-SEC-10): el canje de UUIDs es
    // un endpoint crítico de fuerza bruta — se protege independientemente del global.
    fastify.post('/validate', { config: STRICT_RATE_LIMIT }, async (request, reply) => {
      return rewardController.validateReward(request, reply);
    });
  };
}
