/**
 * Errores de Dominio: Módulo de Seguridad Administrativa (Fase 21).
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/**
 * Se lanza cuando un usuario autenticado (JWT válido) intenta acceder a un
 * recurso administrativo sin tener `role === 'ADMIN'`.
 * HTTP 403 Forbidden.
 */
export class InsufficientPermissionsError extends Error {
  readonly statusCode = 403;
  constructor() {
    super('Se requieren privilegios de administrador para realizar esta acción.');
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Se lanza cuando el Código de Desarrollador no coincide con el hash
 * almacenado en `system_settings` (Q21). HTTP 401 Unauthorized.
 */
export class DeveloperCodeRequiredError extends Error {
  readonly statusCode = 401;
  constructor() {
    super('El código de desarrollador proporcionado no es válido.');
    this.name = 'DeveloperCodeRequiredError';
  }
}

/**
 * Se lanza cuando un administrador intenta banear su propia cuenta.
 * HTTP 422 Unprocessable Entity.
 */
export class SelfBanNotAllowedError extends Error {
  readonly statusCode = 422;
  constructor() {
    super('Un administrador no puede suspender su propia cuenta.');
    this.name = 'SelfBanNotAllowedError';
  }
}

/** 404 — El usuario objetivo no existe (ban/unban). */
export class UserNotFoundAdminError extends Error {
  readonly statusCode = 404;
  constructor(userId: string) {
    super(`El usuario con id='${userId}' no existe.`);
    this.name = 'UserNotFoundAdminError';
  }
}

/**
 * Se lanza cuando una acción crítica (ej. reembolso manual) exige
 * confirmar la contraseña actual del administrador, además del JWT,
 * y la confirmación falta o es incorrecta.
 * HTTP 401 Unauthorized.
 */
export class ReauthRequiredError extends Error {
  constructor() {
    super('Esta acción requiere confirmar tu contraseña actual.');
    this.name = 'ReauthRequiredError';
  }
}
