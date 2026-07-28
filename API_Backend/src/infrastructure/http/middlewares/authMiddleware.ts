import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../../database/client';

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

  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
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

  try {
    // Revocación inmediata por baneo: un JWT firmado antes de la suspensión
    // deja de ser utilizable sin esperar a su `exp`.
    const userStatus = await db
      .selectFrom('users')
      .select(['email', 'role', 'is_banned'])
      .where('id', '=', decoded.sub)
      .executeTakeFirst();

    if (!userStatus || userStatus.is_banned) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'La sesión fue revocada o la cuenta se encuentra suspendida.',
      });
    }

    // Defensa ante claims obsoletos/manipulados después de un cambio de rol/email.
    if (userStatus.role !== decoded.role || userStatus.email !== decoded.email) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'La sesión ya no corresponde al estado actual de la cuenta.',
      });
    }

    request.user = decoded;
  } catch (error) {
    console.error('[authMiddleware] No fue posible validar el estado de la cuenta:', error);
    return reply.status(503).send({
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'No fue posible validar la sesión en este momento.',
    });
  }
}

/** Permite anonimato; si se envía Bearer, exige que sea válido y no revocado. */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.headers.authorization) return;
  await authMiddleware(request, reply);
}
