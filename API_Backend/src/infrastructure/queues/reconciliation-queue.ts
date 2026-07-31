import { Queue } from 'bullmq';
import { observeRedisEmitter, redisConnectionOptions } from '../cache/redis-client';

/**
 * Cola dedicada de Reconciliación de Pagos (Q4 — Dead Letter Queue).
 *
 * Separada de `animayuks-main-queue` porque sus jobs representan dinero real
 * ya cobrado por Stripe que necesita aterrizar en SQL — exige una política
 * de reintentos más agresiva (5 intentos) que el resto de trabajos genéricos
 * (reportes, notificaciones), que se conforman con 3.
 */
export const RECONCILIATION_QUEUE_NAME = 'animayuks-reconciliation-queue';

export const reconciliationQueue = new Queue(RECONCILIATION_QUEUE_NAME, {
  connection: redisConnectionOptions,
  skipWaitingForReady: true,
  skipVersionCheck: true,
  skipMetasUpdate: true,
  defaultJobOptions: {
    attempts: 5, // Q4: "Si falla 5 veces, marca NEEDS_RECONCILIATION"
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s, 16s, 32s
    removeOnComplete: true,
    removeOnFail: false, // Se conservan para inspección manual del administrador
  },
});

observeRedisEmitter(reconciliationQueue, 'queue:reconciliation');
