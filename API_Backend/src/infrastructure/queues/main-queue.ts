import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../cache/redis-client';

// Cola principal del sistema Animayuks.
// Procesa: Reconciliación DLQ, Exportación de Reportes, Notificaciones por correo.
export const mainQueue = new Queue('animayuks-main-queue', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,                    // Reintentos antes de enviar al DLQ
    backoff: { type: 'exponential', delay: 1000 }, // Backoff exponencial: 1s, 2s, 4s
    removeOnComplete: true,         // Limpiar jobs completados de Redis
    removeOnFail: false,            // Mantener los fallidos para inspección/DLQ
  },
});

console.log('📬 Cola "animayuks-main-queue" instanciada.');
