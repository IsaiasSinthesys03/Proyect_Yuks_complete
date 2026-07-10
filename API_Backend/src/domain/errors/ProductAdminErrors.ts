// ==========================================
// Fase 22 — Errores del CMS de Catálogo
// ==========================================

/** 409 — La versión del producto ya no coincide: otro proceso lo modificó. */
export class OptimisticConcurrencyError extends Error {
  readonly statusCode = 409;
  constructor(entity: string, id: string) {
    super(
      `Conflicto de concurrencia en ${entity} (id=${id}). ` +
      'El recurso fue modificado por otra operación concurrente. ' +
      'Recarga el recurso e intenta de nuevo.'
    );
    this.name = 'OptimisticConcurrencyError';
  }
}

/** 409 — El SKU ya existe en el catálogo (constraint UNIQUE). */
export class DuplicateSkuError extends Error {
  readonly statusCode = 409;
  constructor(sku: string) {
    super(`El SKU '${sku}' ya existe en el catálogo.`);
    this.name = 'DuplicateSkuError';
  }
}

/** 400 — El precio debe ser mayor a cero. */
export class InvalidPriceError extends Error {
  readonly statusCode = 400;
  constructor() {
    super('El precio del producto debe ser mayor a 0.');
    this.name = 'InvalidPriceError';
  }
}

/** 404 — Categoría no encontrada (al crear/editar producto con categoryId). */
export class CategoryNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`La categoría con id='${id}' no existe.`);
    this.name = 'CategoryNotFoundError';
  }
}

/** 404 — Producto no encontrado (o ya eliminado) en contexto admin. */
export class ProductNotFoundAdminError extends Error {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`El producto con id='${id}' no existe o ya fue eliminado.`);
    this.name = 'ProductNotFoundAdminError';
  }
}

/** 404 — Variante no encontrada. */
export class VariantNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`La variante con id='${id}' no existe.`);
    this.name = 'VariantNotFoundError';
  }
}

/**
 * 409 — El ajuste de stock resultaría en stock negativo.
 * Se usa cuando `adjustStockDelta` con delta negativo excede el stock actual.
 */
export class InvalidStockDeltaError extends Error {
  readonly statusCode = 409;
  constructor() {
    super('El ajuste de stock resultaría en stock negativo. Verifica el delta e intenta de nuevo.');
    this.name = 'InvalidStockDeltaError';
  }
}
