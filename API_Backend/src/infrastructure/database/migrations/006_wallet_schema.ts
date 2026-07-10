import { Kysely, sql } from 'kysely';

/**
 * Migración 006: Tablas de Monedero Virtual (wallet + wallet_transactions)
 *
 * Núcleo financiero del e-commerce (REQ-FE-20, REQ-BE-01).
 *
 * Reglas de negocio críticas implementadas a nivel de BD:
 *   - Q8: `CHECK (balance >= 0)` — Estrictamente prohibido saldo negativo.
 *     Cualquier colisión que intente sobregirar la cuenta lanzará un error SQL
 *     inmediato que abortará la transacción a nivel de base de datos.
 *   - Resolución #4: Saldo Global y Renovable. Cada ingreso actualiza `expires_at`
 *     a NOW() + 12 meses.
 *   - Resolución #5: Loophole Anti-fraude. El campo `original_expires_at` en
 *     wallet_transactions permite heredar la caducidad original en reembolsos
 *     por cancelación, evitando bucles de renovación infinita.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // Tabla: wallet (1 monedero por usuario)
  // ==========================================
  await db.schema
    .createTable('wallet')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.unique().notNull().references('users.id').onDelete('cascade'))
    .addColumn('balance', 'numeric(10, 2)', (col) => col.notNull().defaultTo(sql`0`))
    .addColumn('expires_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // ==========================================
  // CONSTRAINT DE SEGURIDAD CRÍTICO — wallet
  // Q8: Estrictamente prohibido saldo negativo.
  // Este constraint es la RED DE SEGURIDAD FINAL contra race conditions.
  // Si la lógica de aplicación falla, la BD aborta la transacción.
  // ==========================================
  await sql`ALTER TABLE wallet ADD CONSTRAINT chk_wallet_balance_non_negative CHECK (balance >= 0)`.execute(db);

  // ==========================================
  // Tabla: wallet_transactions (Ledger de movimientos)
  // ==========================================
  await db.schema
    .createTable('wallet_transactions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('wallet_id', 'uuid', (col) => col.notNull().references('wallet.id').onDelete('cascade'))
    .addColumn('order_id', 'uuid', (col) => col.references('orders.id'))
    .addColumn('amount', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('type', 'varchar(20)', (col) => col.notNull())
    .addColumn('source', 'varchar(50)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('original_expires_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // ==========================================
  // CONSTRAINTS DE SEGURIDAD — wallet_transactions
  // ==========================================

  // El monto de la transacción debe ser positivo (el signo lo define `type`: DEPOSIT/WITHDRAWAL)
  await sql`ALTER TABLE wallet_transactions ADD CONSTRAINT chk_wallet_tx_amount_positive CHECK (amount > 0)`.execute(db);

  // Índice para consultas rápidas del ledger por monedero
  await sql`CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions (wallet_id)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Orden inverso: primero las transacciones (hijo), luego el wallet (padre)
  await db.schema.dropTable('wallet_transactions').execute();
  await db.schema.dropTable('wallet').execute();
}
