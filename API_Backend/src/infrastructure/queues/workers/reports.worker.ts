import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import {
  observeRedisClient,
  observeRedisEmitter,
  redisWorkerConnectionOptions,
} from '../../cache/redis-client';
import { REPORTS_QUEUE_NAME } from '../reports-queue';
import { ReportRepository } from '../../database/repositories/ReportRepository';
import { ReportGenerationService } from '../../services/reports/ReportGenerationService';
import { RedisRealtimePublisher } from '../../realtime/RedisRealtimePublisher';
import { createRealtimeEvent } from '../../../application/interfaces/IRealtimeService';
import { ReportType } from '../../../domain/types/ReportDTOs';

dotenv.config();

/**
 * Worker de Generación de Reportes CSV (CMS-BE-05, Fase 31).
 *
 * Proceso independiente del servidor HTTP. Mini Composition Root:
 *   - ReportRepository + ReportGenerationService → construyen el CSV en disco.
 *   - RedisRealtimePublisher → notifica a los admins conectados vía Redis Pub/Sub
 *     (la API está suscrita y reenvía a las conexiones WebSocket).
 *
 * Al terminar, publica `report:ready` con el jobId, el tipo y el conteo de filas.
 * Si falla tras agotar reintentos, publica `report:failed`.
 */
const reportRepository = new ReportRepository();
const reportGenerationService = new ReportGenerationService(reportRepository);

// Conexión Redis dedicada para publicar (independiente de la de BullMQ).
const publisherRedis = observeRedisClient(
  new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
  }),
  'worker:reports-publisher'
);
const realtimePublisher = new RedisRealtimePublisher(publisherRedis);

interface ReportJobData {
  jobId: string;
  reportType: ReportType;
  format?: 'csv' | 'json';
  startDate?: string | null;
  endDate?: string | null;
  requestedByEmail: string;
}

export const reportsWorker = new Worker(
  REPORTS_QUEUE_NAME,
  async (job: Job<ReportJobData>) => {
    if (job.name !== 'report:generate') {
      console.warn(`[Reports Worker] Job "${job.name}" sin handler. Ignorado.`);
      return;
    }

    const { jobId, reportType, format, startDate, endDate, requestedByEmail } = job.data;
    console.log(`[Reports Worker] Generando reporte "${reportType}" (${format ?? 'csv'}, job ${jobId})...`);

    const filter = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const result = await reportGenerationService.generate(reportType, jobId, format ?? 'csv', filter);

    // Notificar a los admins vía Redis Pub/Sub → WebSocket.
    await realtimePublisher.publishAdminEvent(
      createRealtimeEvent('report:ready', {
        jobId,
        reportType,
        format: result.format,
        rowCount: result.rowCount,
        requestedByEmail,
        downloadUrl: `/api/admin/reports/${jobId}/download`,
      })
    );

    console.log(`✅ [Reports Worker] Reporte "${reportType}" listo: ${result.rowCount} filas → ${result.filePath}`);
  },
  {
    connection: redisWorkerConnectionOptions,
    concurrency: 2,
  }
);

observeRedisEmitter(reportsWorker, 'worker:reports');

reportsWorker.on('failed', async (job, error) => {
  if (!job) return;
  const isFinal = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (isFinal) {
    console.error(`🚨 [Reports Worker] Job ${job.data.jobId} agotó reintentos:`, error.message);
    try {
      await realtimePublisher.publishAdminEvent(
        createRealtimeEvent('report:failed', { jobId: job.data.jobId, reportType: job.data.reportType, error: error.message })
      );
    } catch (pubErr) {
      console.error('[Reports Worker] No se pudo publicar report:failed:', pubErr);
    }
  } else {
    console.warn(`⚠️  [Reports Worker] Intento ${job.attemptsMade} de ${job.data.jobId} falló. Reintentando.`);
  }
});

console.log(`🔧 Reports Worker "${REPORTS_QUEUE_NAME}" escuchando trabajos...`);
