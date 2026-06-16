import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';

/**
 * Payload decodificado del JWT tras la verificación exitosa.
 * Se adjunta a `request.user` para que los handlers posteriores
 * puedan acceder al usuario autenticado.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Extender la interfaz de FastifyRequest para incluir `user`
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

/**
 * Middleware de Autenticación JWT para Fastify.
 *
 * Extrae el token del header `Authorization: Bearer <token>`,
 * lo verifica contra el JWT_SECRET y adjunta el payload
 * decodificado a `request.user`.
 *
 * Si el token es inválido, expirado o ausente, responde con HTTP 401.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token de autenticación requerido. Usa el header: Authorization: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = decoded;
  } catch (err: any) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'El token ha expirado. Inicia sesión nuevamente.'
        : 'Token inválido o malformado.';

    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message,
    });
  }
}
