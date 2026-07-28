import { db } from '../client';
import { IDonationRepository } from '../../../application/interfaces/IDonationRepository';
import { Donation, DonationStatus } from '../../../domain/entities/Donation';
import {
  AdminDonationFilterDTO,
  DonationPaginatedResponseDTO,
  MyDonationsPaginatedResponseDTO,
} from '../../../domain/types/DonationDTOs';

export class DonationRepository implements IDonationRepository {
  async create(data: {
    stripePaymentIntentId: string;
    amount: number;
    donorEmail: string;
    idempotencyKey: string;
    userId?: string;
  }): Promise<Donation> {
    const row = await db
      .insertInto('donations')
      .values({
        stripe_payment_intent_id: data.stripePaymentIntentId,
        amount: data.amount.toString(),
        donor_email: data.donorEmail,
        idempotency_key: data.idempotencyKey,
        user_id: data.userId ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToDonation(row);
  }

  async findByIdempotencyKey(key: string): Promise<Donation | null> {
    const row = await db
      .selectFrom('donations')
      .selectAll()
      .where('idempotency_key', '=', key)
      .executeTakeFirst();

    return row ? this.mapRowToDonation(row) : null;
  }

  async findByStripePaymentIntentId(paymentIntentId: string): Promise<Donation | null> {
    const row = await db
      .selectFrom('donations')
      .selectAll()
      .where('stripe_payment_intent_id', '=', paymentIntentId)
      .executeTakeFirst();

    return row ? this.mapRowToDonation(row) : null;
  }

  async updateStatus(
    donationId: string,
    status: DonationStatus,
    stripeChargeId?: string
  ): Promise<Donation> {
    const row = await db
      .updateTable('donations')
      .set({
        status,
        ...(stripeChargeId !== undefined ? { stripe_charge_id: stripeChargeId } : {}),
      })
      .where('id', '=', donationId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToDonation(row);
  }

  async findAll(filter: AdminDonationFilterDTO): Promise<DonationPaginatedResponseDTO> {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    const countResult = await db
      .selectFrom('donations')
      .$if(!!filter.status, (qb) => qb.where('status', '=', filter.status!))
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();

    const rows = await db
      .selectFrom('donations')
      .selectAll()
      .$if(!!filter.status, (qb) => qb.where('status', '=', filter.status!))
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    const total = Number(countResult.total);

    return {
      data: rows.map((row) => ({
        id: row.id,
        amount: parseFloat(row.amount),
        donorEmail: row.donor_email,
        status: row.status as DonationStatus,
        stripePaymentIntentId: row.stripe_payment_intent_id,
        createdAt: row.created_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<MyDonationsPaginatedResponseDTO> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const countResult = await db
      .selectFrom('donations')
      .where('user_id', '=', userId)
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();

    const rows = await db
      .selectFrom('donations')
      .select(['id', 'amount', 'status', 'created_at'])
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(safeLimit)
      .offset(offset)
      .execute();

    const total = Number(countResult.total);
    return {
      data: rows.map((row) => ({
        id: row.id,
        amount: parseFloat(row.amount),
        status: row.status as DonationStatus,
        createdAt: row.created_at,
      })),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  private mapRowToDonation(row: {
    id: string;
    user_id: string | null;
    stripe_payment_intent_id: string | null;
    stripe_charge_id: string | null;
    amount: string;
    donor_email: string;
    status: string;
    idempotency_key: string;
    created_at: Date;
  }): Donation {
    return {
      id: row.id,
      userId: row.user_id,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      stripeChargeId: row.stripe_charge_id,
      amount: parseFloat(row.amount),
      donorEmail: row.donor_email,
      status: row.status as DonationStatus,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at,
    };
  }
}
