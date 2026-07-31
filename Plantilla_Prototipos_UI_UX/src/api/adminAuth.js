import { adminApi, unwrapAdmin } from '../lib/adminApi';

/**
 * API de Autenticación Administrativa (Fase 47, CMS-BE-01 + REQ-SEC-09).
 * Prefijo backend: /api/admin/auth (IP-allowlist + rate limit 5/min).
 *
 * ▓ EL MURO DEL 2FA (INELUDIBLE) ▓
 * `adminLogin` NUNCA entrega sesión directa a un admin sin TOTP:
 *   - { requiresSetup: true, setupToken }  → debe configurar 2FA (QR + confirmar)
 *   - { requires2fa: true, tempToken }     → debe teclear su código TOTP
 *   - { requires2fa: false, accessToken, user } → sesión (solo si el backend lo permite)
 */

/** POST /api/admin/auth/login — paso 1 (credenciales). */
export async function adminLogin(email, password) {
  return unwrapAdmin(await adminApi.post('/api/admin/auth/login', { email, password }));
}

/**
 * POST /api/admin/auth/2fa/setup — genera el secreto TOTP y la URI otpauth://
 * para el QR. Requiere el `setupToken` acotado (NO una sesión).
 * @returns { secret, otpauthUri }
 */
export async function setup2fa(setupToken) {
  return unwrapAdmin(await adminApi.post('/api/admin/auth/2fa/setup', {}, {
    headers: { Authorization: `Bearer ${setupToken}` },
  }));
}

/** POST /api/admin/auth/2fa/enable — confirma el primer código y habilita el 2FA. */
export async function enable2fa(setupToken, code) {
  return unwrapAdmin(await adminApi.post('/api/admin/auth/2fa/enable', { code }, {
    headers: { Authorization: `Bearer ${setupToken}` },
  }));
}

/**
 * POST /api/admin/auth/2fa/verify — paso 2 del login (tempToken + TOTP).
 * @returns { accessToken, user: { id, email, role, firstName, lastName } }
 */
export async function verify2fa(tempToken, code) {
  return unwrapAdmin(await adminApi.post('/api/admin/auth/2fa/verify', { tempToken, code }));
}

/**
 * POST /api/admin/auth/register — Easter Egg (Q21, CMS-FE-02).
 * El `developerCode` se valida contra su hash Argon2id en system_settings
 * (falla cerrada si no hay hash configurado). El rol ADMIN lo fija el backend.
 */
export async function registerAdmin({ email, password, firstName, lastName, developerCode }) {
  return unwrapAdmin(await adminApi.post('/api/admin/auth/register', { email, password, firstName, lastName, developerCode }));
}
