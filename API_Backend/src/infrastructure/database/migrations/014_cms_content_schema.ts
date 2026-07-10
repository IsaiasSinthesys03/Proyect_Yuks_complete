import { Kysely, sql } from 'kysely';

/**
 * Migración 014: Contenido gestionable del CMS (Fase 30).
 *
 * - `banners`: carrusel/promociones del Landing configurable por el admin
 *   (CMS-FE-XX). `position` ordena; `is_active` + ventana starts_at/ends_at
 *   controlan visibilidad. El storefront solo lee banners activos y vigentes.
 * - `legal_documents`: textos legales versionados (términos, privacidad, envíos,
 *   devoluciones). `slug` UNIQUE identifica cada documento; el checkout guarda
 *   `terms_version` (REQ-BE-08) que corresponde a `version` de aquí.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // Tabla: banners
  // ==========================================
  await db.schema
    .createTable('banners')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('image_url', 'varchar(500)', (col) => col.notNull())
    .addColumn('link_url', 'varchar(500)')
    .addColumn('position', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('starts_at', 'timestamptz')
    .addColumn('ends_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema.createIndex('idx_banners_active_position').on('banners').columns(['is_active', 'position']).execute();

  // ==========================================
  // Tabla: legal_documents
  // ==========================================
  await db.schema
    .createTable('legal_documents')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('slug', 'varchar(50)', (col) => col.unique().notNull())
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('version', 'varchar(20)', (col) => col.notNull().defaultTo('1.0'))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Seed inicial: documentos legales vacíos para las 4 categorías estándar.
  await db
    .insertInto('legal_documents')
    .values([
      { slug: 'terms', title: 'Términos y Condiciones', content: 'Contenido pendiente de redacción.', version: '1.0' },
      { slug: 'privacy', title: 'Aviso de Privacidad', content: 'Contenido pendiente de redacción.', version: '1.0' },
      { slug: 'shipping', title: 'Política de Envíos', content: 'Contenido pendiente de redacción.', version: '1.0' },
      { slug: 'returns', title: 'Política de Devoluciones', content: 'Contenido pendiente de redacción.', version: '1.0' },
    ])
    .onConflict((oc) => oc.column('slug').doNothing())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('legal_documents').ifExists().execute();
  await db.schema.dropTable('banners').ifExists().execute();
}
