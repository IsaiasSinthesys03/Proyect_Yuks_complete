/**
 * Data Transfer Objects para Autenticación Administrativa (CMS-BE-01).
 *
 * Separados de `AuthDTOs.ts` (autenticación de clientes) porque el flujo de
 * admin tiene reglas propias: TTL de sesión distinto (8h vs 15min) y el
 * Easter Egg del Código de Desarrollador, que NUNCA aplica a clientes.
 */

/**
 * Payload para registrar un nuevo administrador (Easter Egg del CMS).
 *
 * `developerCode` se valida contra el hash Argon2id almacenado en
 * `system_settings` (Q21) — JAMÁS se compara como texto plano.
 * `role` NO es un campo de este DTO a propósito: `RegisterAdminUseCase`
 * hardcodea `role: 'ADMIN'`, nunca lo acepta del cliente (anti escalación
 * de privilegios).
 */
export interface RegisterAdminDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  developerCode: string;
}

/** Payload para iniciar sesión como administrador. */
export interface AdminLoginDTO {
  email: string;
  password: string;
}

/**
 * Respuesta de autenticación administrativa exitosa (sesión completa).
 *
 * Sin refresh token: a diferencia del cliente (Q19, Silent Refresh), el
 * SRS solo exige "rotación de JWTs cada 8 horas" (CMS-BE-01) — el admin
 * simplemente vuelve a iniciar sesión al expirar, sin flujo de renovación
 * silenciosa. Mantener esto simple reduce superficie de ataque del panel.
 */
export interface AdminAuthResponseDTO {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Resultado del login administrativo (Fase 29 + Fase 34 — 2FA INELUDIBLE).
 *
 * UNIÓN DISCRIMINADA por `outcome`:
 *   - `'session'`            → credenciales válidas + 2FA ya verificado: JWT de 8h.
 *   - `'2fa_required'`       → el admin tiene 2FA activo: solo `tempToken` (~2 min)
 *                              para `POST /api/admin/auth/2fa/verify`.
 *   - `'2fa_setup_required'` → el admin AÚN NO configuró 2FA: solo `setupToken`
 *                              (~10 min) que SOLO sirve para `/2fa/setup` y `/2fa/enable`.
 *                              NO se entrega JWT de sesión (REQ-SEC-09: 2FA ineludible).
 *
 * Ningún admin obtiene una sesión administrativa utilizable sin pasar por el 2FA.
 */
export type AdminLoginResultDTO =
  | ({ outcome: 'session' } & AdminAuthResponseDTO)
  | { outcome: '2fa_required'; tempToken: string }
  | { outcome: '2fa_setup_required'; setupToken: string };
