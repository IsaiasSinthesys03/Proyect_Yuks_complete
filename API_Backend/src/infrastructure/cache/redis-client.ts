import IORedis, { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const REDIS_LOG_THROTTLE_MS = Math.max(
  10_000,
  Number(process.env.REDIS_LOG_THROTTLE_MS || 60_000)
);

let outageStartedAt: number | null = null;
let lastErrorLogAt = 0;
let suppressedErrors = 0;

function safeRedisEndpoint(): string {
  try {
    const url = new URL(REDIS_URL);
    return `${url.protocol}//${url.hostname}:${url.port || '6379'}${url.pathname === '/' ? '' : url.pathname}`;
  } catch {
    return '<REDIS_URL inválida>';
  }
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code?: unknown }).code || 'UNKNOWN');
  }
  return 'UNKNOWN';
}

/**
 * Consolida los errores de todos los clientes Redis/BullMQ.
 * La primera caída se registra inmediatamente y los reintentos posteriores se
 * resumen como máximo una vez por minuto.
 */
export function reportRedisError(component: string, error: unknown): void {
  const now = Date.now();
  if (outageStartedAt === null) {
    outageStartedAt = now;
  }

  if (lastErrorLogAt === 0 || now - lastErrorLogAt >= REDIS_LOG_THROTTLE_MS) {
    const durationSeconds = Math.round((now - outageStartedAt) / 1000);
    const suppressedSuffix = suppressedErrors > 0
      ? `; ${suppressedErrors} reintentos adicionales fueron agrupados`
      : '';

    console.error(
      `[Redis] Servicio no disponible (${errorCode(error)}) en ${safeRedisEndpoint()}; ` +
      `componente=${component}; duración=${durationSeconds}s${suppressedSuffix}. ` +
      'La API continúa en modo degradado.'
    );
    lastErrorLogAt = now;
    suppressedErrors = 0;
    return;
  }

  suppressedErrors += 1;
}

export function reportRedisReady(component: string): void {
  if (outageStartedAt !== null) {
    const durationSeconds = Math.round((Date.now() - outageStartedAt) / 1000);
    console.info(
      `[Redis] Conexión recuperada; componente=${component}; interrupción=${durationSeconds}s.`
    );
  } else {
    console.info(`[Redis] Conectado; componente=${component}.`);
  }

  outageStartedAt = null;
  lastErrorLogAt = 0;
  suppressedErrors = 0;
}

export function observeRedisClient<T extends IORedis>(client: T, component: string): T {
  client.on('error', (error) => reportRedisError(component, error));
  client.on('ready', () => reportRedisReady(component));
  return client;
}

type ErrorEmitter = {
  on(event: 'error', listener: (error: Error) => void): unknown;
};

/** Registra el listener obligatorio para Queue y Worker de BullMQ. */
export function observeRedisEmitter<T extends ErrorEmitter>(emitter: T, component: string): T {
  emitter.on('error', (error) => reportRedisError(component, error));
  return emitter;
}

function parseRedisOptions(): RedisOptions {
  const url = new URL(REDIS_URL);
  const dbText = url.pathname.replace(/^\//, '');
  const db = dbText ? Number(dbText) : 0;

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number.isInteger(db) ? db : 0,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    connectTimeout: 1_500,
    retryStrategy: (attempt) => Math.min(250 * (2 ** Math.min(attempt - 1, 6)), 10_000),
  };
}

const baseRedisOptions = parseRedisOptions();

/**
 * Cliente directo usado dentro de peticiones HTTP.
 * Falla rápido y no conserva comandos esperando indefinidamente.
 */
export const redisConnection = observeRedisClient(
  new IORedis(REDIS_URL, {
    connectTimeout: baseRedisOptions.connectTimeout,
    retryStrategy: baseRedisOptions.retryStrategy,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectionName: 'animayuks-api',
  }),
  'api'
);

/** Productores BullMQ invocados por HTTP: deben fallar rápido. */
export const redisConnectionOptions: RedisOptions = {
  ...baseRedisOptions,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectionName: 'animayuks-queue-producer',
};

/** Workers BullMQ: deben permanecer esperando y recuperarse al volver Redis. */
export const redisWorkerConnectionOptions: RedisOptions = {
  ...baseRedisOptions,
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  connectionName: 'animayuks-worker',
};

/** Crea el subscriber dedicado con listeners instalados antes de conectar. */
export function createRedisSubscriber(): IORedis {
  return observeRedisClient(
    new IORedis(REDIS_URL, {
      connectTimeout: baseRedisOptions.connectTimeout,
      retryStrategy: baseRedisOptions.retryStrategy,
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      connectionName: 'animayuks-realtime-subscriber',
    }),
    'realtime-subscriber'
  );
}
