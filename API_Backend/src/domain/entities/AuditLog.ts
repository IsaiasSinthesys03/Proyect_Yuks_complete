/**
 * Entidad de Dominio: AuditLog
 *
 * Representa una entrada inmutable de la bitácora de auditoría administrativa
 * (CMS-BE-06, REQ-BE-08 ampliado a acciones de CMS).
 *
 * INMUTABILIDAD: A nivel de base de datos, un trigger `BEFORE UPDATE OR DELETE`
 * bloquea incondicionalmente cualquier intento de alterar una fila ya escrita
 * (ver migración 009). A nivel de aplicación, `IAuditLogRepository` refuerza
 * esto estructuralmente: la interfaz JAMÁS expone `update` ni `delete`.
 *
 * La mayoría de las filas de esta tabla las genera un trigger SQL síncrono,
 * no código de aplicación — `IAuditLogRepository.write()` es el respaldo
 * manual para eventos que no corresponden a una mutación de fila (ej.
 * "el admin exportó un reporte").
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface AuditLog {
  readonly id: string;
  readonly adminId: string | null;
  readonly adminEmail: string;
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId: string;
  readonly oldValue: Record<string, unknown> | null;
  readonly newValue: Record<string, unknown> | null;
  readonly ipAddress: string;
  readonly createdAt: Date;
}

/**
 * Tipos de acción auditada.
 *
 * CREATE/UPDATE/SOFT_DELETE: generadas automáticamente por los triggers
 * de `products`, `product_variants`, `coupons`.
 * BAN: generada automáticamente por el trigger de `users.is_banned`.
 * REFUND: escrita manualmente por `ManualRefundUseCase` (Fase 25) — un
 * reembolso no es un UPDATE de fila simple, es una operación compuesta.
 */
export type AuditAction = 'CREATE' | 'UPDATE' | 'SOFT_DELETE' | 'REFUND' | 'BAN';
