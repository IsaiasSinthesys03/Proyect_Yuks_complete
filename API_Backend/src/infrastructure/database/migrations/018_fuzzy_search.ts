import { Kysely, sql } from 'kysely';

/**
 * Migración 018: Búsqueda Fuzzy (pg_trgm) + Filtro por Personaje (Fase 33, A-05, REQ-FE-12, REQ-BE-03).
 *
 * El índice FTS de la migración 008 (`to_tsvector`) hace stemming pero NO tolera
 * errores ortográficos ("pikchu" no encontraba "Pikachu"). El SRS exige "Tolerancia
 * a errores ortográficos (Fuzzy Matching)". Se habilita `pg_trgm` (trigramas) con
 * un índice GIN sobre `name` para consultas de similitud (`word_similarity`).
 *
 * Además se añade la columna `character` (Personaje) para el filtro combinable
 * exigido por REQ-FE-12 (Categoría + Rango de Precio + Personaje).
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Extensión de trigramas para búsqueda por similitud (fuzzy).
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);

  // Columna de Personaje para el filtro del catálogo (nullable).
  await db.schema
    .alterTable('products')
    .addColumn('character', 'varchar(100)')
    .execute();

  // Índice GIN de trigramas sobre el nombre — acelera `word_similarity` / `%`.
  await sql`CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_products_name_trgm`.execute(db);
  await db.schema.alterTable('products').dropColumn('character').execute();
  // No se elimina la extensión pg_trgm: podría estar en uso por otras estructuras.
}
