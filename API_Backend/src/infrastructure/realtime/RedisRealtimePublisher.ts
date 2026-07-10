import IORedis from 'ioredis';
import { IRealtimePublisher, REALTIME_ADMIN_CHANNEL } from '../../application/interfaces/IRealtimePublisher';
import { RealtimeEvent } from '../../application/interfaces/IRealtimeService';

/**
 * Publicador de eventos de tiempo real vía Redis Pub/Sub (Fase 31).
 *
 * Usado por procesos worker (ej. `reports.worker`) para notificar a los admins
 * conectados a la API. La API escucha `REALTIME_ADMIN_CHANNEL` (ver
 * `WebSocketServer.subscribeToAdminChannel`) y reenvía a las conexiones WS.
 */
export class RedisRealtimePublisher implements IRealtimePublisher {
  constructor(private readonly publisher: IORedis) {}

  async publishAdminEvent(event: RealtimeEvent): Promise<void> {
    await this.publisher.publish(REALTIME_ADMIN_CHANNEL, JSON.stringify(event));
  }
}
