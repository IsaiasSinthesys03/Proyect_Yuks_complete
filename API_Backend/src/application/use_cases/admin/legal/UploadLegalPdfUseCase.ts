import * as crypto from 'crypto';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { ILegalDocumentRepository } from '../../../interfaces/ILegalDocumentRepository';
import { IMediaStorageService } from '../../../interfaces/IMediaStorageService';
import { IAuditLogRepository } from '../../../interfaces/IAuditLogRepository';
import { LegalDocument } from '../../../../domain/entities/LegalDocument';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { InvalidLegalPdfError, LegalDocumentNotFoundError } from '../../../../domain/errors/LegalDocumentErrors';
import { StorageServiceError } from '../../../../domain/errors/MediaErrors';

const nextVersion = (version: string): string => {
  const match = String(version).match(/^(v?)(\d+)\.(\d+)$/i);
  return match ? `${match[1]}${match[2]}.${Number(match[3]) + 1}` : `${version}.1`;
};

/** Valida, almacena y publica el PDF oficial de un documento legal. */
export class UploadLegalPdfUseCase {
  constructor(
    private readonly repo: ILegalDocumentRepository,
    private readonly mediaStorage: IMediaStorageService,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(slug: string, fileBuffer: Buffer, context: AdminAuditContext): Promise<LegalDocument> {
    const previous = await this.repo.findBySlug(slug);
    if (!previous) throw new LegalDocumentNotFoundError(slug);

    const detected = await fileTypeFromBuffer(fileBuffer);
    if (detected?.mime !== 'application/pdf' || !fileBuffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new InvalidLegalPdfError();
    }

    const safeSlug = previous.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const filename = `legal-documents/${safeSlug}/${crypto.randomUUID()}.pdf`;

    let pdfUrl: string;
    try {
      pdfUrl = await this.mediaStorage.upload(fileBuffer, filename, 'application/pdf');
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : 'error desconocido';
      throw new StorageServiceError(detail);
    }

    const updated = await this.repo.update(previous.slug, {
      pdfUrl,
      version: nextVersion(previous.version),
    });
    if (!updated) throw new LegalDocumentNotFoundError(previous.slug);

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
