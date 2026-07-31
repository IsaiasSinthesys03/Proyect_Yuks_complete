import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { registerBodySchema, resetPasswordBodySchema, STRICT_RATE_LIMIT } from '../schemas/validationSchemas';

/**
 * Plugin de Fastify: Rutas de Autenticación.
 *
 * Registra las rutas públicas de Auth bajo el prefijo definido en el servidor.
 * Recibe el AuthController ya inyectado desde el Composition Root (main.ts),
 * respetando la Inversión de Dependencias.
 *
 * Uso:
 *   fastify.register(buildAuthRoutes(authController), { prefix: '/api/auth' });
 */
export function buildAuthRoutes(authController: AuthController) {
  return async function authRoutes(fastify: FastifyInstance): Promise<void> {
    // --- Rutas Públicas (no requieren JWT) ---

    // Registro con validación de schema (Fase 34): body inválido → 400 antes del Use Case.
    fastify.post('/register', { schema: { body: registerBodySchema } }, async (request, reply) => {
      return authController.register(request, reply);
    });

    fastify.post('/login', async (request, reply) => {
      return authController.login(request, reply);
    });

    // POST /api/auth/refresh — lee la cookie HttpOnly `refreshToken` (Q19).
    // Path de la cookie restringido a esta misma ruta (ver AuthController).
    fastify.post('/refresh', async (request, reply) => {
      return authController.refresh(request, reply);
    });

    fastify.post('/logout', async (request, reply) => {
      return authController.logout(request, reply);
    });

    // --- Recuperación de Contraseña (Fase 29, anti-enumeración) ---
    // Rate limit HIPER-ESTRICTO (5/min, Fase 34): frena spam de correos de reseteo
    // y ataques de fuerza bruta sobre tokens, independiente del límite global.
    fastify.post('/forgot-password', { config: STRICT_RATE_LIMIT }, async (request, reply) => {
      return authController.forgotPassword(request, reply);
    });

    fastify.post('/reset-password', {
      config: STRICT_RATE_LIMIT,
      schema: { body: resetPasswordBodySchema },
    }, async (request, reply) => {
      return authController.resetPassword(request, reply);
    });

    // --- OAuth 2.0 Google (Fase 29) ---
    fastify.get('/oauth/google', async (request, reply) => {
      return authController.googleRedirect(request, reply);
    });

    fastify.get('/oauth/google/callback', async (request, reply) => {
      return authController.googleCallback(request, reply);
    });

    // --- OTP para cambio de email/teléfono (REQ-FE-16) — requieren JWT ---
    // El envío de OTP lleva rate limit estricto (5/min): frena el abuso del envío
    // de códigos (spam de emails / enumeración). REQ-SEC-10.
    fastify.post('/otp/request', { preHandler: authMiddleware, config: STRICT_RATE_LIMIT }, async (request, reply) => {
      return authController.requestOtp(request, reply);
    });

    fastify.post('/otp/verify', { preHandler: authMiddleware, config: STRICT_RATE_LIMIT }, async (request, reply) => {
      return authController.verifyOtp(request, reply);
    });
  };
}
