import { Kysely, sql } from 'kysely';

/**
 * Migración 012: Tabla de Donaciones (REQ-BE-09, CMS-FE-13)
 *
 * Canal de ingresos directo del SRS. Flujo Stripe PaymentIntent propio,
 * completamente independiente de `orders` e `inventory`.
 *
 * - Idempotency Key UNIQUE: evita doble cobro si el cliente recarga.
 * - Stripe Payment Intent ID UNIQUE: evita procesar el mismo webhook dos veces.
 * - donor_email no referencia `users` — las donaciones son anónimas opcionales.
 * - donation_min_amount se agrega a system_settings como clave configurable.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // Tabla: donations
  // ==========================================
  await db.schema
    .createTable('donations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('stripe_payment_intent_id', 'varchar(255)', (col) => col.unique())
    .addColumn('stripe_charge_id', 'varchar(255)')
    .addColumn('amount', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('donor_email', 'varchar(255)', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('PENDING'))
    .addColumn('idempotency_key', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // CONSTRAINTS
  await sql`ALTER TABLE donations ADD CONSTRAINT chk_donation_amount_positive CHECK (amount > 0)`.execute(db);
  await sql`ALTER TABLE donations ADD CONSTRAINT chk_donation_status CHECK (status IN ('PENDING', 'COMPLETED', 'REFUNDED'))`.execute(db);

  // ÍNDICES
  await db.schema.createIndex('idx_donations_status').on('donations').column('status').execute();
  await db.schema.createIndex('idx_donations_created_at').on('donations').column('created_at').execute();

  // Seed: clave donation_min_amount en system_settings (configurable desde CMS)
  await db
    .insertInto('system_settings')
    .values({ key: 'donation_min_amount', value: JSON.stringify(10) })
    .onConflict((oc) => oc.column('key').doNothing())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('donations').ifExists().execute();
  await db
    .deleteFrom('system_settings')
    .where('key', '=', 'donation_min_amount')
    .execute();
}
