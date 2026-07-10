import { IAuditLogRepository } from '../../interfaces/IAuditLogRepository';
import { AuditLogFilterDTO, AuditLogDTO } from '../../../domain/types/AuditLogDTOs';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';

/** Caso de Uso: Consultar la Bitácora de Auditoría (CMS-FE-10). */
export class GetAuditLogsUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(filter: AuditLogFilterDTO): Promise<PaginatedResponseDTO<AuditLogDTO>> {
    return this.auditLogRepository.findAll(filter);
  }
}
