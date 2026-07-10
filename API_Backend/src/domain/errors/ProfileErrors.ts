/**
 * Errores de Dominio: Módulo de Perfil Autenticado (REQ-FE-16).
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/**
 * Se lanza cuando el payload de actualización de perfil intenta modificar
 * `email` o `phone` directamente, sin pasar por el flujo de verificación OTP.
 * HTTP 422 Unprocessable Entity.
 */
export class OtpVerificationRequiredError extends Error {
  constructor(field: 'email' | 'phone') {
    super(`La modificación del campo "${field}" requiere verificación OTP. Este flujo se implementará por separado.`);
    this.name = 'OtpVerificationRequiredError';
  }
}
