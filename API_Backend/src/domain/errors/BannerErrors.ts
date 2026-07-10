/**
 * Errores de Dominio: módulo de Banners (Fase 30).
 */

/** Banner inexistente. HTTP 404. */
export class BannerNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró el banner con id "${id}".`);
    this.name = 'BannerNotFoundError';
  }
}

/** Datos de banner inválidos (título/imagen faltantes, fechas incoherentes). HTTP 400. */
export class InvalidBannerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBannerError';
  }
}
