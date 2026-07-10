import { db } from '../client';
import { IReportRepository } from '../../../application/interfaces/IReportRepository';
import { ReportType, ReportFilter } from '../../../domain/types/ReportDTOs';

const SOLD_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERING', 'DELIVERED'];

/**
 * Repositorio de datos para reportes CSV/JSON (Fase 31 + Fase 35).
 * Cada consulta devuelve filas planas con nombres de columna legibles.
 */
export class ReportRepository implements IReportRepository {
  async getReportRows(reportType: ReportType, filter?: ReportFilter): Promise<Record<string, unknown>[]> {
    const f = filter ?? {};
    switch (reportType) {
      case 'sales':     return this.salesRows(f);
      case 'orders':    return this.ordersRows(f);
      case 'donations': return this.donationsRows(f);
      case 'users':     return this.usersRows(f);
      case 'inventory': return this.inventoryRows();
      case 'audit':     return this.auditRows(f);
      default:          return [];
    }
  }

  /** Aplica el rango de fechas (created_at) a una query si está presente. */
  private withRange(qb: any, filter: ReportFilter, column = 'created_at'): any {
    let q = qb;
    if (filter.startDate) q = q.where(column, '>=', filter.startDate);
    if (filter.endDate) q = q.where(column, '<=', filter.endDate);
    return q;
  }

  private async salesRows(filter: ReportFilter): Promise<Record<string, unknown>[]> {
    const rows = await this.withRange(
      db
        .selectFrom('orders')
        .select([
          'id', 'status', 'subtotal', 'discount_amount', 'shipping_cost',
          'wallet_deduction', 'total_paid', 'municipality', 'state', 'created_at',
        ])
        .where('status', 'in', SOLD_STATUSES),
      filter
    ).orderBy('created_at', 'desc').execute();

    return rows.map((r: any) => ({
      order_id: r.id,
      status: r.status,
      subtotal: r.subtotal,
      discount: r.discount_amount,
      shipping: r.shipping_cost,
      wallet_used: r.wallet_deduction,
      total_paid: r.total_paid,
      municipality: r.municipality,
      state: r.state,
      created_at: r.created_at,
    }));
  }

  private async ordersRows(filter: ReportFilter): Promise<Record<string, unknown>[]> {
    const rows = await this.withRange(
      db.selectFrom('orders').select(['id', 'user_id', 'status', 'total_paid', 'delivery_type', 'created_at']),
      filter
    ).orderBy('created_at', 'desc').execute();

    return rows.map((r: any) => ({
      order_id: r.id,
      user_id: r.user_id,
      status: r.status,
      total_paid: r.total_paid,
      delivery_type: r.delivery_type ?? '',
      created_at: r.created_at,
    }));
  }

  private async donationsRows(filter: ReportFilter): Promise<Record<string, unknown>[]> {
    const rows = await this.withRange(
      db.selectFrom('donations').select(['id', 'amount', 'donor_email', 'status', 'created_at']),
      filter
    ).orderBy('created_at', 'desc').execute();

    return rows.map((r: any) => ({
      donation_id: r.id,
      amount: r.amount,
      donor_email: r.donor_email,
      status: r.status,
      created_at: r.created_at,
    }));
  }

  private async usersRows(filter: ReportFilter): Promise<Record<string, unknown>[]> {
    const rows = await this.withRange(
      db
        .selectFrom('users')
        .innerJoin('profiles', 'profiles.user_id', 'users.id')
        .select([
          'users.id as id', 'users.email as email', 'users.role as role',
          'users.is_banned as is_banned', 'profiles.tier_level as tier_level',
          'profiles.experience_points as experience_points', 'users.created_at as created_at',
        ]),
      filter,
      'users.created_at'
    ).orderBy('users.created_at', 'desc').execute();

    return rows.map((r: any) => ({
      user_id: r.id,
      email: r.email,
      role: r.role,
      is_banned: r.is_banned,
      tier: r.tier_level,
      experience_points: r.experience_points,
      created_at: r.created_at,
    }));
  }

  /** Reporte de inventario (Fase 35): variantes con su stock. Sin rango (stock actual). */
  private async inventoryRows(): Promise<Record<string, unknown>[]> {
    const rows = await db
      .selectFrom('product_variants')
      .innerJoin('products', 'products.id', 'product_variants.product_id')
      .select([
        'products.name as product_name', 'product_variants.sku as sku',
        'product_variants.size as size', 'product_variants.color as color',
        'products.price as price', 'product_variants.stock as stock',
        'products.is_deleted as is_deleted',
      ])
      .orderBy('product_variants.stock', 'asc')
      .execute();

    return rows.map((r) => ({
      product_name: r.product_name,
      sku: r.sku,
      size: r.size ?? '',
      color: r.color ?? '',
      price: r.price,
      stock: r.stock,
      discontinued: r.is_deleted,
    }));
  }

  /** Reporte de auditoría (Fase 35): bitácora inmutable, acotable por fechas. */
  private async auditRows(filter: ReportFilter): Promise<Record<string, unknown>[]> {
    const rows = await this.withRange(
      db
        .selectFrom('audit_logs')
        .select(['admin_email', 'action', 'entity_type', 'entity_id', 'ip_address', 'created_at']),
      filter
    ).orderBy('created_at', 'desc').execute();

    return rows.map((r: any) => ({
      admin_email: r.admin_email,
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      ip_address: r.ip_address,
      created_at: r.created_at,
    }));
  }
}
