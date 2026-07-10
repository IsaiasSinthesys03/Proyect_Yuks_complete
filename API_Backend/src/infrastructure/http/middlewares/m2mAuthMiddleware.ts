import { FastifyRequest, FastifyReply } from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

// GAME_M2M_SECRET valida peticiones ENTRANTES del Game Server hacia este backend.
// (Distinto de GAME_API_M2M_TOKEN, que es el token que ESTE backend envía
// al llamar al Game Server vía GameApiClient — ver Q11 en Resolucion_Casos_Limite_v1.md).
const GAME_M2M_SECRET = process.env.GAME_M2M_SECRET || '';

/**
 * Middleware de Autenticación Máquina a Máquina (Q11).
 *
 * Protege el endpoint `/api/rewards/validate` consumido por el backend
 * del videojuego. Valida el header `Authorization: Bearer <token>` contra
 * el secreto estático `GAME_M2M_SECRET`. NO usa JWT de usuario.
 */
export async function m2mAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token M2M requerido. Usa el header: Authorization: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!GAME_M2M_SECRET || token !== GAME_M2M_SECRET) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token M2M inválido.',
    });
  }
}
