/**
 * Puerto del Servicio TOTP (Time-based One-Time Password, RFC 6238).
 *
 * Abstrae la generación de secretos y la verificación de códigos de 6 dígitos
 * para el 2FA de administradores. Los Use Cases dependen de esta interfaz, no
 * de la implementación concreta (crypto nativo / librería).
 */
export interface ITotpService {
  /** Genera un secreto aleatorio en Base32, listo para una app de autenticación. */
  generateSecret(): string;

  /**
   * Construye la URI `otpauth://totp/...` que las apps (Google Authenticator,
   * Authy) leen desde un QR.
   * @param secret  Secreto en Base32.
   * @param account Identificador visible (ej. el email del admin).
   * @param issuer  Nombre de la aplicación mostrado en la app de autenticación.
   */
  buildOtpAuthUri(secret: string, account: string, issuer: string): string;

  /**
   * Verifica un código de 6 dígitos contra el secreto, tolerando ±1 ventana de
   * 30s para compensar el desfase de reloj del cliente.
   * @returns true si el código es válido en la ventana actual (o adyacente).
   */
  verify(secret: string, token: string): boolean;
}
