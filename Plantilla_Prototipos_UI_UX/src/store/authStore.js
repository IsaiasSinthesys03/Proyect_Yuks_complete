import { create } from 'zustand';

/**
 * authStore — Sesión del cliente (Fase 38).
 *
 * ▓ SEGURIDAD (anti-XSS) ▓ El `accessToken` vive EXCLUSIVAMENTE en memoria (estado
 * de Zustand). NUNCA se persiste en localStorage/sessionStorage: si hubiera un XSS,
 * el atacante no podría leer el token desde el almacenamiento del navegador.
 * Al recargar la página el token se pierde a propósito y se restaura vía el
 * "silent refresh" de arranque (bootstrapSession), que lee la cookie HttpOnly.
 *
 * NO se usa el middleware `persist` — eso lo grabaría en storage y rompería la
 * mitigación. El store es puramente en memoria.
 */
export const useAuthStore = create((set, get) => ({
  accessToken: null, // ← memoria pura, jamás localStorage
  user: null,
  isAuthenticated: false,

  /** Fija solo el token (usado por el silent refresh). */
  setToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),

  /** Fija token + usuario (usado por login y bootstrap). */
  setSession: (token, user) => set({ accessToken: token, user, isAuthenticated: !!token }),

  /** Actualiza solo el usuario (bootstrap tras refresh). */
  setUser: (user) => set({ user }),

  /** Limpia la sesión (logout o refresh fallido). */
  logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),

  /** Lectura fuera de React (interceptores de Axios). */
  getToken: () => get().accessToken,
}));
