/**
 * Errores de Dominio: Módulo de Catálogo de Productos.
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/** Se lanza cuando un producto no existe o está marcado como eliminado (Soft Delete). */
export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`El producto con ID "${productId}" no fue encontrado o ha sido descontinuado.`);
    this.name = 'ProductNotFoundError';
  }
}

/** Se lanza cuando una categoría referenciada no existe en el sistema. */
export class CategoryNotFoundError extends Error {
  constructor(categoryId: string) {
    super(`La categoría con ID "${categoryId}" no fue encontrada.`);
    this.name = 'CategoryNotFoundError';
  }
}

/**
 * Se lanza cuando una variante de producto no tiene stock suficiente
 * para satisfacer la cantidad solicitada.
 * Se usará en el motor de Checkout (REQ-BE-01) para prevenir race conditions.
 */
export class InsufficientStockError extends Error {
  constructor(sku: string, requested: number, available: number) {
    super(
      `Stock insuficiente para la variante "${sku}": ` +
      `solicitado ${requested}, disponible ${available}.`
    );
    this.name = 'InsufficientStockError';
  }
}

/**
 * Se lanza cuando se intenta crear una categoría con un nombre que ya existe
 * (comparación case-insensitive, respaldada por el constraint UNIQUE(LOWER(name)) en BD).
 */
export class DuplicateCategoryError extends Error {
  constructor(categoryName: string) {
    super(`Ya existe una categoría con el nombre "${categoryName}".`);
    this.name = 'DuplicateCategoryError';
  }
}
