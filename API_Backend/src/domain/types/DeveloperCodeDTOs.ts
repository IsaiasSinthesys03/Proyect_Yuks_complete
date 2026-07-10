/**
 * DTO del cambio de Código de Desarrollador con Re-Auth (Fase 31).
 */
export interface ChangeDeveloperCodeDTO {
  /** Contraseña ACTUAL del admin — obligatoria para la re-autenticación defensiva. */
  currentPassword: string;
  /** Nuevo código de desarrollador (se almacena solo su hash Argon2id). */
  newCode: string;
}
