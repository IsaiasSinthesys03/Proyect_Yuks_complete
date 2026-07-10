import { AuditLog } from '../../domain/entities/AuditLog';
import { AuditLogFilterDTO, AuditLogDTO } from '../../domain/types/AuditLogDTOs';
import { PaginatedResponseDTO } from '../../domain/types/ProductDTOs';

/**
 * Puerto (Interfaz) del Repositorio de Bitácora de Auditoría.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE + INMUTABILIDAD ESTRUCTURAL:
 * Esta interfaz NO expone `update` ni `delete` — ni siquiera como firma.
 * Es imposible para un Use Case mutar una entrada de auditoría porque
 * el contrato de TypeScript no le da el método para hacerlo. La capa SQL
 * (migración 009) refuerza esto con un trigger que bloquea incondicionalmente
 * cualquier UPDATE/DELETE, como segunda capa de defensa.
 */
export interface IAuditLogRepository {
  /**
   * Escribe una entrada de auditoría manualmente.
   *
   * Uso EXCEPCIONAL: la mayoría de las entradas las genera un trigger SQL
   * síncrono (ver migración 009) cuando se muta una fila con contexto de
   * admin activo. Este método solo se usa para eventos que no corresponden
   * a una mutación de fila simple (ej. un reembolso compuesto, Fase 25).
   */
  write(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void>;

  /**
   * Lista las entradas de auditoría con filtros y paginación (CMS-FE-10).
   */
  findAll(filter: AuditLogFilterDTO): Promise<PaginatedResponseDTO<AuditLogDTO>>;
}
