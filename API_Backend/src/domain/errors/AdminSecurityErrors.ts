/**
 * Errores de Dominio: Seguridad Administrativa avanzada (Fase 31).
 */

/**
 * 401 — La re-autenticación falló al intentar cambiar el Código de Desarrollador.
 * Igual que en los reembolsos, la operación sensible NUNCA se ejecuta si la
 * contraseña actual del admin no se verifica primero.
 */
export class DeveloperCodeReauthFailedError extends Error {
  readonly statusCode = 401;
  constructor() {
    super('Contraseña incorrecta. Re-autenticación fallida. El código de desarrollador NO fue modificado.');
    this.name = 'DeveloperCodeReauthFailedError';
  }
}

/** 422 — El nuevo código de desarrollador no cumple la longitud mínima. */
export class WeakDeveloperCodeError extends Error {
  readonly statusCode = 422;
  constructor(minLength: number) {
    super(`El nuevo código de desarrollador debe tener al menos ${minLength} caracteres.`);
    this.name = 'WeakDeveloperCodeError';
  }
}
