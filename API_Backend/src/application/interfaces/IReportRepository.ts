import { ReportType, ReportFilter } from '../../domain/types/ReportDTOs';

/**
 * Puerto del repositorio de datos de Reportes (CMS-BE-05, Fase 31 + Fase 35).
 *
 * Devuelve filas planas (clave→valor) listas para volcarse a CSV/JSON. El worker
 * no conoce SQL; solo pide las filas de un tipo de reporte, opcionalmente acotadas
 * por un rango de fechas.
 */
export interface IReportRepository {
  getReportRows(reportType: ReportType, filter?: ReportFilter): Promise<Record<string, unknown>[]>;
}
