/**
 * Tipos del módulo de Reportes (CMS-BE-05, Fase 31).
 */

/** Tipos de reporte soportados (Fase 35: + inventory, audit). */
export type ReportType = 'sales' | 'orders' | 'donations' | 'users' | 'inventory' | 'audit';

export const REPORT_TYPES: ReportType[] = ['sales', 'orders', 'donations', 'users', 'inventory', 'audit'];

/** Formato de salida del reporte (Fase 35: + JSON). */
export type ReportFormat = 'csv' | 'json';
export const REPORT_FORMATS: ReportFormat[] = ['csv', 'json'];

/** Filtro de rango de fechas para las filas del reporte. */
export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
}

/** Respuesta inmediata al encolar un reporte: el admin recibe el jobId para seguimiento. */
export interface EnqueueReportResultDTO {
  jobId: string;
  reportType: ReportType;
  format: ReportFormat;
  status: 'queued';
}
