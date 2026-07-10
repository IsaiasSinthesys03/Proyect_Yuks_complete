import { db } from '../client';
import { sql } from 'kysely';
import { IAnalyticsRepository, DateRangeFilter } from '../../../application/interfaces/IAnalyticsRepository';
import {
  DashboardSummaryDTO,
  SalesOverTimePointDTO,
  TopProductAnalyticsDTO,
} from '../../../domain/types/AnalyticsDTOs';

/**
 * Estados de pedido que cuentan como VENTA REAL para métricas de ingresos.
 * Se excluyen PAYMENT_PENDING (sin confirmar), CANCELLED y NEEDS_RECONCILIATION.
 */
const SOLD_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERING', 'DELIVERED'];

export class AnalyticsRepository implements IAnalyticsRepository {
  async getDashboardSummary(range?: DateRangeFilter): Promise<DashboardSummaryDTO> {
    const hasStart = !!range?.start;
    const hasEnd = !!range?.end;

    // Ingresos y conteo de pedidos vendidos (acotado por fechas con `.$if`, que
    // preserva el tipado de Kysely — sin `any`).
    const soldAgg = await db
      .selectFrom('orders')
      .select((eb) => [
        eb.fn.sum<string>('total_paid').as('revenue'),
        sql<string>`COALESCE(SUM(subtotal - discount_amount), 0)`.as('gross'),
        eb.fn.countAll<number>().as('orders'),
      ])
      .where('status', 'in', SOLD_STATUSES)
      .$if(hasStart, (qb) => qb.where('created_at', '>=', range!.start!))
      .$if(hasEnd, (qb) => qb.where('created_at', '<=', range!.end!))
      .executeTakeFirst();

    const totalRevenue = soldAgg?.revenue ? parseFloat(soldAgg.revenue) : 0;
    const grossSales = soldAgg?.gross ? parseFloat(soldAgg.gross) : 0;
    const soldOrders = soldAgg?.orders ? Number(soldAgg.orders) : 0;

    // Conteo total y desglose por estado (acotado por fechas si se pide).
    const statusRows = await db
      .selectFrom('orders')
      .select((eb) => ['status', eb.fn.countAll<number>().as('count')])
      .$if(hasStart, (qb) => qb.where('created_at', '>=', range!.start!))
      .$if(hasEnd, (qb) => qb.where('created_at', '<=', range!.end!))
      .groupBy('status')
      .execute();

    const ordersByStatus: Record<string, number> = {};
    let totalOrders = 0;
    for (const row of statusRows) {
      const count = Number(row.count);
      ordersByStatus[row.status] = count;
      totalOrders += count;
    }

    // Usuarios CLIENT (métrica de CRM total, siempre all-time — no depende del rango).
    const clientsRow = await db
      .selectFrom('users')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('role', '=', 'CLIENT')
      .executeTakeFirst();
    const totalClients = clientsRow ? Number(clientsRow.count) : 0;

    // Donaciones COMPLETED (acotado por fechas si se pide).
    const donationsAgg = await db
      .selectFrom('donations')
      .select((eb) => [eb.fn.sum<string>('amount').as('amount'), eb.fn.countAll<number>().as('count')])
      .where('status', '=', 'COMPLETED')
      .$if(hasStart, (qb) => qb.where('created_at', '>=', range!.start!))
      .$if(hasEnd, (qb) => qb.where('created_at', '<=', range!.end!))
      .executeTakeFirst();
    const donationsAmount = donationsAgg?.amount ? parseFloat(donationsAgg.amount) : 0;
    const completedDonations = donationsAgg?.count ? Number(donationsAgg.count) : 0;

    return {
      totalRevenue,
      grossSales,
      totalOrders,
      soldOrders,
      averageOrderValue: soldOrders > 0 ? Math.round((totalRevenue / soldOrders) * 100) / 100 : 0,
      ordersByStatus,
      totalClients,
      completedDonations,
      donationsAmount,
    };
  }

  async getSalesOverTime(days: number): Promise<SalesOverTimePointDTO[]> {
    const since = new Date(Date.now() - days * 86400 * 1000);

    const rows = await db
      .selectFrom('orders')
      .select((eb) => [
        sql<string>`DATE(created_at)`.as('date'),
        eb.fn.sum<string>('total_paid').as('revenue'),
        eb.fn.countAll<number>().as('orders'),
      ])
      .where('status', 'in', SOLD_STATUSES)
      .where('created_at', '>=', since)
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`, 'asc')
      .execute();

    return rows.map((r) => ({
      // pg puede devolver DATE como Date o string según el driver; normalizamos.
      date: typeof r.date === 'string' ? r.date : new Date(r.date as unknown as string).toISOString().slice(0, 10),
      revenue: r.revenue ? parseFloat(r.revenue) : 0,
      orders: Number(r.orders),
    }));
  }

  async getTopProducts(limit: number): Promise<TopProductAnalyticsDTO[]> {
    const rows = await db
      .selectFrom('order_items')
      .innerJoin('orders', 'orders.id', 'order_items.order_id')
      .select([
        'order_items.product_name as productName',
        'order_items.variant_sku as variantSku',
        sql<string>`SUM(order_items.quantity)`.as('units'),
        sql<string>`SUM(order_items.unit_price * order_items.quantity)`.as('revenue'),
      ])
      .where('orders.status', 'in', SOLD_STATUSES)
      .groupBy(['order_items.product_name', 'order_items.variant_sku'])
      .orderBy(sql`SUM(order_items.quantity)`, 'desc')
      .limit(limit)
      .execute();

    return rows.map((r) => ({
      productName: r.productName,
      variantSku: r.variantSku,
      unitsSold: Number(r.units),
      revenue: r.revenue ? parseFloat(r.revenue) : 0,
    }));
  }
}
