import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

// --- Infraestructura ---
import { db } from './infrastructure/database/client';
import { redisConnection } from './infrastructure/cache/redis-client';

// --- Repositorios (Adaptadores de Infraestructura) ---
import { UserRepository } from './infrastructure/database/repositories/UserRepository';

// --- Casos de Uso (Application Layer) ---
import { RegisterUserUseCase } from './application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from './application/usecases/LoginUserUseCase';

// --- Controladores HTTP (Adaptadores) ---
import { AuthController } from './infrastructure/http/controllers/AuthController';

// --- Rutas ---
import { buildAuthRoutes } from './infrastructure/http/routes/authRoutes';

// Cargar variables de entorno
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

/**
 * Composition Root — Punto de Composición del Sistema Animayuks.
 *
 * Aquí se orquesta TODA la inyección de dependencias de forma manual:
 *   1. Se instancian los repositorios (infraestructura).
 *   2. Se inyectan en los casos de uso (aplicación).
 *   3. Se inyectan los casos de uso en los controladores (adaptadores HTTP).
 *   4. Se registran las rutas con los controladores ya inyectados.
 *
 * Principio: Ningún módulo interno conoce cómo se construye el grafo de dependencias.
 * Solo main.ts lo sabe.
 */
async function main(): Promise<void> {
  // ==========================================
  // 1. INSTANCIAR FASTIFY
  // ==========================================
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
        },
      },
    },
  });

  // ==========================================
  // 2. REGISTRAR PLUGINS GLOBALES
  // ==========================================
  await fastify.register(cors, {
    origin: true, // En producción, restringir a dominios específicos
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ==========================================
  // 3. INYECCIÓN DE DEPENDENCIAS (Manual)
  // ==========================================

  // 3.1 Repositorios
  const userRepository = new UserRepository();

  // 3.2 Casos de Uso
  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  const loginUserUseCase = new LoginUserUseCase(userRepository, JWT_SECRET, JWT_EXPIRES_IN);

  // 3.3 Controladores
  const authController = new AuthController(registerUserUseCase, loginUserUseCase);

  // ==========================================
  // 4. REGISTRAR RUTAS
  // ==========================================
  fastify.register(buildAuthRoutes(authController), { prefix: '/api/auth' });

  // ==========================================
  // 5. HEALTHCHECK ENDPOINT
  // ==========================================
  fastify.get('/api/health', async (_request, reply) => {
    try {
      // Verificar conexión a la base de datos con una query trivial
      await db.selectFrom('users').select('id').limit(1).execute();

      // Verificar conexión a Redis
      const redisStatus = redisConnection.status;

      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: 'connected',
        redis: redisStatus === 'ready' ? 'connected' : redisStatus,
        uptime: process.uptime(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(503).send({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        db: 'disconnected',
        redis: redisConnection.status,
        error: errorMessage,
      });
    }
  });

  // ==========================================
  // 6. ARRANCAR SERVIDOR
  // ==========================================
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`
╔══════════════════════════════════════════════════════╗
║   🚀 Animayuks API Backend                          ║
║   ───────────────────────────────────────────────    ║
║   Puerto:      ${String(PORT).padEnd(38)}║
║   Entorno:     ${(process.env.NODE_ENV || 'development').padEnd(38)}║
║   Healthcheck: http://localhost:${PORT}/api/health${' '.repeat(Math.max(0, 14 - String(PORT).length))}║
║   Auth:        http://localhost:${PORT}/api/auth${' '.repeat(Math.max(0, 16 - String(PORT).length))}║
╚══════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // ==========================================
  // 7. GRACEFUL SHUTDOWN
  // ==========================================
  const shutdown = async (signal: string) => {
    console.log(`\n⚡ Señal ${signal} recibida. Cerrando servidor...`);
    try {
      await fastify.close();
      await redisConnection.quit();
      await db.destroy();
      console.log('✅ Servidor cerrado limpiamente.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error durante el shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Ejecutar
main().catch((err) => {
  console.error('❌ Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
