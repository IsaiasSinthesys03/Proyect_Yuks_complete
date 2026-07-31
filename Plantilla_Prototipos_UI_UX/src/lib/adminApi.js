import axios from 'axios';
import { useAdminAuthStore } from '../store/adminAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Instancia Axios del CMS (Fase 47) — SEPARADA de la del storefront.
 *
 * ▓ Por qué separada ▓ El interceptor del storefront inyecta el Bearer del
 * `authStore` del CLIENTE y hace silent-refresh con la cookie HttpOnly. El
 * admin usa OTRO token (JWT de 8h del `adminAuthStore`) y NO tiene refresh:
 * cuando el JWT expira (401), la sesión muere y se vuelve al login con TOTP.
 * Mezclar ambos tokens en una sola instancia sería un vector de confusión
 * de privilegios.
 */
export const adminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: inyecta el Bearer admin desde la MEMORIA del adminAuthStore ──
adminApi.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: 401 con sesión activa → JWT expirado/revocado → logout duro ──
// EXCEPCIÓN (Fase 49): los endpoints de RE-AUTENTICACIÓN (ej. la Bóveda de
// Reembolsos) devuelven 401 cuando la CONTRASEÑA DE CONFIRMACIÓN es incorrecta
// — el JWT del admin sigue siendo válido y NO debe cerrarse su sesión.
const REAUTH_PATHS = ['/refund', '/settings/developer-code'];

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const hadSession = !!useAdminAuthStore.getState().accessToken;
    const url = error.config?.url ?? '';
    const isReauthEndpoint = REAUTH_PATHS.some((p) => url.includes(p));
    if (status === 401 && hadSession && !isReauthEndpoint) {
      useAdminAuthStore.getState().logout(); // sin refresh para admins: re-login + TOTP
    }
    return Promise.reject(error);
  }
);

/** Normaliza el envelope del backend (`{statusCode,message,data}` o `{success,data}`). */
export function unwrapAdmin(response) {
  const body = response?.data;
  return body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;
}
