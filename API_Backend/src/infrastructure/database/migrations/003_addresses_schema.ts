import { Kysely, sql } from 'kysely';

/**
 * Migración 003: Tabla de Direcciones (addresses)
 *
 * Soporta la libreta de direcciones del usuario (REQ-FE-09, REQ-FE-17).
 * - Múltiples direcciones por usuario con marcación de "Predeterminada".
 * - Los campos `municipality` y `state` provienen de menús desplegables (Selects),
 *   no de texto libre, garantizando match exacto con el Motor de Enrutamiento (REQ-BE-07).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('addresses')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('label', 'varchar(100)', (col) => col.notNull())
    .addColumn('street', 'varchar(255)', (col) => col.notNull())
    .addColumn('exterior_number', 'varchar(20)', (col) => col.notNull())
    .addColumn('interior_number', 'varchar(20)')
    .addColumn('neighborhood', 'varchar(100)', (col) => col.notNull())
    .addColumn('postal_code', 'varchar(10)', (col) => col.notNull())
    .addColumn('municipality', 'varchar(100)', (col) => col.notNull())
    .addColumn('state', 'varchar(100)', (col) => col.notNull())
    .addColumn('country', 'varchar(50)', (col) => col.notNull().defaultTo('México'))
    .addColumn('references', 'text')
    .addColumn('is_default', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Índice para consultas rápidas de direcciones por usuario
  await sql`CREATE INDEX idx_addresses_user_id ON addresses (user_id)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('addresses').execute();
}
