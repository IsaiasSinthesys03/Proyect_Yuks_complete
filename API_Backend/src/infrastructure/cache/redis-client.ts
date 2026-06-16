import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton: Instancia única de conexión a Redis para operaciones de caché directas
// (Idempotency Keys, Cache de Top Ventas, Distributed Locks).
export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Requerido por BullMQ para evitar timeouts en workers
});

// Opciones de conexión exportadas para BullMQ (Queue y Worker).
// BullMQ necesita crear sus propias conexiones IORedis internamente,
// por lo que se le pasan las opciones, no la instancia directa.
export const redisConnectionOptions = {
  host: redisConnection.options.host || 'localhost',
  port: redisConnection.options.port || 6379,
  password: redisConnection.options.password,
  maxRetriesPerRequest: null as null,
};

redisConnection.on('connect', () => {
  console.log('🟢 Redis conectado exitosamente.');
});

redisConnection.on('error', (err) => {
  console.error('🔴 Error de conexión Redis:', err.message);
});
