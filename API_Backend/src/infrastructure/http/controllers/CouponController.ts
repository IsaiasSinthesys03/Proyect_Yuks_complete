import { FastifyRequest, FastifyReply } from 'fastify';
import { RedeemCouponUseCase } from '../../../application/use_cases/coupons/RedeemCouponUseCase';
import { GetAvailableCouponsUseCase } from '../../../application/use_cases/coupons/GetAvailableCouponsUseCase';
import { RedeemCouponRequestDTO } from '../../../domain/types/CouponDTOs';
import {
  CouponNotFoundError,
  CouponExpiredError,
  CouponExhaustedError,
  CouponInactiveError,
  CouponMinNotMetError,
} from '../../../domain/errors/CouponErrors';

/**
 * Controlador HTTP de Cupones (CMS-FE-15, REQ-FE-21).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 */
export class CouponController {
  constructor(
    private readonly redeemCouponUseCase: RedeemCouponUseCase,
    private readonly getAvailableCouponsUseCase: GetAvailableCouponsUseCase,
  ) {}

  /**
   * GET /api/profile/coupons
   * Cupones promocionales VIGENTES (Fase 44, REQ-FE-21) para las tarjetas
   * con cuenta regresiva del perfil.
   */
  async listAvailable(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const coupons = await this.getAvailableCouponsUseCase.execute();
      return reply.status(200).send({
        statusCode: 200,
        message: 'Cupones vigentes obtenidos exitosamente.',
        data: coupons,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** POST /api/profile/coupons/redeem */
  async redeem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as RedeemCouponRequestDTO;

      const result = await this.redeemCouponUseCase.execute(dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Cupón validado exitosamente.',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof CouponNotFoundError) {
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

    if (error instanceof CouponMinNotMetError) {
      reply.status(422).send({ statusCode: 422, error: 'Unprocessable Entity', message: error.message });
      return;
    }

    console.error('❌ Error inesperado en CouponController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
