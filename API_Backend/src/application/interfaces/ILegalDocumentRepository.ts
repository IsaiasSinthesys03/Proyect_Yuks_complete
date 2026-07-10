import { LegalDocument } from '../../domain/entities/LegalDocument';
import { UpdateLegalDocumentDTO } from '../../domain/types/LegalDocumentDTOs';

/**
 * Puerto del repositorio de Textos Legales (Fase 30).
 */
export interface ILegalDocumentRepository {
  /** Lista todos los documentos legales (vista admin). */
  findAll(): Promise<LegalDocument[]>;

  /** Obtiene un documento por su slug. `null` si no existe. */
  findBySlug(slug: string): Promise<LegalDocument | null>;

  /** Actualiza un documento por slug. Devuelve null si el slug no existe. */
  update(slug: string, data: UpdateLegalDocumentDTO): Promise<LegalDocument | null>;
}
