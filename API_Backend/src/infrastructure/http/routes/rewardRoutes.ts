import { FastifyInstance } from 'fastify';
import { RewardController } from '../controllers/RewardController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Plugin de Fastify: Rutas de Recompensas del usuario (REQ-FE-22).
 * Protegidas por JWT de usuario.
 *
 * Uso: fastify.register(buildRewardRoutes(rewardController), { prefix: '/api/profile/rewards' });
 */
export function buildRewardRoutes(rewardController: RewardController) {
  return async function rewardRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', authMiddleware);

    fastify.get('/', async (request, reply) => {
      return rewardController.getUserRewards(request, reply);
    });
  };
}
