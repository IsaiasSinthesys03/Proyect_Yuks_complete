import { AuditAction } from '../entities/AuditLog';

/** Filtros de búsqueda del Visor de Bitácora (CMS-FE-10). */
export interface AuditLogFilterDTO {
  adminEmail?: string;
  action?: AuditAction;
  entityType?: string;
  page: number;
  limit: number;
}

/**
 * DTO de salida de una entrada de bitácora.
 *
 * Misma forma que la entidad `AuditLog` — se declara por separado para no
 * acoplar la forma de la respuesta HTTP a la entidad de dominio si en el
 * futuro divergen (ej. se quiera ocultar `adminId` en la respuesta pública).
 */
export interface AuditLogDTO {
  id: string;
  adminEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: Date;
}
