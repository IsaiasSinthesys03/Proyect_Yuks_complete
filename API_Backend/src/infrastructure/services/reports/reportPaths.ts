import * as path from 'path';

/**
 * Resolución centralizada de rutas de reportes (Fase 31).
 *
 * El worker (que escribe) y la API (que sirve la descarga) DEBEN resolver el
 * mismo directorio absoluto. Se controla con REPORTS_DIR; por defecto `./reports`
 * bajo el cwd del proceso.
 */
export function getReportsDir(): string {
  return process.env.REPORTS_DIR
    ? path.resolve(process.env.REPORTS_DIR)
    : path.resolve(process.cwd(), 'reports');
}

/**
 * Nombre de archivo derivado SOLO del jobId (un uuid) + extensión (csv/json).
 * No incluye entrada del usuario, por lo que la descarga es inmune a path
 * traversal si se valida el formato del jobId antes de construir la ruta.
 */
export function reportFileName(jobId: string, ext: 'csv' | 'json' = 'csv'): string {
  return `report_${jobId}.${ext}`;
}

export function reportFilePath(jobId: string, ext: 'csv' | 'json' = 'csv'): string {
  return path.join(getReportsDir(), reportFileName(jobId, ext));
}
