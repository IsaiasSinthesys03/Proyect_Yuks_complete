/**
 * Constructor de CSV puro (Fase 31). Sin dependencias.
 *
 * Escapa según RFC 4180: un valor se envuelve en comillas dobles si contiene
 * coma, comilla o salto de línea, y las comillas internas se duplican.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Construye un CSV a partir de un array de objetos planos. Los encabezados se
 * derivan de las claves de la primera fila. Si no hay filas, devuelve solo un
 * comentario para que el archivo no quede vacío.
 */
export function buildCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return '# Sin datos para el rango solicitado\n';
  }

  const headers = Object.keys(rows[0]);
  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','));
  }

  return lines.join('\n') + '\n';
}
