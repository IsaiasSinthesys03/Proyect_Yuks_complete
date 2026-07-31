import { adminApi, unwrapAdmin } from '../lib/adminApi';

/**
 * Reportes asíncronos del CMS (Fase 48, CMS-FE-18/19).
 *
 * Flujo completo:
 *   1. POST /api/admin/reports → 202 { jobId, reportType, format, status:'queued' }
 *      (la UI NO se bloquea: el worker de BullMQ genera el archivo aparte)
 *   2. El worker publica `report:ready` (Redis Pub/Sub → WS canal admin)
 *   3. La campana habilita GET /api/admin/reports/:jobId/download
 */

/** Tipos válidos del backend (REPORT_TYPES) con su etiqueta de UI. */
export const REPORT_ENTITIES = [
  { value: 'sales', label: 'Ventas' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'donations', label: 'Donaciones' },
  { value: 'users', label: 'CRM (Usuarios)' },
  { value: 'inventory', label: 'Inventario' },
  { value: 'audit', label: 'Auditoría' },
];

/** Encola la generación. @returns { jobId, reportType, format, status } (HTTP 202). */
export async function generateReport({ reportType, format, startDate, endDate }) {
  return unwrapAdmin(await adminApi.post('/api/admin/reports', {
    reportType,
    format,
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  }));
}

/**
 * Descarga el archivo generado. Un <a href> no puede llevar el Bearer, así que
 * se baja como BLOB autenticado y se dispara el guardado desde memoria.
 */
export async function downloadReport(jobId, filenameHint = 'reporte') {
  const res = await adminApi.get(`/api/admin/reports/${jobId}/download`, { responseType: 'blob' });
  const contentType = res.headers['content-type'] ?? '';
  const ext = contentType.includes('json') ? 'json' : 'csv';
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameHint}-${jobId.slice(0, 8)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
