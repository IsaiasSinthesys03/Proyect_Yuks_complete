/**
 * DTOs del módulo de Analytics del CMS (Fase 30).
 */

/** Resumen ejecutivo del dashboard principal. */
export interface DashboardSummaryDTO {
  totalRevenue: number;          // SUM(total_paid) de pedidos vendidos
  grossSales: number;            // SUM(subtotal - descuento) de pedidos vendidos
  totalOrders: number;           // conteo total de pedidos (todos los estados)
  soldOrders: number;            // pedidos en estados que representan venta real
  averageOrderValue: number;     // totalRevenue / soldOrders
  ordersByStatus: Record<string, number>;
  totalClients: number;          // usuarios con rol CLIENT
  completedDonations: number;    // conteo de donaciones COMPLETED
  donationsAmount: number;       // SUM(amount) de donaciones COMPLETED
}

/** Punto de la serie temporal de ventas. */
export interface SalesOverTimePointDTO {
  date: string;    // YYYY-MM-DD
  revenue: number;
  orders: number;
}

/** Fila del ranking de productos más vendidos (analytics). */
export interface TopProductAnalyticsDTO {
  productName: string;
  variantSku: string;
  unitsSold: number;
  revenue: number;
}
