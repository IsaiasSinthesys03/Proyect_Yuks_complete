/**
 * Contexto del administrador autenticado que ejecutó una operación.
 *
 * Vive en el dominio porque es un concepto de negocio puro (quién hizo qué
 * desde qué IP) sin dependencia de ningún framework HTTP ni de persistencia.
 * Lo consumen:
 *   - `IAdminProductRepository` y otros puertos admin (capa Application).
 *   - `withAdminAuditContext` (infraestructura DB) — lo pasa a los triggers SQL.
 *   - `adminAuditContextMiddleware` (infraestructura HTTP) — lo construye desde el JWT.
 */
export interface AdminAuditContext {
  adminId: string;
  adminEmail: string;
  ip: string;
}
