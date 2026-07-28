import { FastifyRequest, FastifyReply } from 'fastify';
import { ProcessCheckoutUseCase } from '../../../application/use_cases/checkout/ProcessCheckoutUseCase';
import { GetPublicCheckoutConfigUseCase } from '../../../application/use_cases/checkout/GetPublicCheckoutConfigUseCase';
import { CheckoutRequestDTO } from '../../../domain/types/CheckoutDTOs';
import {
  IdempotencyConflictError,
  StockLockFailedError,
  OutOfStockError,
  MinPurchaseNotMetError,
  PaymentFailedError,
  AddressNotFoundError,
  ShippingDestinationUnavailableError,
} from '../../../domain/errors/CheckoutErrors';
import {
  CouponNotFoundError,
  CouponExpiredError,
  CouponExhaustedError,
  CouponInactiveError,
  CouponMinNotMetError,
} from '../../../domain/errors/CouponErrors';
import { InsufficientFundsError, WalletExpiredError } from '../../../domain/errors/WalletErrors';

/**
 * Controlador HTTP del Motor de Checkout (REQ-BE-01).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 */
export class CheckoutController {
  constructor(
    private readonly processCheckoutUseCase: ProcessCheckoutUseCase,
    private readonly getPublicCheckoutConfigUseCase: GetPublicCheckoutConfigUseCase,
  ) {}

  /**
   * GET /api/checkout/config (público)
   * Config dinámica para la UI del carrito: umbral de envío gratis, costos y
   * multiplicadores por tier (Fase 42, REQ-FE-13). Sin datos sensibles.
   */
  async getConfig(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const config = await this.getPublicCheckoutConfigUseCase.execute();
      return reply.status(200).send({
        statusCode: 200,
        message: 'Configuración de checkout obtenida exitosamente.',
        data: config,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** POST /api/checkout */
  async processCheckout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;

      if (!idempotencyKey) {
        reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'El header "X-Idempotency-Key" es obligatorio.',
        });
        return;
      }

      const dto = request.body as CheckoutRequestDTO;
      const clientIp = request.ip;

      const result = await this.processCheckoutUseCase.execute(userId, idempotencyKey, clientIp, dto);

      return reply.status(201).send({
        statusCode: 201,
        message: 'Checkout procesado exitosamente.',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** POST /api/checkout/coverage — preflight sin reservar stock ni idempotencia. */
  async checkCoverage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { addressId } = request.body as { addressId?: string };
      if (!addressId) {
        return void reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'addressId es obligatorio.' });
      }
      const result = await this.processCheckoutUseCase.checkShippingCoverage(request.user!.sub, addressId);
      return void reply.status(200).send({
        statusCode: 200,
        message: 'El domicilio se encuentra dentro de la cobertura.',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (
      error instanceof IdempotencyConflictError ||
      error instanceof StockLockFailedError ||
      error instanceof OutOfStockError
    ) {
      reply.status(409).send({ statusCode: 409, error: 'Conflict', message: error.message });
      return;
    }

    if (error instanceof AddressNotFoundError || error instanceof CouponNotFoundError) {
      reply.status(404).send({ statusCode: 404, error: 'Not Found', message: error.message });
      return;
    }

    if (
      error instanceof CouponExpiredError ||
      error instanceof CouponExhaustedError ||
      error instanceof CouponInactiveError
    ) {
      reply.status(410).send({ statusCode: 410, error: 'Gone', message: error.message });
      return;
    }

    if (
      error instanceof MinPurchaseNotMetError ||
      error instanceof CouponMinNotMetError ||
      error instanceof InsufficientFundsError ||
      error instanceof WalletExpiredError
    ) {
      reply.status(422).send({ statusCode: 422, error: 'Unprocessable Entity', message: error.message });
      return;
    }

    if (error instanceof ShippingDestinationUnavailableError) {
      reply.status(422).send({
        statusCode: 422,
        error: 'Shipping Destination Unavailable',
        code: 'SHIPPING_DESTINATION_UNAVAILABLE',
        reason: error.reason,
        message: error.message,
      });
      return;
    }

    if (error instanceof PaymentFailedError) {
      reply.status(402).send({ statusCode: 402, error: 'Payment Required', message: error.message });
      return;
    }

    console.error('❌ Error inesperado en CheckoutController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
