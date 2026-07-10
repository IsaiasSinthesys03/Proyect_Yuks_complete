import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../cache/redis-client';

export const EMAIL_QUEUE_NAME = 'animayuks-email-queue';

/**
 * Cola BullMQ para envío asíncrono de emails transaccionales (REQ-BE-04).
 *
 * DISEÑO: el envío de email NUNCA ocurre en el flujo HTTP sincrónico.
 * Los Use Cases y Controllers encolan aquí; el Email Worker consume en background.
 *
 * Reintentos: 3 intentos con backoff exponencial. Si los 3 fallan, el job
 * queda en estado 'failed' para inspección manual (DLQ de emails).
 */
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: { count: 100 }, // Mantener solo los últimos 100 completados
    removeOnFail: { count: 200 },     // Mantener los últimos 200 fallidos para debugging
  },
});
