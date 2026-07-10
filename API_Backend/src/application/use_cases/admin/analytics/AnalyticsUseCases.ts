import { IAnalyticsRepository, DateRangeFilter } from '../../../interfaces/IAnalyticsRepository';
import {
  DashboardSummaryDTO,
  SalesOverTimePointDTO,
  TopProductAnalyticsDTO,
} from '../../../../domain/types/AnalyticsDTOs';

/** Casos de uso de Analytics del CMS (Fase 30 + rango de fechas Fase 35). */

export class GetDashboardSummaryUseCase {
  constructor(private readonly repo: IAnalyticsRepository) {}
  execute(range?: DateRangeFilter): Promise<DashboardSummaryDTO> {
    return this.repo.getDashboardSummary(range);
  }
}

export class GetSalesOverTimeUseCase {
  constructor(private readonly repo: IAnalyticsRepository) {}
  execute(days?: number): Promise<SalesOverTimePointDTO[]> {
    // Sanitizar: 1..365 días, por defecto 30.
    const sanitized = Math.min(Math.max(Math.floor(days ?? 30), 1), 365);
    return this.repo.getSalesOverTime(sanitized);
  }
}

export class GetTopProductsAnalyticsUseCase {
  constructor(private readonly repo: IAnalyticsRepository) {}
  execute(limit?: number): Promise<TopProductAnalyticsDTO[]> {
    const sanitized = Math.min(Math.max(Math.floor(limit ?? 10), 1), 50);
    return this.repo.getTopProducts(sanitized);
  }
}
