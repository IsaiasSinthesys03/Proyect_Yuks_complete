import { FastifyInstance } from 'fastify';
import { DonationController } from '../controllers/DonationController';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware';

/**
 * Plugin de Fastify: Ruta pública de Donaciones (REQ-BE-09).
 *
 * Completamente pública — no requiere JWT.
 * La seguridad anti-fraude la garantiza Stripe + la idempotency key.
 *
 * Uso: fastify.register(buildDonationRoutes(donationController), { prefix: '/api' });
 */
export function buildDonationRoutes(donationController: DonationController) {
  return async function donationRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.post('/donate', { preHandler: optionalAuthMiddleware }, async (request, reply) => {
      return donationController.donate(request, reply);
    });

    fastify.get('/profile/donations', { preHandler: authMiddleware }, async (request, reply) => {
      return donationController.listMine(request, reply);
    });
  };
}
