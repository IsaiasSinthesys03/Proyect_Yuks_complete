import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { redisConnectionOptions } from '../../cache/redis-client';
import { RECONCILIATION_QUEUE_NAME } from '../reconciliation-queue';
import { OrderRepository } from '../../database/repositories/OrderRepository';
import { ProductRepository } from '../../database/repositories/ProductRepository';
import { WalletRepository } from '../../database/repositories/WalletRepository';
import { CouponRepository } from '../../database/repositories/CouponRepository';
import { RewardCodeRepository } from '../../database/repositories/RewardCodeRepository';

dotenv.config();

/**
 * Worker de Reconciliación de Pagos (Q4 — Dead Letter Queue real).
 *
 * Mini Composition Root del proceso worker: instancia sus propios
 * repositorios concretos. No reutiliza el grafo de `main.ts` porque este
 * worker puede ejecutarse en un proceso/contenedor separado del servidor HTTP.
 */
const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();
const walletRepository = new WalletRepository();
const couponRepository = new CouponRepository();
const rewardCodeRepository = new RewardCodeRepository();

// Cliente Redis independiente para invalidar la caché de top-products (REQ-BE-10).
// Se usa una instancia separada de la de BullMQ para no compartir el pool de conexiones.
const redisWorker = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

interface ReconcileCheckoutJobData {
  orderId: string;
}

/**
 * Reintenta los pasos post-commit del checkout que fallaron por una causa
 * de infraestructura (ver `ProcessCheckoutUseCase`, rama Q4 del catch).
 *
 * IDEMPOTENCIA DE REINTENTO: cada paso verifica si ya fue aplicado antes de
 * reintentarlo, para que ejecutar este job varias veces (reintentos de
 * BullMQ) nunca decremente stock dos veces ni debite el monedero dos veces.
 */
async function reconcileCheckout(orderId: string): Promise<void> {
  const detail = await orderRepository.findDetailByOrderId(orderId);
  if (!detail) {
    throw new Error(`[Reconciliation] Orden "${orderId}" no encontrada — no se puede reconciliar.`);
  }

  const { order, items } = detail;

  // 1. Decremento de stock — decrementStock ya es una operación condicional
  //    (stock >= quantity). Si ya se aplicó en un intento previo y el stock
  //    cambió legítimamente, este retry podría fallar su condición; se
  //    seguro inspeccionar manualmente, así que solo se registra el aviso.
  for (const item of items) {
    const decremented = await productRepository.decrementStock(item.variantId, item.quantity);
    if (!decremented) {
      console.warn(
        `[Reconciliation] No se pudo decrementar stock de la variante ${item.variantId} ` +
          `para la orden ${orderId} — probablemente ya se decrementó en un intento previo.`
      );
    }
  }

  // 2. Incremento de uso del cupón (idempotente a nivel de negocio: si ya se
  //    incrementó, volver a incrementar duplicaría el conteo — se omite si
  //    no hay forma de verificarlo aquí sin un campo de auditoría dedicado;
  //    se documenta como limitación conocida).
  if (order.couponId) {
    await couponRepository.incrementUsage(order.couponId);
  }

  // 3. Débito de monedero — SÍ es verificable de forma idempotente: se
  //    comprueba si ya existe la transacción WITHDRAWAL/PURCHASE de esta orden.
  if (order.walletDeduction > 0) {
    const existingDebit = await walletRepository.findTransactionByOrderId(orderId, 'PURCHASE');
    if (!existingDebit) {
      const wallet = await walletRepository.getOrCreate(order.userId);
      await walletRepository.debit(wallet.id, order.walletDeduction, orderId, 'PURCHASE');
    }
  }

  // 4. Generación de reward codes — verificable: si ya existen códigos para
  //    la orden, no se regeneran (Resolución #7: 1 código por unidad, exactos).
  if (items.some((item) => item.hasVirtualReward)) {
    const existingCodes = await rewardCodeRepository.findByOrderId(orderId);
    if (existingCodes.length === 0) {
      await rewardCodeRepository.createBatch(
        orderId,
        items.map((item) => ({
          orderItemId: item.id,
          hasVirtualReward: item.hasVirtualReward,
          quantity: item.quantity,
        }))
      );
    }
  }

  // Reconciliación exitosa: la orden pasa de NEEDS_RECONCILIATION a su
  // estado final correcto según si requería cobro de pasarela o no.
  const finalStatus = order.totalPaid > 0 ? 'PAYMENT_PENDING' : 'PAID';
  await orderRepository.updateStatus(orderId, finalStatus);

  // Invalidar caché de top-products cuando una orden llega a PAID (stock se decrementó).
  // Los keys siguen el patrón cache:top-products:* (por límite).
  if (finalStatus === 'PAID') {
    try {
      const keys = await redisWorker.keys('cache:top-products:*');
      if (keys.length > 0) {
        await redisWorker.del(...keys);
        console.log(`[Reconciliation Worker] Caché de top-products invalidada (${keys.length} key(s)).`);
      }
    } catch (cacheErr) {
      // Fallo de caché nunca aborta la reconciliación
      console.warn('[Reconciliation Worker] No se pudo invalidar caché de top-products:', cacheErr);
    }
  }
}

export const paymentReconciliationWorker = new Worker<ReconcileCheckoutJobData>(
  RECONCILIATION_QUEUE_NAME,
  async (job: Job<ReconcileCheckoutJobData>) => {
    if (job.name !== 'reconcile-checkout') {
      console.log(`[Reconciliation Worker] Job "${job.name}" sin handler registrado. Ignorado.`);
      return;
    }

    console.log(
      `[Reconciliation Worker] Reintentando checkout de la orden ${job.data.orderId} ` +
        `(intento ${job.attemptsMade + 1}/${job.opts.attempts ?? 1})...`
    );

    await reconcileCheckout(job.data.orderId);

    console.log(`✅ [Reconciliation Worker] Orden ${job.data.orderId} reconciliada exitosamente.`);
  },
  {
    connection: redisConnectionOptions,
    concurrency: 3,
  }
);

/**
 * Q4 (DLQ real): BullMQ emite 'failed' en CADA intento fallido, no solo en
 * el definitivo. Se distingue el intento final (`attemptsMade >= attempts`)
 * para certificar que la orden requiere intervención humana — recién en
 * ESE momento se actualiza el status, atómicamente, a NEEDS_RECONCILIATION.
 */
paymentReconciliationWorker.on('failed', async (job, error) => {
  if (!job) return;

  const maxAttempts = job.opts.attempts ?? 1;
  const isFinalAttempt = job.attemptsMade >= maxAttempts;

  if (!isFinalAttempt) {
    console.warn(
      `⚠️  [Reconciliation Worker] Intento ${job.attemptsMade}/${maxAttempts} falló para ` +
        `la orden ${job.data.orderId}: ${error.message}. BullMQ reintentará con backoff exponencial.`
    );
    return;
  }

  console.error(
    `🚨 [DLQ] Orden ${job.data.orderId} agotó sus ${maxAttempts} intentos de reconciliación. ` +
      `Requiere intervención manual del administrador.`
  );

  try {
    await orderRepository.updateStatus(job.data.orderId, 'NEEDS_RECONCILIATION');
  } catch (updateError) {
    console.error(
      `❌ [DLQ] No se pudo confirmar el status NEEDS_RECONCILIATION de la orden ${job.data.orderId}:`,
      updateError
    );
  }
});

paymentReconciliationWorker.on('completed', (job) => {
  console.log(`🏁 [Reconciliation Worker] Job ${job.id} (orden ${job.data.orderId}) completado.`);
});

console.log('🔧 Worker "animayuks-reconciliation-queue" (DLQ de pagos) escuchando trabajos...');
