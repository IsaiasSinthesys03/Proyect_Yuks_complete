import { FastifyInstance } from 'fastify';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { ipAllowlistMiddleware } from '../middlewares/ipAllowlistMiddleware';
import { registerAdminRateLimit } from '../middlewares/adminRateLimitMiddleware';
import { admin2faSetupMiddleware } from '../middlewares/admin2faSetupMiddleware';

/**
 * Plugin de Fastify: Rutas de Autenticación Administrativa (CMS-BE-01) + 2FA (Fase 29).
 *
 * `/register`, `/login` y `/2fa/verify` NO usan `adminMiddleware` (aún no hay
 * sesión). Se protegen perimetralmente con `ipAllowlistMiddleware` (Q22) +
 * rate limiting estricto (REQ-SEC-10).
 *
 * `/2fa/setup` y `/2fa/enable` (Fase 34) requieren el `setupToken` acotado que
 * emite el login cuando el admin AÚN NO tiene 2FA — NO un JWT de sesión (que no
 * existe hasta que el 2FA esté configurado y verificado). 2FA ineludible (REQ-SEC-09).
 *
 * Uso: fastify.register(buildAdminAuthRoutes(adminAuthController), { prefix: '/api/admin/auth' });
 */
export function buildAdminAuthRoutes(adminAuthController: AdminAuthController) {
  return async function adminAuthRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.addHook('preHandler', ipAllowlistMiddleware);
    await registerAdminRateLimit(fastify);

    fastify.post('/register', async (request, reply) => {
      return adminAuthController.register(request, reply);
    });

    fastify.post('/login', async (request, reply) => {
      return adminAuthController.login(request, reply);
    });

    // Segundo paso del login (tempToken + código TOTP). Sin sesión aún.
    fastify.post('/2fa/verify', async (request, reply) => {
      return adminAuthController.verify2fa(request, reply);
    });

    // Configuración de 2FA: requiere el setupToken acotado (no una sesión, que
    // no existe hasta configurar el 2FA). 2FA INELUDIBLE (Fase 34, C-03).
    fastify.post('/2fa/setup', { preHandler: admin2faSetupMiddleware }, async (request, reply) => {
      return adminAuthController.setup2fa(request, reply);
    });

    fastify.post('/2fa/enable', { preHandler: admin2faSetupMiddleware }, async (request, reply) => {
      return adminAuthController.enable2fa(request, reply);
    });
  };
}
