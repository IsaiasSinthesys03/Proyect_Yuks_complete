import { ILegalDocumentRepository } from '../../../interfaces/ILegalDocumentRepository';
import { LegalDocument } from '../../../../domain/entities/LegalDocument';
import { UpdateLegalDocumentDTO } from '../../../../domain/types/LegalDocumentDTOs';
import { LegalDocumentNotFoundError } from '../../../../domain/errors/LegalDocumentErrors';

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
  constructor(private readonly repo: ILegalDocumentRepository) {}
  async execute(slug: string, dto: UpdateLegalDocumentDTO): Promise<LegalDocument> {
    const updated = await this.repo.update(slug, dto);
    if (!updated) throw new LegalDocumentNotFoundError(slug);
    return updated;
  }
}
