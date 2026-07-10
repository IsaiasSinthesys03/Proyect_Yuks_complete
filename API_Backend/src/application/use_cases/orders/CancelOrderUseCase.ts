import { IOrderRepository } from '../../interfaces/IOrderRepository';
import { IWalletRepository } from '../../interfaces/IWalletRepository';
import { IRewardCodeRepository } from '../../interfaces/IRewardCodeRepository';
import { IProductRepository } from '../../interfaces/IProductRepository';
import { IGameApiClient } from '../../interfaces/IGameApiClient';
import { IPaymentGateway } from '../../interfaces/IPaymentGateway';
import { Order } from '../../../domain/entities/Order';
import { OrderNotFoundError, OrderNotCancellableError, RewardAlreadyClaimedError } from '../../../domain/errors/OrderErrors';

/**
 * Caso de Uso: Cancelación Autónoma de Pedido por el Usuario (REQ-FE-23).
 *
 * Resolución #6 (Anti-fraude): Antes de cancelar, se consulta al backend
 * del videojuego el estado real de cada código de recompensa. Si alguno
 * ya fue canjeado in-game, la cancelación se bloquea por completo —
 * el usuario no puede quedarse con el ítem virtual gratis.
 *
 * Resolución #5 (Anti-fraude de caducidad): El saldo del monedero
 * devuelto hereda la fecha de caducidad ORIGINAL (previa a la compra),
 * no se renueva a 12 meses. Esto evita el loophole de comprar/cancelar
 * repetidamente para mantener saldo vivo indefinidamente.
 */
export class CancelOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly rewardCodeRepository: IRewardCodeRepository,
    private readonly productRepository: IProductRepository,
    private readonly gameApiClient: IGameApiClient,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId, userId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // REQ-FE-23: solo se permite la cancelación autónoma en estado "Pago Confirmado".
    // En PREPARING o después, el botón desaparece del frontend.
    if (order.status !== 'PAID') {
      throw new OrderNotCancellableError(orderId, order.status);
    }

    // --- Resolución #6: Anti-fraude de recompensas ---
    const rewardCodes = await this.rewardCodeRepository.findByOrderId(orderId);
    const availableCodes = rewardCodes.filter((code) => code.status === 'AVAILABLE');

    for (const code of availableCodes) {
      const gameStatus = await this.gameApiClient.checkRewardStatus(code.code);

      if (gameStatus === 'CLAIMED') {
        throw new RewardAlreadyClaimedError(orderId);
      }
      // 'AVAILABLE' o 'NOT_FOUND' (fallback seguro si el Game Server está offline)
      // permiten proceder con la cancelación.
    }

    // --- Revocar todos los códigos AVAILABLE (ya validados, ninguno CLAIMED) ---
    for (const code of availableCodes) {
      await this.rewardCodeRepository.markAsRevoked(code.id);
    }

    // --- Restaurar stock de cada ítem del pedido ---
    const orderDetail = await this.orderRepository.findDetailByOrderId(orderId);
    if (orderDetail) {
      for (const item of orderDetail.items) {
        await this.productRepository.restoreStock(item.variantId, item.quantity);
      }
    }

    // --- Reembolso al monedero, heredando la caducidad original (Resolución #5) ---
    if (order.walletDeduction > 0) {
      const wallet = await this.walletRepository.getOrCreate(userId);
      const originalTransaction = await this.walletRepository.findTransactionByOrderId(orderId, 'PURCHASE');

      await this.walletRepository.credit(
        wallet.id,
        order.walletDeduction,
        orderId,
        'CANCELLATION',
        originalTransaction?.originalExpiresAt ?? undefined
      );
    }

    // --- Reembolso del resto a la pasarela de pago (dinero de pasarela ≠ monedero) ---
    if (order.totalPaid > 0 && order.stripePaymentIntentId) {
      await this.paymentGateway.refund(order.stripePaymentIntentId, order.totalPaid);
    }

    return this.orderRepository.updateStatus(orderId, 'CANCELLED');
  }
}
