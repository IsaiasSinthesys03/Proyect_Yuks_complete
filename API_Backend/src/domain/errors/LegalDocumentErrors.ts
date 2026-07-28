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

/** El archivo recibido no es un PDF real según su firma binaria. */
export class InvalidLegalPdfError extends Error {
  readonly statusCode = 415;
  constructor() {
    super('El archivo no es un PDF válido. Solo se aceptan documentos application/pdf.');
    this.name = 'InvalidLegalPdfError';
  }
}
