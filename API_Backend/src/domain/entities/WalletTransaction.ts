/**
 * Entidad de Dominio: WalletTransaction
 *
 * Representa un movimiento individual en el ledger del monedero (REQ-FE-20).
 *
 * Tipos de movimiento:
 *   - DEPOSIT: Ingreso de saldo (ej. reembolso por cancelación, reembolso admin).
 *   - WITHDRAWAL: Egreso de saldo (ej. deducción en checkout).
 *
 * Fuentes del movimiento:
 *   - REFUND: Reembolso de pasarela de pago al monedero (dinero nuevo → renueva caducidad).
 *   - PURCHASE: Deducción durante el checkout.
 *   - CANCELLATION: Devolución por cancelación autónoma del pedido.
 *
 * Campo anti-fraude — originalExpiresAt (Resolución #5):
 *   Cuando un usuario cancela un pedido y el saldo del monedero usado se devuelve,
 *   se HEREDA la fecha de caducidad original (no se renueva a 12 meses).
 *   Esto previene el loophole de comprar y cancelar repetidamente para
 *   renovar saldo a punto de caducar.
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface WalletTransaction {
  readonly id: string;
  readonly walletId: string;
  readonly orderId: string | null;
  readonly amount: number;
  readonly type: WalletTransactionType;
  readonly source: WalletTransactionSource;
  readonly description: string | null;
  readonly originalExpiresAt: Date | null;
  readonly createdAt: Date;
}

export type WalletTransactionType = 'DEPOSIT' | 'WITHDRAWAL';

export type WalletTransactionSource = 'REFUND' | 'PURCHASE' | 'CANCELLATION';
