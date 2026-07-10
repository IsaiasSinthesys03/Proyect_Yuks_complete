import { promises as fs } from 'fs';
import { IReportRepository } from '../../../application/interfaces/IReportRepository';
import { ReportType, ReportFormat, ReportFilter } from '../../../domain/types/ReportDTOs';
import { buildCsv } from './csvBuilder';
import { getReportsDir, reportFilePath } from './reportPaths';

export interface ReportGenerationResult {
  jobId: string;
  reportType: ReportType;
  format: ReportFormat;
  filePath: string;
  rowCount: number;
}

/**
 * Servicio que materializa un reporte (CSV o JSON) en disco (Fase 31 + Fase 35).
 *
 * Lo usa el `reports.worker` (proceso separado). Se extrae del worker para ser
 * testeable de forma directa: dado un tipo, formato, jobId y rango de fechas,
 * consulta las filas, serializa y escribe el archivo. No conoce colas ni WebSockets.
 */
export class ReportGenerationService {
  constructor(private readonly reportRepository: IReportRepository) {}

  async generate(
    reportType: ReportType,
    jobId: string,
    format: ReportFormat = 'csv',
    filter?: ReportFilter,
  ): Promise<ReportGenerationResult> {
    const rows = await this.reportRepository.getReportRows(reportType, filter);

    const content = format === 'json' ? JSON.stringify(rows, null, 2) : buildCsv(rows);

    await fs.mkdir(getReportsDir(), { recursive: true });
    const filePath = reportFilePath(jobId, format);
    await fs.writeFile(filePath, content, 'utf8');

    return { jobId, reportType, format, filePath, rowCount: rows.length };
  }
}
