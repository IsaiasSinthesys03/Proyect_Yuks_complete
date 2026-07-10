/**
 * Errores de Dominio: Módulo de Autenticación Avanzada (Fase 29).
 *
 * Password recovery, Refresh Token Rotation, 2FA TOTP y OTP.
 * Los controladores traducen estos errores a códigos HTTP.
 *
 * NOTA SOBRE ANTI-ENUMERACIÓN: el flujo de "olvidé mi contraseña" NUNCA lanza
 * un error indicando que el email no existe. Devuelve 202 siempre. Por eso aquí
 * no hay un "EmailNotFoundError" — sería una fuga de información.
 */

// ─────────────── Recuperación de Contraseña ───────────────

/** Token de reseteo inexistente, ya usado o manipulado. HTTP 400. */
export class InvalidResetTokenError extends Error {
  constructor() {
    super('El enlace de recuperación es inválido o ya fue utilizado.');
    this.name = 'InvalidResetTokenError';
  }
}

/** Token de reseteo caducado. HTTP 400. */
export class ResetTokenExpiredError extends Error {
  constructor() {
    super('El enlace de recuperación ha expirado. Solicita uno nuevo.');
    this.name = 'ResetTokenExpiredError';
  }
}

// ─────────────── Refresh Token Rotation ───────────────

/**
 * Se detectó el reúso de un refresh token ya consumido. Esto indica un posible
 * robo de sesión: TODA la familia de tokens del usuario se invalida. HTTP 401.
 */
export class RefreshTokenReuseError extends Error {
  constructor() {
    super('Se detectó actividad sospechosa en tu sesión. Todas las sesiones fueron cerradas por seguridad. Inicia sesión nuevamente.');
    this.name = 'RefreshTokenReuseError';
  }
}

// ─────────────── 2FA (TOTP) ───────────────

/** El tempToken de 2FA es inválido, expiró o no tiene el scope correcto. HTTP 401. */
export class InvalidTempTokenError extends Error {
  constructor() {
    super('La sesión de verificación de dos factores expiró. Inicia sesión nuevamente.');
    this.name = 'InvalidTempTokenError';
  }
}

/** El código TOTP de 6 dígitos no coincide con la ventana de tiempo actual. HTTP 401. */
export class InvalidTwoFactorCodeError extends Error {
  constructor() {
    super('El código de verificación es incorrecto.');
    this.name = 'InvalidTwoFactorCodeError';
  }
}

/** Se intentó verificar/usar 2FA en una cuenta que no lo tiene activado. HTTP 409. */
export class TwoFactorNotEnabledError extends Error {
  constructor() {
    super('La autenticación de dos factores no está activada para esta cuenta.');
    this.name = 'TwoFactorNotEnabledError';
  }
}

/** Se intentó configurar 2FA cuando ya está activo. HTTP 409. */
export class TwoFactorAlreadyEnabledError extends Error {
  constructor() {
    super('La autenticación de dos factores ya está activada.');
    this.name = 'TwoFactorAlreadyEnabledError';
  }
}

// ─────────────── OTP (cambio email/teléfono) ───────────────

/** El código OTP es incorrecto (aún quedan intentos). HTTP 401. */
export class InvalidOtpError extends Error {
  constructor() {
    super('El código de verificación es incorrecto.');
    this.name = 'InvalidOtpError';
  }
}

/** No hay un OTP vigente, expiró, o se agotaron los intentos. HTTP 400. */
export class OtpNotValidError extends Error {
  constructor(message = 'El código de verificación expiró o no es válido. Solicita uno nuevo.') {
    super(message);
    this.name = 'OtpNotValidError';
  }
}

// ─────────────── OAuth ───────────────

/** Falló el intercambio del código de autorización con el proveedor OAuth. HTTP 502. */
export class OAuthExchangeError extends Error {
  constructor(message = 'No se pudo completar la autenticación con el proveedor externo.') {
    super(message);
    this.name = 'OAuthExchangeError';
  }
}
