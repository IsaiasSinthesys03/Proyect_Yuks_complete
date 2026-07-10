/**
 * DTOs del flujo de 2FA TOTP para administradores (Fase 29).
 */

/** Respuesta de `Setup2faUseCase`: datos para que el admin registre su autenticador. */
export interface Setup2faResponseDTO {
  /** Secreto en Base32 — se puede teclear manualmente en la app de autenticación. */
  secret: string;
  /** URI `otpauth://` para renderizar como QR (Google Authenticator, Authy, etc.). */
  otpauthUri: string;
}

/** Payload para activar 2FA: el admin confirma que su autenticador funciona. */
export interface Enable2faDTO {
  code: string;
}

/**
 * Payload para superar el muro de 2FA en el login administrativo.
 * `tempToken` proviene de la respuesta del login (válido ~2 min).
 */
export interface Verify2faDTO {
  tempToken: string;
  code: string;
}
