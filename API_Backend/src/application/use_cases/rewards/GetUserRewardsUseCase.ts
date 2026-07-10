import { IRewardCodeRepository } from '../../interfaces/IRewardCodeRepository';
import { IOrderRepository } from '../../interfaces/IOrderRepository';
import { RewardCodeDTO } from '../../../domain/types/RewardDTOs';

/**
 * Caso de Uso: Obtener la Bóveda de Recompensas del usuario (REQ-FE-22).
 *
 * Cada código de recompensa solo guarda `orderItemId`, no el nombre del
 * producto — se resuelve consultando el detalle de la orden propietaria
 * (snapshot congelado de `productName`, REQ-BE-01) y mapeando el status
 * a su representación visual (🟢 AVAILABLE / ⚪ CLAIMED).
 */
export class GetUserRewardsUseCase {
  constructor(
    private readonly rewardCodeRepository: IRewardCodeRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(userId: string): Promise<RewardCodeDTO[]> {
    const rewardCodes = await this.rewardCodeRepository.findByUserId(userId);
    if (rewardCodes.length === 0) return [];

    const uniqueOrderIds = [...new Set(rewardCodes.map((rc) => rc.orderId))];

    const orderDetails = await Promise.all(
      uniqueOrderIds.map((orderId) => this.orderRepository.findDetailById(orderId, userId))
    );

    const itemNameByOrderItemId = new Map<string, string>();
    for (const detail of orderDetails) {
      if (!detail) continue;
      for (const item of detail.items) {
        itemNameByOrderItemId.set(item.id, item.productName);
      }
    }

    return rewardCodes.map((rc) => ({
      code: rc.code,
      status: rc.status === 'CLAIMED' ? '⚪ Canjeado' : rc.status === 'REVOKED' ? 'Revocado' : '🟢 Listo para usar',
      productName: itemNameByOrderItemId.get(rc.orderItemId) ?? 'Producto desconocido',
      claimedAt: rc.claimedAt ?? undefined,
    }));
  }
}
