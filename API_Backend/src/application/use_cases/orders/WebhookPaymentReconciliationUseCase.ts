import { IOrderRepository } from '../../interfaces/IOrderRepository';
import { IProductRepository } from '../../interfaces/IProductRepository';
import { IPaymentGateway } from '../../interfaces/IPaymentGateway';
import { IUserRepository } from '../../interfaces/IUserRepository';
import { IRealtimeService, createRealtimeEvent } from '../../interfaces/IRealtimeService';
import { AwardExperienceUseCase } from '../gamification/AwardExperienceUseCase';
import { Order, OrderStatus } from '../../../domain/entities/Order';
import { StockExpiredAfter3DSecureError } from '../../../domain/errors/CheckoutErrors';

export interface WebhookReconciliationResultDTO {
  handled: boolean;
  orderId?: string;
  status?: OrderStatus;
}

/**
 * Caso de Uso: Reconciliación de Pagos vía Webhook (REQ-BE-02).
 *
 * PUREZA DEL HEXÁGONO: Esta clase NUNCA toca el SDK de Stripe ni parsea la
 * forma de su payload. Solo conoce `WebhookEventDTO` (agnóstico al proveedor),
 * que `IPaymentGateway.parseWebhookEvent` produce — incluyendo la verificación
 * de firma HMAC, que ahora vive enteramente en la implementación concreta.
 *
 * Resolución #1 (Auto-Refund): Si el pago de Stripe llega tarde
 * (ej. 3D Secure tardó más de los 10 minutos del lock de stock) y el
 * inventario ya se agotó por otro cliente, se ejecuta un reembolso total
 * inmediato y la orden se cancela — nunca se permite la sobreventa.
 */
export class WebhookPaymentReconciliationUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly awardExperienceUseCase: AwardExperienceUseCase,
    private readonly userRepository: IUserRepository,
    private readonly realtimeService: IRealtimeService
  ) {}

  async execute(rawPayload: Buffer, signature: string): Promise<WebhookReconciliationResultDTO> {
    // La verificación HMAC ocurre DENTRO de parseWebhookEvent (lanza
    // WebhookSignatureInvalidError si la firma no es válida).
    const event = this.paymentGateway.parseWebhookEvent(rawPayload, signature);

    if (event.type !== 'PAYMENT_SUCCESS') {
      // PAYMENT_FAILED y UNHANDLED no están en el alcance de esta
      // reconciliación; se ignoran de forma idempotente.
      return { handled: false };
    }

    const providerOrderId = event.providerOrderId;
    const order = await this.orderRepository.findByStripePaymentIntentId(providerOrderId);

    if (!order) {
      return { handled: false };
    }

    // Idempotencia: si la orden ya no está PAYMENT_PENDING, el webhook
    // ya fue procesado anteriormente (Stripe puede reenviar el mismo evento).
    if (order.status !== 'PAYMENT_PENDING') {
      return { handled: true, orderId: order.id, status: order.status };
    }

    // Resolución #1: verificar que el stock sigue disponible tras la
    // autorización tardía del banco (3D Secure).
    const orderDetail = await this.orderRepository.findDetailByOrderId(order.id);
    if (!orderDetail) {
      return { handled: false };
    }

    for (const item of orderDetail.items) {
      const variantInfo = await this.productRepository.findVariantWithProductById(item.variantId);
      const currentStock = variantInfo?.variant.stock ?? 0;

      if (currentStock < item.quantity) {
        // El stock se agotó mientras el banco autorizaba. Reembolso total automático.
        await this.paymentGateway.refund(providerOrderId);
        const cancelledOrder = await this.orderRepository.updateStatus(order.id, 'CANCELLED');

        throw new StockExpiredAfter3DSecureError(cancelledOrder.id);
      }
    }

    const paidOrder = await this.orderRepository.updateStatus(order.id, 'PAID');

    // ▓ GAMIFICACIÓN (Fase 31) ▓ La XP se otorga ESTRICTAMENTE aquí: el pago
    // acaba de confirmarse. Es best-effort — un fallo en el cálculo de XP JAMÁS
    // debe revertir un pago ya cobrado ni provocar que Stripe reintente el
    // webhook. Por eso se aísla en su propio try/catch.
    try {
      await this.awardExperienceUseCase.execute(paidOrder.userId, paidOrder.totalPaid);
    } catch (xpError) {
      console.error(`[Gamification] No se pudo otorgar XP para la orden ${paidOrder.id}:`, xpError);
    }

    // ▓ SOCIAL PROOF / FOMO (C-02, REQ-BE-10, REQ-FE-32) ▓ Al confirmarse una
    // compra real, se transmite un evento ANONIMIZADO a TODOS los clientes
    // conectados ("⚡ Roberto G. de Mérida acaba de comprar Playera Élite").
    // Best-effort: nunca rompe el webhook. Reutiliza `orderDetail` ya cargado.
    try {
      await this.broadcastSocialProof(paidOrder, orderDetail.items[0]?.productName);
    } catch (spError) {
      console.error(`[SocialProof] No se pudo emitir el broadcast de la orden ${paidOrder.id}:`, spError);
    }

    return { handled: true, orderId: paidOrder.id, status: paidOrder.status };
  }

  /**
   * Construye y transmite el evento de Social Proof de forma anónima:
   * nombre + inicial del apellido + municipio + producto. Nunca expone el
   * email, el ID del usuario ni el monto exacto.
   */
  private async broadcastSocialProof(order: Order, productName: string | undefined): Promise<void> {
    const profile = await this.userRepository.findProfileByUserId(order.userId);
    const firstName = profile?.firstName?.trim() || 'Alguien';
    const lastInitial = profile?.lastName?.trim()?.charAt(0);
    const displayName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;

    this.realtimeService.broadcastPublic(
      createRealtimeEvent('social_proof:purchase', {
        displayName,
        municipality: order.municipality,
        productName: productName ?? 'un producto',
      })
    );
  }
}
