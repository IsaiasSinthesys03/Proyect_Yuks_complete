/**
 * Puerto (Interfaz) del Servicio de Comunicación en Tiempo Real (REQ-BE-10).
 *
 * Clean Architecture: los Use Cases y Workers usan esta abstracción,
 * nunca la implementación WebSocket concreta.
 * La implementación actual usa @fastify/websocket.
 * En el futuro podría reemplazarse por Socket.io o SSE sin tocar los Use Cases.
 */
export interface IRealtimeService {
  /**
   * Envía un evento a todos los sockets conectados de un usuario específico.
   * Caso de uso: notificación de cambio de estado de pedido (REQ-FE-24).
   */
  notifyUser(userId: string, event: RealtimeEvent): void;

  /**
   * Envía un evento a todos los administradores conectados al CMS.
   * Caso de uso: nuevo pedido, alerta, reporte listo (CMS-FE-04, CMS-FE-19).
   */
  notifyAdmins(event: RealtimeEvent): void;

  /**
   * Broadcast público a todos los usuarios conectados (autenticados o no).
   * Caso de uso: Social Proof FOMO — "Roberto compró en Mérida" (REQ-FE-32, REQ-BE-10).
   */
  broadcastPublic(event: RealtimeEvent): void;
}

/** Estructura canónica de un evento en tiempo real */
export interface RealtimeEvent {
  /** Tipo del evento (ej. 'order:status_changed', 'social_proof', 'report:ready') */
  type: string;
  /** Payload arbitrario del evento */
  payload: Record<string, unknown>;
  /** Timestamp ISO 8601 del evento */
  timestamp: string;
}

/** Helper para crear eventos con timestamp automático */
export function createRealtimeEvent(
  type: string,
  payload: Record<string, unknown>
): RealtimeEvent {
  return { type, payload, timestamp: new Date().toISOString() };
}
