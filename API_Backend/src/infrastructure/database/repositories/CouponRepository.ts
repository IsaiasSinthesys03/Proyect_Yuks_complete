import { db } from '../client';
import { sql } from 'kysely';
import { ICouponRepository } from '../../../application/interfaces/ICouponRepository';
import { Coupon, CouponDiscountType } from '../../../domain/entities/Coupon';
import { CreateCouponDTO, UpdateCouponDTO } from '../../../domain/types/AdminCouponDTOs';
import { AdminAuditContext } from '../../../domain/types/AdminTypes';
import { withAdminAuditContext } from '../withAdminAuditContext';

/**
 * Implementación concreta de ICouponRepository usando Kysely.
 *
 * Q23 (patrón análogo): búsqueda case-insensitive vía UPPER(code).
 */
export class CouponRepository implements ICouponRepository {
  async findByCode(code: string): Promise<Coupon | null> {
    const normalizedCode = code.toUpperCase().trim();

    const row = await db
      .selectFrom('coupons')
      .selectAll()
      .where(sql<boolean>`UPPER(code) = ${normalizedCode}`)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToCoupon(row);
  }

  async incrementUsage(couponId: string): Promise<boolean> {
    // VULN-01: UPDATE atómico condicional. La cláusula `current_uses < max_uses`
    // se evalúa dentro del mismo statement, por lo que dos requests concurrentes
    // sobre un cupón de max_uses=1 NUNCA pueden incrementar ambos: solo uno verá
    // numUpdatedRows > 0; el otro obtendrá 0 y deberá abortar.
    const result = await db
      .updateTable('coupons')
      .set((eb) => ({ current_uses: eb('current_uses', '+', 1) }))
      .where('id', '=', couponId)
      .where(sql<boolean>`current_uses < max_uses`)
      .executeTakeFirst();

    return result.numUpdatedRows > 0n;
  }

  // ==========================================
  // Métodos CMS (Fase 24)
  // ==========================================

  async findAllCoupons(): Promise<Coupon[]> {
    const rows = await db
      .selectFrom('coupons')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    return rows.map((row) => this.mapRowToCoupon(row));
  }

  async findCouponById(id: string): Promise<Coupon | null> {
    const row = await db
      .selectFrom('coupons')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToCoupon(row);
  }

  async createCoupon(data: CreateCouponDTO, context: AdminAuditContext): Promise<Coupon> {
    const row = await withAdminAuditContext(context, (trx) => trx
      .insertInto('coupons')
      .values({
        code: data.code.toUpperCase().trim(),
        discount_type: data.discountType,
        discount_value: data.discountValue.toString(),
        max_uses: data.maxUses,
        expires_at: new Date(data.expiresAt),
        min_purchase_amount: data.minPurchaseAmount != null
          ? data.minPurchaseAmount.toString()
          : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow());

    return this.mapRowToCoupon(row);
  }

  async updateCoupon(id: string, data: UpdateCouponDTO, context: AdminAuditContext): Promise<Coupon | null> {
    const updates: Record<string, unknown> = {};

    if (data.code       !== undefined) updates['code']         = data.code.toUpperCase().trim();
    if (data.discountType  !== undefined) updates['discount_type'] = data.discountType;
    if (data.discountValue !== undefined) updates['discount_value'] = data.discountValue.toString();
    if (data.maxUses    !== undefined) updates['max_uses']     = data.maxUses;
    if (data.expiresAt  !== undefined) updates['expires_at']   = new Date(data.expiresAt);
    if (data.minPurchaseAmount !== undefined) {
      updates['min_purchase_amount'] = data.minPurchaseAmount != null
        ? data.minPurchaseAmount.toString()
        : null;
    }

    if (Object.keys(updates).length === 0) {
      return this.findCouponById(id);
    }

    const row = await withAdminAuditContext(context, (trx) => trx
      .updateTable('coupons')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst());

    if (!row) return null;
    return this.mapRowToCoupon(row);
  }

  async toggleActive(id: string, context: AdminAuditContext): Promise<Coupon | null> {
    const row = await withAdminAuditContext(context, (trx) => trx
      .updateTable('coupons')
      .set((eb) => ({ is_active: eb.not(eb.ref('is_active')) }))
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst());

    if (!row) return null;
    return this.mapRowToCoupon(row);
  }

  // --- Helpers privados ---

  private mapRowToCoupon(row: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: string;
    max_uses: number;
    current_uses: number;
    expires_at: Date;
    is_active: boolean;
    min_purchase_amount: string | null;
    created_at: Date;
  }): Coupon {
    return {
      id: row.id,
      code: row.code,
      discountType: row.discount_type as CouponDiscountType,
      discountValue: parseFloat(row.discount_value),
      maxUses: row.max_uses,
      currentUses: row.current_uses,
      expiresAt: row.expires_at,
      isActive: row.is_active,
      minPurchaseAmount: row.min_purchase_amount !== null ? parseFloat(row.min_purchase_amount) : null,
      createdAt: row.created_at,
    };
  }
}
