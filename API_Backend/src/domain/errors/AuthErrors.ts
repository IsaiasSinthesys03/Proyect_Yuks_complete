/**
 * Errores de Dominio: Módulo de Autenticación.
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/** Se lanza cuando se intenta registrar un email que ya existe en el sistema. */
export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`El email "${email}" ya está registrado en el sistema.`);
    this.name = 'UserAlreadyExistsError';
  }
}

/** Se lanza cuando el email no existe o la contraseña no coincide. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Las credenciales proporcionadas son inválidas.');
    this.name = 'InvalidCredentialsError';
  }
}

/** Se lanza cuando un usuario baneado intenta autenticarse. */
export class UserBannedError extends Error {
  constructor(email: string) {
    super(`La cuenta "${email}" ha sido suspendida.`);
    this.name = 'UserBannedError';
  }
}

/** Se lanza cuando el código secreto de desarrollador es incorrecto (Easter Egg Admin). */
export class InvalidDeveloperCodeError extends Error {
  constructor() {
    super('El código de desarrollador proporcionado no es válido.');
    this.name = 'InvalidDeveloperCodeError';
  }
}

/** Se lanza cuando el usuario no acepta los términos y condiciones al registrarse. */
export class TermsNotAcceptedError extends Error {
  constructor() {
    super('Debe aceptar los términos y condiciones para registrarse.');
    this.name = 'TermsNotAcceptedError';
  }
}
