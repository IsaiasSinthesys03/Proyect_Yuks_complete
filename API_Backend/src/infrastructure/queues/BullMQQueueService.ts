import { IQueueService } from '../../application/interfaces/IQueueService';
import { reconciliationQueue } from './reconciliation-queue';
import { emailQueue } from './email-queue';
import { reportsQueue } from './reports-queue';

/**
 * Implementación concreta de IQueueService usando BullMQ.
 *
 * ENRUTAMIENTO DE COLAS POR PREFIJO:
 *   - 'email:*'       → emailQueue (envío asíncrono de correos, REQ-BE-04)
 *   - 'report:*'      → reportsQueue (generación de CSV, CMS-BE-05, Fase 31)
 *   - 'reconcile:*'   → reconciliationQueue (DLQ de pagos, Q4)
 *   - todo lo demás   → reconciliationQueue (backward compat)
 *
 * Los Use Cases nunca conocen qué cola se usa — solo llaman enqueue().
 */
export class BullMQQueueService implements IQueueService {
  async enqueue(jobName: string, payload: Record<string, unknown>): Promise<void> {
    if (jobName.startsWith('email:')) {
      await emailQueue.add(jobName, payload);
    } else if (jobName.startsWith('report:')) {
      await reportsQueue.add(jobName, payload);
    } else {
      await reconciliationQueue.add(jobName, payload);
    }
  }
}
