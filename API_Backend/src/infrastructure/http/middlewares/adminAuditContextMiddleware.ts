import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminAuditContext } from '../../../domain/types/AdminTypes';

// Re-exportar para no romper imports existentes en la capa HTTP.
export { AdminAuditContext };

declare module 'fastify' {
  interface FastifyRequest {
    adminContext?: AdminAuditContext;
  }
}

/**
 * Middleware que adjunta el contexto de auditoría a `request.adminContext`.
 *
 * Se registra DESPUÉS de `authMiddleware` y `adminMiddleware` — en ese
 * punto `request.user` ya está garantizado. Este middleware NO toca la
 * base de datos; solo prepara los datos que los Controllers/Use Cases
 * pasarán a `withAdminAuditContext` cuando ejecuten una mutación.
 */
export async function adminAuditContextMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!request.user) return;

  request.adminContext = {
    adminId: request.user.sub,
    adminEmail: request.user.email,
    ip: request.ip,
  };
}
