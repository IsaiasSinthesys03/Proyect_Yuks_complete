import { FastifyInstance } from 'fastify';
import { WalletController } from '../controllers/WalletController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Plugin de Fastify: Rutas del Monedero Virtual (REQ-FE-20).
 * TODAS las rutas están protegidas por JWT de usuario.
 *
 * Uso: fastify.register(buildWalletRoutes(walletController), { prefix: '/api/profile/wallet' });
 */
export function buildWalletRoutes(walletController: WalletController) {
  return async function walletRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', authMiddleware);

    fastify.get('/', async (request, reply) => {
      return walletController.getSummary(request, reply);
    });

    fastify.get('/transactions', async (request, reply) => {
      return walletController.getLedger(request, reply);
    });
  };
}
