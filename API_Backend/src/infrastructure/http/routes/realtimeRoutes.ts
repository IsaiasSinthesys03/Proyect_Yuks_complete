import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from '../../realtime/WebSocketServer';
import { createRealtimeEvent } from '../../../application/interfaces/IRealtimeService';

/**
 * Plugin de Fastify: Endpoint de WebSocket en Tiempo Real (REQ-BE-10, REQ-FE-24).
 *
 * AUTENTICACIÓN:
 *   El cliente pasa el JWT via query param: `ws://host/api/realtime/ws?token=JWT`
 *   (Los WebSockets del navegador no soportan el header Authorization en el handshake).
 *   El token se verifica ANTES de aceptar la conexión. Si es inválido, se cierra
 *   con código 4001 (Unauthorized).
 *
 * CANALES (según el rol del JWT):
 *   - role === 'CLIENT' → userConnections + publicConnections
 *   - role === 'ADMIN'  → adminConnections + publicConnections
 *   - sin token válido  → publicConnections SOLO (anónimo, solo Social Proof)
 *
 * Uso: fastify.register(buildRealtimeRoutes(wsServer, JWT_SECRET), { prefix: '/api/realtime' });
 */
export function buildRealtimeRoutes(wsServer: WebSocketServer, jwtSecret: string) {
  return async function realtimeRoutes(fastify: FastifyInstance): Promise<void> {

    /**
     * GET /api/realtime/ws — WebSocket handshake
     *
     * Query params:
     *   ?token=<JWT>   → usuario autenticado (CLIENT o ADMIN)
     *   (sin token)    → conexión pública anónima (solo Social Proof)
     */
    fastify.get('/ws', { websocket: true }, (socket, request) => {
      const query = request.query as { token?: string };
      const token = query.token;

      if (!token) {
        // Conexión pública anónima — solo recibe Social Proof broadcasts
        wsServer.registerPublicConnection(socket);
        socket.send(JSON.stringify(createRealtimeEvent('connection:established', {
          channel: 'public',
          message: 'Conectado al canal público.',
        })));
        return;
      }

      // Verificar JWT
      let decoded: { sub: string; role: string; email: string };
      try {
        decoded = jwt.verify(token, jwtSecret) as { sub: string; role: string; email: string };
      } catch {
        socket.send(JSON.stringify(createRealtimeEvent('connection:error', {
          code: 4001,
          message: 'Token de autenticación inválido o expirado.',
        })));
        socket.close(4001, 'Unauthorized');
        return;
      }

      // Registrar según rol
      if (decoded.role === 'ADMIN') {
        wsServer.registerAdminConnection(socket);
        wsServer.registerPublicConnection(socket);
        socket.send(JSON.stringify(createRealtimeEvent('connection:established', {
          channel: 'admin',
          adminEmail: decoded.email,
          message: 'Conectado al canal de administración.',
        })));
      } else {
        wsServer.registerUserConnection(decoded.sub, socket);
        wsServer.registerPublicConnection(socket);
        socket.send(JSON.stringify(createRealtimeEvent('connection:established', {
          channel: 'user',
          userId: decoded.sub,
          message: 'Conectado al canal de usuario.',
        })));
      }

      // Health-check: el cliente puede enviar ping
      socket.on('message', (rawMessage: Buffer | ArrayBuffer | Buffer[]) => {
        try {
          const msg = JSON.parse(rawMessage.toString()) as { type?: string };
          if (msg.type === 'ping') {
            socket.send(JSON.stringify(createRealtimeEvent('pong', { timestamp: Date.now() })));
          }
        } catch {
          // Mensajes no-JSON ignorados silenciosamente
        }
      });
    });

    /**
     * GET /api/realtime/stats — métricas de conexiones (solo admin, HTTP regular)
     */
    fastify.get('/stats', async (_request, reply) => {
      const stats = wsServer.getConnectionStats();
      return reply.status(200).send({ success: true, data: stats });
    });

    // ────────────────────────────────────────────────────────────────────
    // DEV-ONLY: disparador manual de Social Proof.
    //
    // Solo se monta si `ENABLE_DEV_REALTIME_TRIGGER === 'true'` — INERTE en
    // producción (nunca existe si la env no está activa). Existe porque el
    // Social Proof real se emite desde el webhook de Stripe, que está
    // deshabilitado en modo PAYMENTS_SIMULATED; esto permite probar la cadena
    // completa backend→WS→toast sin un pago real. Ver Fase 46.
    // ────────────────────────────────────────────────────────────────────
    if (process.env.ENABLE_DEV_REALTIME_TRIGGER === 'true') {
      fastify.post('/_dev/social-proof', async (request, reply) => {
        const body = (request.body ?? {}) as { displayName?: string; municipality?: string; productName?: string };
        wsServer.broadcastPublic(
          createRealtimeEvent('social_proof:purchase', {
            displayName: body.displayName ?? 'Alguien',
            municipality: body.municipality ?? 'Mérida',
            productName: body.productName ?? 'un producto',
          }),
        );
        return reply.status(202).send({ success: true, message: '[DEV] social_proof:purchase transmitido.' });
      });
    }
  };
}
