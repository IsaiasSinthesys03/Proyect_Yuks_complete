import { useAdminAuthStore } from '../store/adminAuthStore';

/**
 * adminWs.js — Cliente WebSocket del CMS (Fase 48, CMS-FE-19).
 *
 * SEPARADO del `ws.js` público del storefront: aquí el handshake viaja con el
 * JWT de administrador (`?token=`; los WebSockets del navegador no soportan el
 * header Authorization) → el backend registra la conexión en el canal ADMIN y
 * reenvía los eventos publicados por los workers (ej. `report:ready` desde el
 * worker de reportes vía Redis Pub/Sub).
 *
 * Ciclo de vida: conectar al montar el AdminLayout (sesión activa) y
 * desconectar al desmontar/logout. Reconexión con backoff mientras haya sesión.
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
const REALTIME_PATH = '/api/realtime/ws';

let socket = null;
let shouldRun = false;
let reconnectAttempts = 0;
let reconnectTimer = null;

const listeners = new Map();

function emit(type, payload) {
  const set = listeners.get(type);
  if (set) set.forEach((fn) => { try { fn(payload); } catch (e) { console.error('[adminWs] handler error', e); } });
}

function scheduleReconnect() {
  if (!shouldRun || reconnectTimer) return;
  const delay = Math.min(15000, 1000 * 2 ** reconnectAttempts);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectAttempts += 1;
    open();
  }, delay);
}

function open() {
  if (!shouldRun) return;
  const token = useAdminAuthStore.getState().accessToken;
  if (!token) { shouldRun = false; return; } // sin sesión no hay canal admin

  try {
    socket = new WebSocket(`${WS_URL}${REALTIME_PATH}?token=${encodeURIComponent(token)}`);
  } catch (e) {
    console.error('[adminWs] no se pudo abrir el socket', e);
    scheduleReconnect();
    return;
  }

  socket.onopen = () => { reconnectAttempts = 0; emit('__status', { connected: true }); };
  socket.onmessage = (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch { return; }
    if (msg && typeof msg.type === 'string') emit(msg.type, msg.payload ?? {});
  };
  socket.onclose = () => { emit('__status', { connected: false }); socket = null; scheduleReconnect(); };
  socket.onerror = () => { if (socket && socket.readyState === WebSocket.OPEN) socket.close(); };
}

/** Conecta (idempotente) el canal admin. Llamar al montar el AdminLayout. */
export function connectAdminRealtime() {
  if (shouldRun && socket) return;
  shouldRun = true;
  reconnectAttempts = 0;
  open();
}

/** Cierra y detiene la reconexión (logout / desmontar el layout). */
export function disconnectAdminRealtime() {
  shouldRun = false;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) { try { socket.close(); } catch { /* noop */ } socket = null; }
}

/** Suscribe un handler a un tipo de evento admin. @returns desuscriptor. */
export function onAdminRealtimeEvent(type, handler) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(handler);
  return () => {
    const set = listeners.get(type);
    if (set) { set.delete(handler); if (set.size === 0) listeners.delete(type); }
  };
}
