import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ADMIN_2FA_SETUP_SCOPE } from '../../../application/use_cases/admin/AdminLoginUseCase';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';

interface SetupTokenPayload {
  sub: string;
  scope: string;
}

/**
 * Middleware que autoriza SOLO el flujo de CONFIGURACIÓN de 2FA (Fase 34, C-03).
 *
 * Un admin sin 2FA no obtiene JWT de sesión, sino un `setupToken` (scope
 * `admin_2fa_setup`). Este middleware verifica ese token y adjunta el usuario a
 * `request.user`, permitiéndole llegar EXCLUSIVAMENTE a `/2fa/setup` y `/2fa/enable`.
 *
 * SEGURIDAD: rechaza cualquier token cuyo scope no sea exactamente el de setup —
 * un access token normal (u otro scope) NO puede usarse aquí, y viceversa.
 */
export async function admin2faSetupMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Se requiere el token de configuración de 2FA (setupToken).',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SetupTokenPayload;
    if (decoded.scope !== ADMIN_2FA_SETUP_SCOPE) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token inválido para la configuración de 2FA.',
      });
    }
    // Se adjunta el usuario para que los Use Cases (que revalidan el rol ADMIN
    // contra la BD) obtengan el `sub`.
    request.user = { sub: decoded.sub, role: 'ADMIN', email: '', iat: 0, exp: 0 };
  } catch {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'El token de configuración de 2FA es inválido o expiró.',
    });
  }
}
