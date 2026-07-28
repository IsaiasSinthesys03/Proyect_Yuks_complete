import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateCouponUseCase } from '../../../application/use_cases/admin/coupons/CreateCouponUseCase';
import { UpdateCouponUseCase } from '../../../application/use_cases/admin/coupons/UpdateCouponUseCase';
import { ToggleCouponUseCase } from '../../../application/use_cases/admin/coupons/ToggleCouponUseCase';
import { ListCouponsUseCase, GetCouponByIdUseCase } from '../../../application/use_cases/admin/coupons/ReadCouponUseCases';
import {
  InvalidDiscountValueError,
  InvalidExpirationDateError,
  DuplicateCouponCodeError,
  CouponNotFoundAdminError,
} from '../../../domain/errors/CouponAdminErrors';

export class AdminCouponController {
  constructor(
    private readonly createCouponUseCase: CreateCouponUseCase,
    private readonly updateCouponUseCase: UpdateCouponUseCase,
    private readonly toggleCouponUseCase: ToggleCouponUseCase,
    private readonly listCouponsUseCase: ListCouponsUseCase,
    private readonly getCouponByIdUseCase: GetCouponByIdUseCase,
  ) {}

  /** GET /api/admin/coupons — lista todos los cupones. */
  async listCoupons(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const coupons = await this.listCouponsUseCase.execute();
      reply.status(200).send({ success: true, data: coupons });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** GET /api/admin/coupons/:id — detalle de un cupón. */
  async getCoupon(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const coupon = await this.getCouponByIdUseCase.execute(id);
      reply.status(200).send({ success: true, data: coupon });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async createCoupon(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = request.body as {
        code: string;
        discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
        discountValue: number;
        maxUses: number;
        expiresAt: string;
        minPurchaseAmount?: number | null;
      };
      const coupon = await this.createCouponUseCase.execute(body, request.adminContext!);
      reply.status(201).send({ success: true, data: coupon });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async updateCoupon(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        code?: string;
        discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
        discountValue?: number;
        maxUses?: number;
        expiresAt?: string;
        minPurchaseAmount?: number | null;
      };
      const coupon = await this.updateCouponUseCase.execute(id, body, request.adminContext!);
      reply.status(200).send({ success: true, data: coupon });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async toggleCoupon(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const coupon = await this.toggleCouponUseCase.execute(id, request.adminContext!);
      reply.status(200).send({ success: true, data: coupon });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof InvalidDiscountValueError || err instanceof InvalidExpirationDateError) {
      return void reply.status(400).send({ success: false, error: (err as Error).message });
    }
    if (err instanceof DuplicateCouponCodeError) {
      return void reply.status(409).send({ success: false, error: (err as Error).message });
    }
    if (err instanceof CouponNotFoundAdminError) {
      return void reply.status(404).send({ success: false, error: (err as Error).message });
    }
    console.error('[AdminCouponController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
