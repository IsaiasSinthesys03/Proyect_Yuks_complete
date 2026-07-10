/**
 * DTOs del módulo de Textos Legales (Fase 30).
 */

/** Actualización de un documento legal por parte del admin. */
export interface UpdateLegalDocumentDTO {
  title?: string;
  content?: string;
  version?: string;
}
