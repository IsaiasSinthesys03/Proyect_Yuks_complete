/**
 * DTOs del flujo de OAuth 2.0 (Google) — Fase 29.
 */

/**
 * Perfil normalizado que un proveedor OAuth devuelve tras intercambiar el código.
 * Es agnóstico al proveedor concreto: Google, y potencialmente otros en el futuro.
 */
export interface OAuthProfile {
  /** Identificador único y estable del usuario en el proveedor (Google "sub"). */
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
}
