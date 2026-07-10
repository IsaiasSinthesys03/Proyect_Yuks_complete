import IORedis from 'ioredis';
import { WebSocket } from '@fastify/websocket';
import { IRealtimeService, RealtimeEvent } from '../../application/interfaces/IRealtimeService';
import { REALTIME_ADMIN_CHANNEL } from '../../application/interfaces/IRealtimePublisher';

/** readyState del estándar WebSocket para una conexión abierta (ver comentario en sendSafe). */
const WS_OPEN = 1;

/**
 * Implementación del Servicio de Tiempo Real usando @fastify/websocket.
 *
 * CANALES DE CONEXIÓN:
 *   - `userConnections`   → Map<userId, Set<WebSocket>> — notificaciones personales (REQ-FE-24)
 *   - `adminConnections`  → Set<WebSocket> — eventos del CMS (CMS-FE-04, CMS-FE-19)
 *   - `publicConnections` → Set<WebSocket> — Social Proof broadcasts (REQ-FE-32, REQ-BE-10)
 *
 * AUTENTICACIÓN: el JWT se verifica en el handshake HTTP ANTES de registrar la
 * conexión aquí. Este servicio solo recibe conexiones ya autenticadas.
 *
 * SINGLETON: se instancia una sola vez en main.ts e inyectada en los workers
 * que necesiten notificar eventos en tiempo real.
 */
export class WebSocketServer implements IRealtimeService {
  private readonly userConnections = new Map<string, Set<WebSocket>>();
  private readonly adminConnections = new Set<WebSocket>();
  private readonly publicConnections = new Set<WebSocket>();

  /** Registra una conexión autenticada de usuario cliente */
  registerUserConnection(userId: string, socket: WebSocket): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socket);

    socket.on('close', () => {
      const sockets = this.userConnections.get(userId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    });
  }

  /** Registra una conexión autenticada de administrador */
  registerAdminConnection(socket: WebSocket): void {
    this.adminConnections.add(socket);
    socket.on('close', () => this.adminConnections.delete(socket));
  }

  /** Registra una conexión pública (puede ser anónima) */
  registerPublicConnection(socket: WebSocket): void {
    this.publicConnections.add(socket);
    socket.on('close', () => this.publicConnections.delete(socket));
  }

  notifyUser(userId: string, event: RealtimeEvent): void {
    const sockets = this.userConnections.get(userId);
    if (!sockets || sockets.size === 0) return;

    const payload = JSON.stringify(event);
    for (const socket of sockets) {
      this.sendSafe(socket, payload);
    }
  }

  notifyAdmins(event: RealtimeEvent): void {
    if (this.adminConnections.size === 0) return;

    const payload = JSON.stringify(event);
    for (const socket of this.adminConnections) {
      this.sendSafe(socket, payload);
    }
  }

  broadcastPublic(event: RealtimeEvent): void {
    if (this.publicConnections.size === 0) return;

    const payload = JSON.stringify(event);
    for (const socket of this.publicConnections) {
      this.sendSafe(socket, payload);
    }
  }

  /**
   * Suscribe la API al canal Redis de administradores (Fase 31). Los eventos
   * publicados por procesos worker (ej. reportes) se reenvían a los admins
   * conectados por WebSocket. Recibe una conexión Redis DEDICADA (en modo
   * suscriptor no se pueden ejecutar otros comandos), típicamente
   * `redisConnection.duplicate()`.
   */
  subscribeToAdminChannel(subscriber: IORedis): void {
    subscriber.subscribe(REALTIME_ADMIN_CHANNEL, (err) => {
      if (err) {
        console.error('[WebSocketServer] No se pudo suscribir al canal admin de Redis:', err.message);
      } else {
        console.log(`[WebSocketServer] Suscrito a "${REALTIME_ADMIN_CHANNEL}" para eventos cross-process.`);
      }
    });

    subscriber.on('message', (channel, message) => {
      if (channel !== REALTIME_ADMIN_CHANNEL) return;
      try {
        const event = JSON.parse(message) as RealtimeEvent;
        this.notifyAdmins(event);
      } catch {
        // Mensaje malformado en el canal — ignorar silenciosamente.
      }
    });
  }

  /** Métricas de conexiones activas (útil para health checks y logging) */
  getConnectionStats(): { users: number; admins: number; public: number } {
    let userCount = 0;
    for (const sockets of this.userConnections.values()) {
      userCount += sockets.size;
    }
    return {
      users: userCount,
      admins: this.adminConnections.size,
      public: this.publicConnections.size,
    };
  }

  private sendSafe(socket: WebSocket, payload: string): void {
    // BUG CRÍTICO CORREGIDO (Fase 32): `WebSocket.OPEN` es `undefined` en runtime
    // porque `@fastify/websocket` exporta `WebSocket` solo como TIPO de TypeScript,
    // no como la clase runtime del paquete `ws` con sus constantes estáticas.
    // Comparar contra `undefined` hacía que `sendSafe` NUNCA enviara nada — el
    // motor de tiempo real descartaba todos los mensajes en silencio.
    // Se usa la constante numérica del estándar WebSocket (OPEN === 1).
    if (socket.readyState === WS_OPEN) {
      socket.send(payload);
    }
  }
}
