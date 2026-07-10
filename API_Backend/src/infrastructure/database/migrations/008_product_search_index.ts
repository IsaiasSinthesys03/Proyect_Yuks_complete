import { Kysely, sql } from 'kysely';

/**
 * Migración: Búsqueda de Texto Completo Nativa de PostgreSQL (REQ-BE-03).
 *
 * Elimina el anti-patrón `ILIKE '%query%'` (full table scan, sin tolerancia
 * a typos, no indexable de forma eficiente) y lo reemplaza con una columna
 * `tsvector` generada automáticamente por PostgreSQL, respaldada por un
 * índice GIN — el mecanismo nativo de Full-Text Search recomendado por el SRS.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE products
    ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('spanish', name)) STORED
  `.execute(db);

  await sql`
    CREATE INDEX idx_products_search_vector ON products USING GIN (search_vector)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_products_search_vector`.execute(db);
  await sql`ALTER TABLE products DROP COLUMN IF EXISTS search_vector`.execute(db);
}
