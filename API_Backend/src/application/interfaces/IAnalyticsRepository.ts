import {
  DashboardSummaryDTO,
  SalesOverTimePointDTO,
  TopProductAnalyticsDTO,
} from '../../domain/types/AnalyticsDTOs';

/**
 * Puerto del repositorio de Analytics (Fase 30).
 *
 * Encapsula las consultas de agregación del CMS. Devuelve DTOs ya calculados —
 * los Use Cases no arman SQL ni conocen las columnas.
 */
/** Rango de fechas opcional para las métricas del dashboard (CMS-FE-02). */
export interface DateRangeFilter {
  start?: Date;
  end?: Date;
}

export interface IAnalyticsRepository {
  /** Resumen ejecutivo (ingresos, pedidos, usuarios, donaciones), opcionalmente acotado por fechas. */
  getDashboardSummary(range?: DateRangeFilter): Promise<DashboardSummaryDTO>;

  /** Serie temporal de ventas de los últimos `days` días. */
  getSalesOverTime(days: number): Promise<SalesOverTimePointDTO[]>;

  /** Ranking de productos más vendidos (por unidades). */
  getTopProducts(limit: number): Promise<TopProductAnalyticsDTO[]>;
}
