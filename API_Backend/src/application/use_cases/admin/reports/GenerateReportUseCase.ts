import * as crypto from 'crypto';
import { IQueueService } from '../../../interfaces/IQueueService';
import {
  ReportType,
  ReportFormat,
  REPORT_TYPES,
  REPORT_FORMATS,
  EnqueueReportResultDTO,
} from '../../../../domain/types/ReportDTOs';
import { InvalidReportTypeError } from '../../../../domain/errors/ReportErrors';

export interface GenerateReportParams {
  reportType: string;
  format?: string;
  startDate?: string;
  endDate?: string;
  requestedByEmail: string;
}

/**
 * Caso de Uso: Encolar la generación de un reporte (CMS-BE-05, Fase 31 + Fase 35).
 *
 * ▓ NO BLOQUEANTE ▓ Valida tipo y formato, crea un jobId propio (uuid, usado para
 * nombrar el archivo y como id de descarga) y encola `report:generate`. Devuelve
 * el jobId de inmediato — el hilo HTTP jamás recorre filas ni construye el archivo.
 * Soporta formato CSV/JSON y filtro por rango de fechas.
 */
export class GenerateReportUseCase {
  constructor(private readonly queueService: IQueueService) {}

  async execute(params: GenerateReportParams): Promise<EnqueueReportResultDTO> {
    if (!REPORT_TYPES.includes(params.reportType as ReportType)) {
      throw new InvalidReportTypeError(params.reportType);
    }
    const format: ReportFormat = REPORT_FORMATS.includes(params.format as ReportFormat)
      ? (params.format as ReportFormat)
      : 'csv';

    const jobId = crypto.randomUUID();

    await this.queueService.enqueue('report:generate', {
      jobId,
      reportType: params.reportType,
      format,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      requestedByEmail: params.requestedByEmail,
    });

    return { jobId, reportType: params.reportType as ReportType, format, status: 'queued' };
  }
}
