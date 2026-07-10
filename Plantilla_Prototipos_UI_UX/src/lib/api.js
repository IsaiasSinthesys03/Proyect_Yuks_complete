import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REFRESH_PATH = '/api/auth/refresh';

/**
 * Instancia Axios central (Fase 38).
 *
 * ▓ AUTENTICACIÓN (cómo es REALMENTE el backend) ▓
 *   - Access Token: viaja como `Authorization: Bearer` (leído del authStore, en memoria).
 *   - Refresh Token: cookie HttpOnly `SameSite=strict` path `/api/auth/refresh`.
 *     Se envía/recibe SOLO porque `withCredentials: true` está activo.
 *   - ❌ SIN token CSRF: el backend no lo espera ni lo valida. No se añade
 *     ninguna cabecera `X-CSRF-Token`. La defensa CSRF es SameSite=strict + path.
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // imprescindible para recibir/enviar la cookie del refresh
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inyecta el Bearer desde el authStore (memoria) ──
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Silent Refresh con cola de peticiones concurrentes ──
// Solo UNA llamada a /refresh aunque N peticiones fallen con 401 a la vez.
let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      resolve(api(config)); // reintenta con el token nuevo
    }
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isRefreshCall = original?.url?.includes(REFRESH_PATH);

    // El silent refresh SOLO aplica a peticiones AUTENTICADAS cuyo access token
    // expiró. Un 401 de un endpoint público (login con credenciales malas, etc.)
    // es un resultado de negocio legítimo, NO una señal de token vencido: si
    // intentáramos refrescar, destruiríamos el error real y dispararíamos un
    // logout en cascada. Guarda: solo refrescamos si la petición llevaba Bearer.
    const hadBearer = !!(original?.headers?.Authorization || useAuthStore.getState().accessToken);

    if (status === 401 && original && !original._retry && !isRefreshCall && hadBearer) {
      // Si ya hay un refresh en vuelo, ENCOLAR esta petición.
      if (isRefreshing) {
        return new Promise((resolve, reject) => pendingQueue.push({ resolve, reject, config: original }));
      }

      original._retry = true;
      isRefreshing = true;
      try {
        // Una sola llamada a /refresh. withCredentials global → manda la cookie HttpOnly.
        const { data } = await api.post(REFRESH_PATH);
        const newToken = data?.data?.accessToken;
        if (!newToken) throw new Error('Refresh sin accessToken');

        useAuthStore.getState().setToken(newToken);
        flushQueue(null, newToken);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original); // reintenta la petición original
      } catch (refreshError) {
        flushQueue(refreshError, null);
        useAuthStore.getState().logout(); // sesión irrecuperable → limpiar
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────────────
// Helpers de sesión
// ──────────────────────────────────────────────────────────────

/** Normaliza el envelope del backend (`{statusCode,message,data}` o `{success,data}`). */
export function unwrap(response) {
  const body = response?.data;
  return body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;
}

/** Login: guarda accessToken (memoria) + user; el refresh queda en la cookie HttpOnly. */
export async function login(email, password) {
  const res = await api.post('/api/auth/login', { email, password });
  const { accessToken, user } = unwrap(res);
  useAuthStore.getState().setSession(accessToken, user);
  return user;
}

/** Logout: revoca en el backend y limpia la sesión en memoria. */
export async function logout() {
  try {
    await api.post('/api/auth/logout');
  } catch {
    /* aunque falle en red, limpiamos localmente */
  }
  useAuthStore.getState().logout();
}

/**
 * Bootstrap de sesión (al montar la app): intenta un `/refresh` para restaurar la
 * sesión desde la cookie HttpOnly (el access token vive en memoria y se pierde al
 * recargar). Si hay cookie válida, repuebla el token + el usuario.
 */
export async function bootstrapSession() {
  try {
    const res = await api.post(REFRESH_PATH);
    const newToken = unwrap(res)?.accessToken;
    if (!newToken) return false;
    useAuthStore.getState().setToken(newToken);
    // Repoblar el usuario (el refresh solo devuelve el token). `GET /api/profile`
    // responde anidado `{ user, profile, wallet }`; se aplana a la MISMA forma que
    // usa el login (`{ id, email, role, firstName, lastName, tierLevel, ... }`).
    try {
      const p = unwrap(await api.get('/api/profile'));
      if (p?.user) {
        useAuthStore.getState().setUser({ ...p.user, ...p.profile, wallet: p.wallet, gamification: p.gamification });
      }
    } catch {
      /* el token ya está; el perfil es best-effort */
    }
    return true;
  } catch {
    useAuthStore.getState().logout();
    return false;
  }
}
