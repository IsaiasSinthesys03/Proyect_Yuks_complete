/**
 * ws.js — Cliente WebSocket de tiempo real (Fase 46, REQ-FE-24 / Social Proof).
 *
 * Conecta a `${VITE_WS_URL}/api/realtime/ws`. Para el Social Proof basta la
 * conexión PÚBLICA anónima (sin token): el backend transmite los eventos
 * `social_proof:purchase` a TODAS las conexiones públicas.
 *
 * ▓ Contrato del backend (realtimeRoutes.ts) ▓
 *   - Sin `?token=` → canal público (solo Social Proof). El servidor manda
 *     primero un `connection:established`.
 *   - Cada mensaje es JSON: `{ type, payload, timestamp }`.
 *
 * Patrón: singleton por pestaña + suscripción por tipo de evento + reconexión
 * con backoff exponencial. La conexión de canal de usuario (order:status,
 * notificaciones en vivo) se sumará en la Fase 54 pasando el JWT.
 */

import { useAuthStore } from '../store/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
const REALTIME_PATH = '/api/realtime/ws';

let socket = null;
let shouldRun = false; // desactiva la reconexión tras disconnectRealtime()
let reconnectAttempts = 0;
let reconnectTimer = null;
let authUnsubscribe = null;
let activeToken = null;

// Handlers por tipo de evento: { [type]: Set<fn> }
const listeners = new Map();

function emit(type, payload) {
  const set = listeners.get(type);
  if (set) set.forEach((fn) => { try { fn(payload); } catch (e) { console.error('[ws] handler error', e); } });
}

function scheduleReconnect() {
  if (!shouldRun || reconnectTimer) return;
  // Backoff exponencial: 1s, 2s, 4s… tope 15s.
  const delay = Math.min(15000, 1000 * 2 ** reconnectAttempts);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectAttempts += 1;
    open();
  }, delay);
}

function open() {
  if (!shouldRun) return;
  try {
    activeToken = useAuthStore.getState().accessToken;
    const query = activeToken ? `?token=${encodeURIComponent(activeToken)}` : '';
    socket = new WebSocket(`${WS_URL}${REALTIME_PATH}${query}`);
  } catch (e) {
    console.error('[ws] no se pudo abrir el socket', e);
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectAttempts = 0;
    emit('__status', { connected: true });
  };

  socket.onmessage = (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch { return; }
    if (msg && typeof msg.type === 'string') {
      emit(msg.type, msg.payload ?? {});
    }
  };

  socket.onclose = () => {
    emit('__status', { connected: false });
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = () => {
    // El cierre subsecuente dispara la reconexión; solo cerramos si sigue vivo.
    if (socket && socket.readyState === WebSocket.OPEN) socket.close();
  };
}

function reconnectForToken(nextToken) {
  if (!shouldRun || nextToken === activeToken) return;
  activeToken = nextToken;
  reconnectAttempts = 0;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) {
    try { socket.close(1000, 'Session changed'); } catch { socket = null; open(); }
  } else {
    open();
  }
}

/** Inicia (idempotente) la conexión de tiempo real. */
export function connectRealtime() {
  if (shouldRun && socket) return; // ya conectado o conectando
  shouldRun = true;
  reconnectAttempts = 0;
  if (!authUnsubscribe) {
    authUnsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.accessToken !== previous.accessToken) reconnectForToken(state.accessToken);
    });
  }
  open();
}

/** Cierra la conexión y detiene la reconexión (cleanup al desmontar la app). */
export function disconnectRealtime() {
  shouldRun = false;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) { try { socket.close(); } catch { /* noop */ } socket = null; }
  if (authUnsubscribe) { authUnsubscribe(); authUnsubscribe = null; }
  activeToken = null;
}

/**
 * Suscribe un handler a un tipo de evento del backend.
 * @returns función para desuscribir.
 */
export function onRealtimeEvent(type, handler) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(handler);
  return () => {
    const set = listeners.get(type);
    if (set) { set.delete(handler); if (set.size === 0) listeners.delete(type); }
  };
}

/** True si el socket está abierto ahora mismo (para debug/UX). */
export function isRealtimeConnected() {
  return !!socket && socket.readyState === WebSocket.OPEN;
}
