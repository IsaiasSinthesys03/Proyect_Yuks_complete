import { REPORT_TYPES } from '../types/ReportDTOs';

/** 400 — Tipo de reporte no soportado. */
export class InvalidReportTypeError extends Error {
  constructor(received: string) {
    super(`Tipo de reporte inválido: "${received}". Válidos: ${REPORT_TYPES.join(', ')}.`);
    this.name = 'InvalidReportTypeError';
  }
}

/** 404 — El archivo del reporte no existe (aún no generado o jobId inválido). */
export class ReportNotReadyError extends Error {
  constructor() {
    super('El reporte no está disponible. Puede estar generándose todavía o el identificador es inválido.');
    this.name = 'ReportNotReadyError';
  }
}
