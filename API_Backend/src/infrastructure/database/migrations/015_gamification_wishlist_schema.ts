import { Kysely, sql } from 'kysely';

/**
 * Migración 015: Gamificación (Tiers de XP) + Wishlist (Fase 31).
 *
 * - Semilla en `system_settings` de la configuración de gamificación:
 *   ratio XP↔moneda y los umbrales de cada tier. El admin puede ajustarlos
 *   desde el CMS y el cálculo de tier los lee dinámicamente (REQ-FE-14).
 * - Tabla `wishlists`: lista de deseos por usuario (REQ-FE-19). UNIQUE por
 *   (user_id, product_id) para que un producto no se duplique en la lista.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // Semilla de configuración de gamificación
  // ==========================================
  await db
    .insertInto('system_settings')
    .values([
      { key: 'xp_per_currency', value: JSON.stringify(1) },        // 1 XP por unidad monetaria pagada
      { key: 'tier_silver_threshold', value: JSON.stringify(500) },
      { key: 'tier_gold_threshold', value: JSON.stringify(2000) },
      { key: 'tier_platinum_threshold', value: JSON.stringify(5000) },
    ])
    .onConflict((oc) => oc.column('key').doNothing())
    .execute();

  // ==========================================
  // Tabla: wishlists (REQ-FE-19)
  // ==========================================
  await db.schema
    .createTable('wishlists')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('product_id', 'uuid', (col) => col.references('products.id').onDelete('cascade').notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Un producto no puede estar dos veces en la lista del mismo usuario.
  await sql`ALTER TABLE wishlists ADD CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)`.execute(db);
  await db.schema.createIndex('idx_wishlists_user').on('wishlists').column('user_id').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('wishlists').ifExists().execute();
  await db
    .deleteFrom('system_settings')
    .where('key', 'in', ['xp_per_currency', 'tier_silver_threshold', 'tier_gold_threshold', 'tier_platinum_threshold'])
    .execute();
}
