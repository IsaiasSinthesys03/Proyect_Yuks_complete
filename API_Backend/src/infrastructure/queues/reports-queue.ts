import { Queue } from 'bullmq';
import { observeRedisEmitter, redisConnectionOptions } from '../cache/redis-client';

export const REPORTS_QUEUE_NAME = 'animayuks-reports-queue';

/**
 * Cola BullMQ para la generación asíncrona de reportes CSV (CMS-BE-05, Fase 31).
 *
 * DISEÑO: el controlador encola aquí y responde de inmediato con un jobId — el
 * hilo HTTP NUNCA construye el CSV (que puede recorrer miles de filas). El
 * `reports.worker` consume, arma el archivo y notifica al admin vía WebSocket.
 */
export const reportsQueue = new Queue(REPORTS_QUEUE_NAME, {
  connection: redisConnectionOptions,
  skipWaitingForReady: true,
  skipVersionCheck: true,
  skipMetasUpdate: true,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

observeRedisEmitter(reportsQueue, 'queue:reports');
