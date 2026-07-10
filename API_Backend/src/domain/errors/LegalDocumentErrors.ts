/**
 * Errores de Dominio: módulo de Textos Legales (Fase 30).
 */

/** Documento legal inexistente para el slug dado. HTTP 404. */
export class LegalDocumentNotFoundError extends Error {
  constructor(slug: string) {
    super(`No se encontró el documento legal "${slug}".`);
    this.name = 'LegalDocumentNotFoundError';
  }
}
