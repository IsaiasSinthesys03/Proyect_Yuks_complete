import { FastifyRequest, FastifyReply } from 'fastify';
import {
  GetDashboardSummaryUseCase,
  GetSalesOverTimeUseCase,
  GetTopProductsAnalyticsUseCase,
} from '../../../application/use_cases/admin/analytics/AnalyticsUseCases';

/** Controlador de dashboards de Analytics del CMS (Fase 30). */
export class AdminAnalyticsController {
  constructor(
    private readonly getSummary: GetDashboardSummaryUseCase,
    private readonly getSalesOverTime: GetSalesOverTimeUseCase,
    private readonly getTopProducts: GetTopProductsAnalyticsUseCase,
  ) {}

  /** GET /api/admin/analytics/summary?start=YYYY-MM-DD&end=YYYY-MM-DD */
  async summary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const q = request.query as { start?: string; end?: string };
      const parseDate = (v?: string): Date | undefined => {
        if (!v) return undefined;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? undefined : d;
      };
      const data = await this.getSummary.execute({ start: parseDate(q.start), end: parseDate(q.end) });
      reply.status(200).send({ success: true, data });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** GET /api/admin/analytics/sales-over-time?days=30 */
  async salesOverTime(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const q = request.query as { days?: string };
      const days = q.days ? parseInt(q.days, 10) : undefined;
      const data = await this.getSalesOverTime.execute(Number.isNaN(days as number) ? undefined : days);
      reply.status(200).send({ success: true, data });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** GET /api/admin/analytics/top-products?limit=10 */
  async topProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const q = request.query as { limit?: string };
      const limit = q.limit ? parseInt(q.limit, 10) : undefined;
      const data = await this.getTopProducts.execute(Number.isNaN(limit as number) ? undefined : limit);
      reply.status(200).send({ success: true, data });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    console.error('[AdminAnalyticsController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
