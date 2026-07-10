import { RealtimeEvent } from './IRealtimeService';

/**
 * Puerto para PUBLICAR eventos de tiempo real DESDE UN PROCESO SEPARADO (Fase 31).
 *
 * Las conexiones WebSocket viven en el proceso de la API (`WebSocketServer`),
 * pero el `reports.worker` corre en otro proceso. Este puerto abstrae el
 * transporte (Redis Pub/Sub) que cruza esa frontera: el worker publica y la API,
 * suscrita al mismo canal, reenvía el evento a los admins conectados.
 */
export interface IRealtimePublisher {
  /** Publica un evento dirigido al canal de administradores. */
  publishAdminEvent(event: RealtimeEvent): Promise<void>;
}

/** Canal de Redis Pub/Sub para eventos destinados a los administradores. */
export const REALTIME_ADMIN_CHANNEL = 'realtime:admin';
