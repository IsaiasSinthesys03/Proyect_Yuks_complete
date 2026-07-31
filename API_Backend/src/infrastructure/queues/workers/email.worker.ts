import { Worker, Job } from 'bullmq';
import { observeRedisEmitter, redisWorkerConnectionOptions } from '../../cache/redis-client';
import { EMAIL_QUEUE_NAME } from '../email-queue';
import { ResendEmailService } from '../../services/email/ResendEmailService';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Worker de Email Transaccional (REQ-BE-04, REQ-BE-09).
 *
 * Proceso independiente del servidor HTTP — puede escalar horizontalmente
 * en pods separados sin afectar la API.
 *
 * JOBS MANEJADOS:
 *   - 'email:order_status'    → Notificación de cambio de estado de pedido
 *   - 'email:donation_receipt' → Recibo de donación confirmada
 *   - 'email:password_reset'  → Enlace de recuperación de contraseña (Fase 29)
 *   - 'email:otp'             → Código OTP para cambio email/teléfono (Fase 29)
 *
 * Mini Composition Root: instancia sus propias dependencias de infraestructura.
 * No reutiliza el grafo de main.ts porque puede ejecutarse en proceso separado.
 */
const EMAIL_API_KEY  = process.env.EMAIL_API_KEY  || '';
const EMAIL_FROM     = process.env.EMAIL_FROM     || 'noreply@animayuks.com';

const emailService = new ResendEmailService(EMAIL_API_KEY, EMAIL_FROM);

interface OrderStatusJobData {
  to: string;
  orderId: string;
  newStatus: string;
  totalPaid: number;
}

interface DonationReceiptJobData {
  to: string;
  donationId: string;
  amount: number;
}

interface PasswordResetJobData {
  to: string;
  resetLink: string;
  expiresInMinutes: number;
}

interface OtpJobData {
  to: string;
  otp: string;
  purpose: 'email_change' | 'phone_change';
}

export const emailWorker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job: Job) => {
    console.log(`[Email Worker] Procesando job "${job.name}" (id: ${job.id})...`);

    switch (job.name) {
      case 'email:order_status': {
        const data = job.data as OrderStatusJobData;
        await emailService.sendOrderStatusEmail(data);
        console.log(`✅ [Email Worker] Email de estado de orden enviado a ${data.to} — status: ${data.newStatus}`);
        break;
      }

      case 'email:donation_receipt': {
        const data = job.data as DonationReceiptJobData;
        await emailService.sendDonationReceiptEmail(data);
        console.log(`✅ [Email Worker] Recibo de donación enviado a ${data.to}`);
        break;
      }

      case 'email:password_reset': {
        const data = job.data as PasswordResetJobData;
        await emailService.sendPasswordResetEmail(data);
        console.log(`✅ [Email Worker] Email de recuperación enviado a ${data.to}`);
        break;
      }

      case 'email:otp': {
        const data = job.data as OtpJobData;
        await emailService.sendOtpEmail(data);
        console.log(`✅ [Email Worker] OTP enviado a ${data.to} — propósito: ${data.purpose}`);
        break;
      }

      default:
        console.warn(`[Email Worker] Job "${job.name}" sin handler registrado. Ignorado.`);
    }
  },
  {
    connection: redisWorkerConnectionOptions,
    concurrency: 5,
  }
);

observeRedisEmitter(emailWorker, 'worker:email');

emailWorker.on('failed', (job, error) => {
  if (!job) return;
  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (isFinalAttempt) {
    console.error(`🚨 [Email Worker DLQ] Job "${job.name}" agotó sus intentos:`, error.message);
  } else {
    console.warn(`⚠️  [Email Worker] Intento ${job.attemptsMade} de "${job.name}" falló. BullMQ reintentará.`);
  }
});

emailWorker.on('completed', (job) => {
  console.log(`🏁 [Email Worker] Job ${job.id} (${job.name}) completado.`);
});

console.log(`🔧 Email Worker "${EMAIL_QUEUE_NAME}" escuchando trabajos...`);
