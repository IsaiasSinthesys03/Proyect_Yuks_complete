/**
 * DTOs del flujo de Recuperación de Contraseña (Fase 29).
 */

/** Paso 1: el usuario solicita el enlace de recuperación indicando su email. */
export interface ForgotPasswordDTO {
  email: string;
}

/** Paso 2: el usuario envía el token del enlace + su nueva contraseña. */
export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}
