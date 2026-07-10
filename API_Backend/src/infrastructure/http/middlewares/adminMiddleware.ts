import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware de Autorización por Rol (RBAC).
 *
 * CRÍTICO: Debe registrarse SIEMPRE después de `authMiddleware` en la cadena
 * de `preHandler`. `authMiddleware` certifica QUIÉN eres (JWT válido);
 * este middleware certifica QUÉ PUEDES HACER (rol == 'ADMIN').
 *
 * DISEÑO DEFENSIVO: si `request.user` no existe (ej. alguien registró este
 * middleware sin `authMiddleware` antes, por error de configuración de
 * rutas), se rechaza igual — nunca se asume que el paso anterior se ejecutó.
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user || request.user.role !== 'ADMIN') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Se requieren privilegios de administrador para acceder a este recurso.',
    });
  }
}
