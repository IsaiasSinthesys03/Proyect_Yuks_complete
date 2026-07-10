import { IRewardCodeRepository } from '../../interfaces/IRewardCodeRepository';
import { IOrderRepository } from '../../interfaces/IOrderRepository';
import { ValidateRewardResponseDTO } from '../../../domain/types/RewardDTOs';

/**
 * Caso de Uso: Validación M2M de Código de Recompensa (REQ-BE-05, Q11).
 *
 * Consumido exclusivamente por el backend del videojuego (Service Account
 * Token, sin contexto de usuario autenticado). Responde con un DTO de
 * resultado en vez de lanzar excepciones — el Game Server necesita un
 * contrato de respuesta predecible, no un manejo de errores HTTP.
 */
export class ValidateRewardM2MUseCase {
  constructor(
    private readonly rewardCodeRepository: IRewardCodeRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(code: string): Promise<ValidateRewardResponseDTO> {
    const rewardCode = await this.rewardCodeRepository.findByCode(code);

    if (!rewardCode) {
      return { valid: false, reason: 'NOT_FOUND' };
    }

    if (rewardCode.status === 'CLAIMED') {
      return { valid: false, reason: 'ALREADY_CLAIMED' };
    }

    if (rewardCode.status === 'REVOKED') {
      return { valid: false, reason: 'REVOKED' };
    }

    // status === 'AVAILABLE': canjear ahora.
    await this.rewardCodeRepository.markAsClaimed(rewardCode.id);

    const item = await this.orderRepository.findItemById(rewardCode.orderItemId);

    return {
      valid: true,
      rewardData: {
        productName: item?.productName ?? 'Producto desconocido',
        variantSku: item?.variantSku ?? '',
      },
    };
  }
}
