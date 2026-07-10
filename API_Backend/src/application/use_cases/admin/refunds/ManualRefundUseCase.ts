import * as argon2 from 'argon2';
import { IUserRepository } from '../../../interfaces/IUserRepository';
import { IOrderRepository } from '../../../interfaces/IOrderRepository';
import { IPaymentGateway } from '../../../interfaces/IPaymentGateway';
import { IAuditLogRepository } from '../../../interfaces/IAuditLogRepository';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { ManualRefundDTO, RefundResultDTO } from '../../../../domain/types/AdminRefundDTOs';
import {
  ReauthFailedError,
  RefundAmountExceedsTotalError,
  OrderNotRefundableError,
  RefundGatewayError,
} from '../../../../domain/errors/RefundErrors';
import { OrderNotFoundAdminError } from '../../../../domain/errors/OrderTransitionErrors';

/**
 * Caso de Uso: Reembolso Manual con Re-Autenticación (Fase 25).
 *
 * INVARIANTE DE SEGURIDAD CRÍTICA:
 *   paymentGateway.refund() NUNCA se invoca si argon2.verify() devuelve false.
 *   El orden de pasos garantiza esto estructuralmente: re-auth en step 2,
 *   Stripe en step 6. Un error temprano lanza excepción y sale del método
 *   antes de llegar al gateway.
 *
 * Secuencia de pasos:
 *   1. Recuperar el hash de contraseña del admin desde la BD.
 *   2. argon2.verify(hash, currentPassword) → ReauthFailedError si falla.
 *   3. Buscar el pedido por ID → OrderNotFoundAdminError si no existe.
 *   4. amount ≤ totalPaid → RefundAmountExceedsTotalError si excede.
 *   5. Verificar que el pedido tiene stripePaymentIntentId → OrderNotRefundableError si es null.
 *   6. paymentGateway.refund() → envía solicitud a Stripe.
 *   7. auditLogRepository.write() → registra REFUND con motivo, monto y refundId.
 */
export class ManualRefundUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(
    orderId: string,
    dto: ManualRefundDTO,
    context: AdminAuditContext,
  ): Promise<RefundResultDTO> {
    // ─────────────────────────────────────────────────────────
    // STEP 1: Obtener el hash del admin para la re-autenticación
    // ─────────────────────────────────────────────────────────
    const admin = await this.userRepository.findById(context.adminId);
    if (!admin) {
      // Caso anómalo: el JWT era válido pero el usuario ya no existe en la BD.
      throw new ReauthFailedError();
    }

    // ─────────────────────────────────────────────────────────
    // STEP 2: RE-AUTENTICACIÓN — Argon2 verify
    // SI FALLA: lanza ReauthFailedError (HTTP 401) y sale AQUÍ.
    // Stripe NUNCA es invocado.
    // ─────────────────────────────────────────────────────────
    const passwordCorrect = await argon2.verify(admin.passwordHash, dto.currentPassword);
    if (!passwordCorrect) {
      throw new ReauthFailedError();
    }

    // ─────────────────────────────────────────────────────────
    // STEP 3: Verificar que el pedido existe
    // ─────────────────────────────────────────────────────────
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new OrderNotFoundAdminError(orderId);
    }

    // ─────────────────────────────────────────────────────────
    // STEP 4: Validación lógica — monto ≤ totalPaid
    // ─────────────────────────────────────────────────────────
    if (dto.amount <= 0 || dto.amount > order.totalPaid) {
      throw new RefundAmountExceedsTotalError(dto.amount, order.totalPaid);
    }

    // ─────────────────────────────────────────────────────────
    // STEP 5: El pedido debe tener un PaymentIntent de Stripe
    // ─────────────────────────────────────────────────────────
    if (!order.stripePaymentIntentId) {
      throw new OrderNotRefundableError(
        'el pedido no tiene un ID de pago de Stripe asociado ' +
        `(estado: ${order.status}).`
      );
    }
    if (order.status === 'PAYMENT_PENDING') {
      throw new OrderNotRefundableError(
        'el pedido está en estado PAYMENT_PENDING — el cobro aún no fue confirmado.'
      );
    }

    // ─────────────────────────────────────────────────────────
    // STEP 6: Ejecutar el reembolso en Stripe
    // Solo se llega aquí si TODOS los checks anteriores pasaron.
    // ─────────────────────────────────────────────────────────
    let refundId: string;
    try {
      const result = await this.paymentGateway.refund(
        order.stripePaymentIntentId,
        dto.amount,
      );
      refundId = result.refundId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido del gateway.';
      throw new RefundGatewayError(msg);
    }

    // ─────────────────────────────────────────────────────────
    // STEP 7: Registrar en audit_logs (inmutable por trigger SQL)
    // ─────────────────────────────────────────────────────────
    await this.auditLogRepository.write({
      adminId:    context.adminId,
      adminEmail: context.adminEmail,
      action:     'REFUND',
      entityType: 'orders',
      entityId:   orderId,
      oldValue: {
        status:    order.status,
        totalPaid: order.totalPaid,
      },
      newValue: {
        refundId,
        refundedAmount: dto.amount,
        reason:         dto.reason,
        stripePaymentIntentId: order.stripePaymentIntentId,
      },
      ipAddress: context.ip,
    });

    return {
      orderId,
      refundId,
      amount: dto.amount,
      reason: dto.reason,
    };
  }
}
