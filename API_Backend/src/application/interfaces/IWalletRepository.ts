import { Wallet } from '../../domain/entities/Wallet';
import { WalletTransaction, WalletTransactionSource } from '../../domain/entities/WalletTransaction';
import { PaginatedResponseDTO } from '../../domain/types/ProductDTOs';

/**
 * Puerto (Interfaz) del Repositorio del Monedero Virtual.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la capa de Infrastructure debe implementar.
 *
 * REGLAS DE NEGOCIO CRÍTICAS que la implementación DEBE respetar:
 *   - Q8: `balance` NUNCA puede ser negativo. El constraint SQL
 *     `CHECK (balance >= 0)` es la red de seguridad final.
 *   - Resolución #4: Cada ingreso (credit) renueva `expires_at` a NOW() + 12 meses,
 *     EXCEPTO cuando se pasa `originalExpiresAt` (Resolución #5).
 *   - Resolución #5: En reembolsos por cancelación, el saldo devuelto
 *     hereda la fecha de caducidad original para evitar el loophole anti-fraude.
 */
export interface IWalletRepository {
  /**
   * Busca el monedero de un usuario.
   * @returns El monedero encontrado, o null si no existe.
   */
  findByUserId(userId: string): Promise<Wallet | null>;

  /**
   * Obtiene o crea el monedero de un usuario (lazy initialization).
   * Si no existe, lo crea con balance = 0 y sin fecha de caducidad.
   * @returns El monedero existente o recién creado.
   */
  getOrCreate(userId: string): Promise<Wallet>;

  /**
   * Resta saldo del monedero y registra una transacción WITHDRAWAL.
   *
   * SEGURIDAD: La implementación DEBE usar una operación atómica SQL
   * (UPDATE wallet SET balance = balance - amount WHERE id = walletId AND balance >= amount)
   * para prevenir race conditions. Si el balance queda negativo, el
   * constraint SQL `CHECK (balance >= 0)` abortará la transacción.
   *
   * @param walletId - UUID del monedero.
   * @param amount - Monto a debitar (positivo).
   * @param orderId - UUID del pedido asociado.
   * @param source - Fuente del movimiento ('PURCHASE').
   * @returns La transacción registrada.
   */
  debit(
    walletId: string,
    amount: number,
    orderId: string,
    source: WalletTransactionSource
  ): Promise<WalletTransaction>;

  /**
   * Suma saldo al monedero y registra una transacción DEPOSIT.
   *
   * REGLA DE CADUCIDAD:
   *   - Si `originalExpiresAt` se proporciona (Resolución #5, reembolso por cancelación):
   *     Hereda esa fecha de caducidad. NO renueva a 12 meses.
   *   - Si `originalExpiresAt` NO se proporciona (Resolución #4, ingreso normal):
   *     Renueva `expires_at` a NOW() + 12 meses.
   *
   * @param walletId - UUID del monedero.
   * @param amount - Monto a acreditar (positivo).
   * @param orderId - UUID del pedido asociado (puede ser null para inyecciones admin).
   * @param source - Fuente del movimiento ('REFUND' | 'CANCELLATION').
   * @param originalExpiresAt - Fecha de caducidad heredada (solo para Resolución #5).
   * @returns La transacción registrada.
   */
  credit(
    walletId: string,
    amount: number,
    orderId: string | null,
    source: WalletTransactionSource,
    originalExpiresAt?: Date
  ): Promise<WalletTransaction>;

  /**
   * Obtiene el historial de transacciones del monedero con paginación.
   * Ordenado por createdAt DESC (más reciente primero).
   */
  getTransactions(
    walletId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponseDTO<WalletTransaction>>;

  /**
   * Busca la transacción de un monedero asociada a un pedido y fuente específicos.
   *
   * Uso principal (Resolución #5): Al cancelar un pedido, se necesita
   * recuperar la transacción WITHDRAWAL/PURCHASE original para leer su
   * `originalExpiresAt` (el `expiresAt` del monedero ANTES de la compra)
   * y heredarlo al devolver el saldo, evitando el loophole anti-fraude.
   */
  findTransactionByOrderId(
    orderId: string,
    source: WalletTransactionSource
  ): Promise<WalletTransaction | null>;
}
