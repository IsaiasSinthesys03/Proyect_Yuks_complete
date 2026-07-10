import { db } from '../client';
import { IAuditLogRepository } from '../../../application/interfaces/IAuditLogRepository';
import { AuditLog, AuditAction } from '../../../domain/entities/AuditLog';
import { AuditLogFilterDTO, AuditLogDTO } from '../../../domain/types/AuditLogDTOs';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';

/**
 * Implementación concreta de IAuditLogRepository usando Kysely.
 *
 * Deliberadamente NO implementa `update`/`delete` — la interfaz no los
 * declara, así que es estructuralmente imposible agregarlos por accidente
 * sin violar el contrato. La inmutabilidad real, a nivel de BD, la impone
 * el trigger `trg_block_audit_log_mutation` (migración 009).
 */
export class AuditLogRepository implements IAuditLogRepository {
  async write(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    await db
      .insertInto('audit_logs')
      .values({
        admin_id: entry.adminId,
        admin_email: entry.adminEmail,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        old_value: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        new_value: entry.newValue ? JSON.stringify(entry.newValue) : null,
        ip_address: entry.ipAddress,
      })
      .execute();
  }

  async findAll(filter: AuditLogFilterDTO): Promise<PaginatedResponseDTO<AuditLogDTO>> {
    const offset = (filter.page - 1) * filter.limit;

    let baseQuery = db.selectFrom('audit_logs');

    if (filter.adminEmail) {
      baseQuery = baseQuery.where('admin_email', '=', filter.adminEmail);
    }
    if (filter.action) {
      baseQuery = baseQuery.where('action', '=', filter.action);
    }
    if (filter.entityType) {
      baseQuery = baseQuery.where('entity_type', '=', filter.entityType);
    }

    const countResult = await baseQuery
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();
    const total = Number(countResult.total);

    const rows = await baseQuery
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(filter.limit)
      .offset(offset)
      .execute();

    return {
      data: rows.map((row) => this.mapRowToDTO(row)),
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  private mapRowToDTO(row: {
    id: string;
    admin_email: string;
    action: string;
    entity_type: string;
    entity_id: string;
    old_value: unknown;
    new_value: unknown;
    ip_address: string;
    created_at: Date;
  }): AuditLogDTO {
    return {
      id: row.id,
      adminEmail: row.admin_email,
      action: row.action as AuditAction,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldValue: row.old_value as Record<string, unknown> | null,
      newValue: row.new_value as Record<string, unknown> | null,
      ipAddress: row.ip_address,
      createdAt: row.created_at,
    };
  }
}
