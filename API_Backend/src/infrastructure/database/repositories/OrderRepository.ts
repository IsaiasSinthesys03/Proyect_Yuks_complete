import { db } from '../client';
import { withAdminAuditContext } from '../withAdminAuditContext';
import { IOrderRepository } from '../../../application/interfaces/IOrderRepository';
import { Order, OrderStatus, DeliveryType } from '../../../domain/entities/Order';
import { OrderItem } from '../../../domain/entities/OrderItem';
import { RewardCode, RewardCodeStatus } from '../../../domain/entities/RewardCode';
import { OrderSummaryDTO, OrderDetailDTO } from '../../../domain/types/OrderDTOs';
import { AdminOrderSummaryDTO } from '../../../domain/types/AdminOrderDTOs';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';
import { AdminOrderFilterDTO } from '../../../domain/types/AdminOrderDTOs';
import { AdminAuditContext } from '../../../domain/types/AdminTypes';

const ACTIVE_STATUSES = ['PAYMENT_PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERING'] as const;
const COMPLETED_STATUSES = ['DELIVERED', 'CANCELLED'] as const;

/**
 * Implementación concreta de IOrderRepository usando Kysely.
 *
 * `createOrder` es atómico para order + order_items (db.transaction()).
 * Los demás pasos del checkout (decrementar stock, debitar monedero,
 * incrementar cupón, generar reward codes) viven en otros repositorios
 * y se orquestan desde `ProcessCheckoutUseCase` (ver nota de Saga en esa clase).
 */
export class OrderRepository implements IOrderRepository {
  async createOrder(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId'>[]
  ): Promise<Order> {
    return db.transaction().execute(async (trx) => {
      const orderRow = await trx
        .insertInto('orders')
        .values({
          user_id: orderData.userId,
          status: orderData.status,
          subtotal: orderData.subtotal.toString(),
          discount_amount: orderData.discountAmount.toString(),
          shipping_cost: orderData.shippingCost.toString(),
          wallet_deduction: orderData.walletDeduction.toString(),
          total_paid: orderData.totalPaid.toString(),
          delivery_type: orderData.deliveryType,
          shipping_address: orderData.shippingAddress,
          postal_code: orderData.postalCode,
          municipality: orderData.municipality,
          state: orderData.state,
          terms_version: orderData.termsVersion,
          client_ip: orderData.clientIp,
          idempotency_key: orderData.idempotencyKey,
          coupon_id: orderData.couponId,
          stripe_payment_intent_id: orderData.stripePaymentIntentId,
          driver_name: orderData.driverName,
          driver_vehicle: orderData.driverVehicle,
          driver_phone: orderData.driverPhone,
          tracking_company: orderData.trackingCompany,
          tracking_number: orderData.trackingNumber,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      if (items.length > 0) {
        await trx
          .insertInto('order_items')
          .values(
            items.map((item) => ({
              order_id: orderRow.id,
              variant_id: item.variantId,
              product_name: item.productName,
              variant_sku: item.variantSku,
              unit_price: item.unitPrice.toString(),
              quantity: item.quantity,
              has_virtual_reward: item.hasVirtualReward,
            }))
          )
          .execute();
      }

      return this.mapRowToOrder(orderRow);
    });
  }

  async findById(orderId: string, userId: string): Promise<Order | null> {
    const row = await db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', orderId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToOrder(row);
  }

  async findByUserId(
    userId: string,
    filter: 'active' | 'completed' | 'all',
    page: number,
    limit: number
  ): Promise<PaginatedResponseDTO<OrderSummaryDTO>> {
    const offset = (page - 1) * limit;
    const statuses =
      filter === 'active' ? ACTIVE_STATUSES : filter === 'completed' ? COMPLETED_STATUSES : null;

    let baseQuery = db.selectFrom('orders').where('user_id', '=', userId);
    if (statuses) {
      baseQuery = baseQuery.where('status', 'in', [...statuses]);
    }

    const countResult = await baseQuery
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();
    const total = Number(countResult.total);

    const orderRows = await baseQuery
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    const data: OrderSummaryDTO[] = [];
    for (const row of orderRows) {
      const extras = await this.getOrderSummaryExtras(row.id);
      data.push({
        id: row.id,
        status: row.status as OrderStatus,
        totalPaid: parseFloat(row.total_paid),
        itemCount: extras.itemCount,
        createdAt: row.created_at,
        productThumbnail: extras.productThumbnail,
      });
    }

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findDetailById(orderId: string, userId: string): Promise<OrderDetailDTO | null> {
    const orderRow = await db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', orderId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!orderRow) return null;

    return this.buildOrderDetail(this.mapRowToOrder(orderRow));
  }

  async findDetailByOrderId(orderId: string): Promise<OrderDetailDTO | null> {
    const orderRow = await db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', orderId)
      .executeTakeFirst();

    if (!orderRow) return null;

    return this.buildOrderDetail(this.mapRowToOrder(orderRow));
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    extraData?: Partial<
      Pick<
        Order,
        | 'driverName'
        | 'driverVehicle'
        | 'driverPhone'
        | 'trackingCompany'
        | 'trackingNumber'
        | 'stripePaymentIntentId'
      >
    >,
    context?: AdminAuditContext
  ): Promise<Order> {
    const runUpdate = async (executor: Pick<typeof db, 'updateTable'>) => {
      const row = await executor
        .updateTable('orders')
        .set({
          status: newStatus,
          ...(extraData?.driverName !== undefined ? { driver_name: extraData.driverName } : {}),
          ...(extraData?.driverVehicle !== undefined ? { driver_vehicle: extraData.driverVehicle } : {}),
          ...(extraData?.driverPhone !== undefined ? { driver_phone: extraData.driverPhone } : {}),
          ...(extraData?.trackingCompany !== undefined ? { tracking_company: extraData.trackingCompany } : {}),
          ...(extraData?.trackingNumber !== undefined ? { tracking_number: extraData.trackingNumber } : {}),
          ...(extraData?.stripePaymentIntentId !== undefined
            ? { stripe_payment_intent_id: extraData.stripePaymentIntentId }
            : {}),
          updated_at: new Date(),
        })
        .where('id', '=', orderId)
        .returningAll()
        .executeTakeFirstOrThrow();
      return this.mapRowToOrder(row);
    };

    if (context) {
      return withAdminAuditContext(context, (trx) => runUpdate(trx as unknown as typeof db));
    }
    return runUpdate(db);
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const row = await db
      .selectFrom('orders')
      .selectAll()
      .where('idempotency_key', '=', key)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToOrder(row);
  }

  async findByStripePaymentIntentId(paymentIntentId: string): Promise<Order | null> {
    const row = await db
      .selectFrom('orders')
      .selectAll()
      .where('stripe_payment_intent_id', '=', paymentIntentId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToOrder(row);
  }

  async findItemById(orderItemId: string): Promise<OrderItem | null> {
    const row = await db
      .selectFrom('order_items')
      .selectAll()
      .where('id', '=', orderItemId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToOrderItem(row);
  }

  // ==========================================
  // Métodos CMS (Fase 24)
  // ==========================================

  async findOrderById(orderId: string): Promise<Order | null> {
    const row = await db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', orderId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToOrder(row);
  }

  async findAllAdmin(filters: AdminOrderFilterDTO): Promise<PaginatedResponseDTO<AdminOrderSummaryDTO>> {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    // Fase 49 (Kanban logístico): JOIN a profiles para nombre/teléfono del
    // cliente + snapshot de entrega de la orden — el operador despacha sin
    // abrir cada pedido.
    let baseQuery = db
      .selectFrom('orders')
      .leftJoin('profiles', 'profiles.user_id', 'orders.user_id')
      .selectAll('orders')
      .select(['profiles.first_name', 'profiles.last_name', 'profiles.phone']);
    if (filters.status) {
      baseQuery = baseQuery.where('orders.status', '=', filters.status);
    }
    if (filters.userId) {
      baseQuery = baseQuery.where('orders.user_id', '=', filters.userId);
    }

    const countResult = await db
      .selectFrom('orders')
      .$if(!!filters.status,  (qb) => qb.where('status',  '=', filters.status!))
      .$if(!!filters.userId,  (qb) => qb.where('user_id', '=', filters.userId!))
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();

    const total = Number(countResult.total);

    const orderRows = await baseQuery
      .orderBy('orders.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    const data: AdminOrderSummaryDTO[] = [];
    for (const row of orderRows) {
      const extras = await this.getOrderSummaryExtras(row.id);
      data.push({
        id: row.id,
        status: row.status as OrderStatus,
        totalPaid: parseFloat(row.total_paid),
        itemCount: extras.itemCount,
        createdAt: row.created_at,
        deliveryType: row.delivery_type,
        shippingAddress: row.shipping_address,
        postalCode: row.postal_code,
        municipality: row.municipality,
        state: row.state,
        clientName: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Cliente',
        clientPhone: row.phone,
      });
    }

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // --- Helpers privados ---

  private async buildOrderDetail(order: Order): Promise<OrderDetailDTO> {
    const itemRows = await db
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', order.id)
      .execute();

    const rewardCodeRows = await db
      .selectFrom('reward_codes')
      .selectAll()
      .where('order_id', '=', order.id)
      .execute();

    return {
      order,
      items: itemRows.map((row) => this.mapRowToOrderItem(row)),
      rewardCodes: rewardCodeRows.map((row) => this.mapRowToRewardCode(row)),
    };
  }

  private async getOrderSummaryExtras(
    orderId: string
  ): Promise<{ itemCount: number; productThumbnail: string | null }> {
    const countResult = await db
      .selectFrom('order_items')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .where('order_id', '=', orderId)
      .executeTakeFirstOrThrow();

    const firstItem = await db
      .selectFrom('order_items')
      .innerJoin('product_variants', 'product_variants.id', 'order_items.variant_id')
      .innerJoin('products', 'products.id', 'product_variants.product_id')
      .select(['products.image_url'])
      .where('order_items.order_id', '=', orderId)
      .orderBy('order_items.created_at', 'asc')
      .executeTakeFirst();

    return {
      itemCount: Number(countResult.total),
      productThumbnail: firstItem?.image_url ?? null,
    };
  }

  private mapRowToOrder(row: {
    id: string;
    user_id: string;
    status: string;
    subtotal: string;
    discount_amount: string;
    shipping_cost: string;
    wallet_deduction: string;
    total_paid: string;
    delivery_type: string | null;
    shipping_address: string;
    postal_code: string;
    municipality: string;
    state: string;
    terms_version: string;
    client_ip: string;
    idempotency_key: string;
    coupon_id: string | null;
    stripe_payment_intent_id: string | null;
    driver_name: string | null;
    driver_vehicle: string | null;
    driver_phone: string | null;
    tracking_company: string | null;
    tracking_number: string | null;
    created_at: Date;
    updated_at: Date;
  }): Order {
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status as OrderStatus,
      subtotal: parseFloat(row.subtotal),
      discountAmount: parseFloat(row.discount_amount),
      shippingCost: parseFloat(row.shipping_cost),
      walletDeduction: parseFloat(row.wallet_deduction),
      totalPaid: parseFloat(row.total_paid),
      deliveryType: row.delivery_type as DeliveryType | null,
      shippingAddress: row.shipping_address,
      postalCode: row.postal_code,
      municipality: row.municipality,
      state: row.state,
      termsVersion: row.terms_version,
      clientIp: row.client_ip,
      idempotencyKey: row.idempotency_key,
      couponId: row.coupon_id,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      driverName: row.driver_name,
      driverVehicle: row.driver_vehicle,
      driverPhone: row.driver_phone,
      trackingCompany: row.tracking_company,
      trackingNumber: row.tracking_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToOrderItem(row: {
    id: string;
    order_id: string;
    variant_id: string;
    product_name: string;
    variant_sku: string;
    unit_price: string;
    quantity: number;
    has_virtual_reward: boolean;
  }): OrderItem {
    return {
      id: row.id,
      orderId: row.order_id,
      variantId: row.variant_id,
      productName: row.product_name,
      variantSku: row.variant_sku,
      unitPrice: parseFloat(row.unit_price),
      quantity: row.quantity,
      hasVirtualReward: row.has_virtual_reward,
    };
  }

  private mapRowToRewardCode(row: {
    id: string;
    order_id: string;
    order_item_id: string;
    code: string;
    status: string;
    claimed_at: Date | null;
    revoked_at: Date | null;
    created_at: Date;
  }): RewardCode {
    return {
      id: row.id,
      orderId: row.order_id,
      orderItemId: row.order_item_id,
      code: row.code,
      status: row.status as RewardCodeStatus,
      claimedAt: row.claimed_at,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
    };
  }
}
