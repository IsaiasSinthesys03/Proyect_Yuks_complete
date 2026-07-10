import { FastifyRequest, FastifyReply } from 'fastify';
import { ManualRefundUseCase } from '../../../application/use_cases/admin/refunds/ManualRefundUseCase';
import {
  ReauthFailedError,
  RefundAmountExceedsTotalError,
  OrderNotRefundableError,
  RefundGatewayError,
} from '../../../domain/errors/RefundErrors';
import { OrderNotFoundAdminError } from '../../../domain/errors/OrderTransitionErrors';

/**
 * Controlador HTTP para reembolsos administrativos (Fase 25).
 *
 * Rutas:
 *   POST /api/admin/orders/:id/refund
 *
 * Cadena de seguridad:
 *   ipAllowlist → auth → admin → adminAuditContext → ManualRefundUseCase (Argon2 re-auth)
 *
 * Responsabilidades EXCLUSIVAS de esta clase:
 *   1. Extraer orderId del path param y el DTO del body.
 *   2. Pasar el adminContext (preparado por adminAuditContextMiddleware).
 *   3. Traducir errores de dominio a códigos HTTP.
 *
 * Sin lógica de negocio aquí.
 */
export class AdminRefundController {
  constructor(
    private readonly manualRefundUseCase: ManualRefundUseCase,
  ) {}

  async processRefund(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const context = request.adminContext!;
      const body = request.body as {
        amount: number;
        reason: string;
        currentPassword: string;
      };

      const result = await this.manualRefundUseCase.execute(id, body, context);
      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof ReauthFailedError) {
      return void reply.status(401).send({ success: false, error: (err as Error).message });
    }
    if (
      err instanceof RefundAmountExceedsTotalError ||
      err instanceof OrderNotRefundableError
    ) {
      return void reply.status(422).send({ success: false, error: (err as Error).message });
    }
    if (err instanceof OrderNotFoundAdminError) {
      return void reply.status(404).send({ success: false, error: (err as Error).message });
    }
    if (err instanceof RefundGatewayError) {
      return void reply.status(502).send({ success: false, error: (err as Error).message });
    }
    console.error('[AdminRefundController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
