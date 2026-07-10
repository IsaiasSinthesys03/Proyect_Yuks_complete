import { Kysely, sql } from 'kysely';

/**
 * Migración 019: Índices de Rendimiento + Multiplicadores de Envío por Tier (Fase 35).
 *
 * ÍNDICES (M-17): cierran full-table-scans en rutas calientes.
 *   - idx_orders_stripe_payment_intent_id: CRÍTICO — el webhook de Stripe hace
 *     `findByStripePaymentIntentId` en CADA evento; sin índice era un Seq Scan.
 *   - idx_wallet_transactions_order_id: usado por `findTransactionByOrderId` (idempotencia de débito).
 *   - idx_order_items_variant_id: usado por analytics/reportes al agrupar por variante.
 *   (idx_orders_user_id ya existía desde la migración 005 — no se recrea.)
 *
 * SEED (REQ-BE-07 / REQ-FE-14): multiplicadores del umbral de envío gratis por
 * tier de lealtad. Un multiplicador < 1 REDUCE el umbral (envío gratis más fácil)
 * para rangos altos. BRONZE = 1.0 por defecto (sin clave).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders (stripe_payment_intent_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON wallet_transactions (order_id)`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items (variant_id)`.execute(db);

  await db
    .insertInto('system_settings')
    .values([
      { key: 'tier_shipping_multiplier_silver', value: JSON.stringify(0.9) },
      { key: 'tier_shipping_multiplier_gold', value: JSON.stringify(0.75) },
      { key: 'tier_shipping_multiplier_platinum', value: JSON.stringify(0.5) },
    ])
    .onConflict((oc) => oc.column('key').doNothing())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_orders_stripe_payment_intent_id`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_wallet_transactions_order_id`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_order_items_variant_id`.execute(db);
  await db
    .deleteFrom('system_settings')
    .where('key', 'in', ['tier_shipping_multiplier_silver', 'tier_shipping_multiplier_gold', 'tier_shipping_multiplier_platinum'])
    .execute();
}
