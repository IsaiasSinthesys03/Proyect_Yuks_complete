import { ILegalDocumentRepository } from '../../../interfaces/ILegalDocumentRepository';
import { LegalDocument } from '../../../../domain/entities/LegalDocument';
import { UpdateLegalDocumentDTO } from '../../../../domain/types/LegalDocumentDTOs';
import { LegalDocumentNotFoundError } from '../../../../domain/errors/LegalDocumentErrors';
import { IAuditLogRepository } from '../../../interfaces/IAuditLogRepository';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';

/** Casos de uso del módulo de Textos Legales (Fase 30). */

export class ListLegalDocumentsUseCase {
  constructor(private readonly repo: ILegalDocumentRepository) {}
  execute(): Promise<LegalDocument[]> {
    return this.repo.findAll();
  }
}

export class GetLegalDocumentUseCase {
  constructor(private readonly repo: ILegalDocumentRepository) {}
  async execute(slug: string): Promise<LegalDocument> {
    const doc = await this.repo.findBySlug(slug);
    if (!doc) throw new LegalDocumentNotFoundError(slug);
    return doc;
  }
}

export class UpdateLegalDocumentUseCase {
  constructor(
    private readonly repo: ILegalDocumentRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}
  async execute(slug: string, dto: UpdateLegalDocumentDTO, context: AdminAuditContext): Promise<LegalDocument> {
    const previous = await this.repo.findBySlug(slug);
    if (!previous) throw new LegalDocumentNotFoundError(slug);
    const updated = await this.repo.update(slug, dto);
    if (!updated) throw new LegalDocumentNotFoundError(slug);
    await this.auditLogRepository.write({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'UPDATE',
      entityType: 'legal_documents',
      entityId: updated.id,
      oldValue: { ...previous },
      newValue: { ...updated },
      ipAddress: context.ip,
    });
    return updated;
  }
}
