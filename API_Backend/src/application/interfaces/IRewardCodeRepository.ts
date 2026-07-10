import { RewardCode } from '../../domain/entities/RewardCode';

/**
 * Puerto (Interfaz) del Repositorio de Códigos de Recompensa.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la capa de Infrastructure debe implementar.
 *
 * REGLAS DE NEGOCIO:
 *   - Resolución #7: Generación Unitaria (1 a 1). Por cada unidad comprada
 *     de un producto con hasVirtualReward, se genera un código UUID separado.
 *     Ejemplo: qty=5 → 5 códigos individuales.
 *   - Resolución #6: Los códigos NO caducan. Solo se revocan por cancelación.
 */
export interface IRewardCodeRepository {
  /**
   * Genera códigos de recompensa en lote para los ítems de un pedido.
   *
   * Para cada item con hasVirtualReward = true, genera `quantity` códigos UUID.
   * (Resolución #7: generación unitaria 1 a 1).
   *
   * @param orderId - UUID del pedido.
   * @param orderItems - Ítems del pedido con sus flags de recompensa y cantidades.
   * @returns Todos los códigos generados.
   */
  createBatch(
    orderId: string,
    orderItems: Array<{
      orderItemId: string;
      hasVirtualReward: boolean;
      quantity: number;
    }>
  ): Promise<RewardCode[]>;

  /**
   * Obtiene todos los códigos de recompensa de un pedido.
   */
  findByOrderId(orderId: string): Promise<RewardCode[]>;

  /**
   * Obtiene todos los códigos de recompensa de un usuario.
   * La implementación debe hacer JOIN con orders para filtrar por user_id.
   */
  findByUserId(userId: string): Promise<RewardCode[]>;

  /**
   * Busca un código de recompensa por su UUID.
   * Usado en la validación M2M del Game Bridge (Q11).
   */
  findByCode(code: string): Promise<RewardCode | null>;

  /**
   * Marca un código como CLAIMED y registra la fecha de canje.
   * Actualiza: status → 'CLAIMED', claimed_at → NOW().
   */
  markAsClaimed(codeId: string): Promise<void>;

  /**
   * Marca un código como REVOKED y registra la fecha de revocación.
   * Actualiza: status → 'REVOKED', revoked_at → NOW().
   * Solo se invoca durante la cancelación de un pedido (Resolución #6).
   */
  markAsRevoked(codeId: string): Promise<void>;
}
