/**
 * Entidad de Dominio: Notification
 *
 * Notificación persistida de un usuario (Fase 32, REQ-FE-24). Respalda la
 * bandeja de entrada in-app y el contador de no leídas. El `payload` guarda
 * los datos del evento (mismo cuerpo que viaja por WebSocket) para poder
 * renderizar la notificación aunque el cliente estuviera desconectado al emitirse.
 */
export interface Notification {
  readonly id: string;
  readonly userId: string;
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly isRead: boolean;
  readonly createdAt: Date;
}
