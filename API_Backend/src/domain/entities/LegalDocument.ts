/**
 * Entidad de Dominio: LegalDocument
 *
 * Texto legal versionado gestionable desde el CMS (Fase 30). El `slug`
 * identifica el documento ('terms', 'privacy', 'shipping', 'returns'). La
 * `version` se sella en cada pedido (`terms_version`, REQ-BE-08) para el audit
 * trail de cumplimiento.
 */
export interface LegalDocument {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly pdfUrl?: string | null;
  readonly version: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
