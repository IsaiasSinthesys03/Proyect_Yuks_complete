import { Kysely, sql } from 'kysely';

/**
 * Migración 004: Tabla de Cupones (coupons)
 *
 * Soporta códigos de descuento alfanuméricos (CMS-FE-15, REQ-FE-21).
 * - Tipo de descuento: Porcentaje (%) o Monto Fijo ($ MXN).
 * - Límite de usos máximos globales.
 * - Toggle On/Off sin destruir registro histórico.
 * - Monto mínimo de carrito para aplicar.
 *
 * NOTA: Esta migración se ejecuta ANTES de orders (005) porque
 * la tabla orders tiene una FK opcional hacia coupons.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('coupons')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('code', 'varchar(50)', (col) => col.unique().notNull())
    .addColumn('discount_type', 'varchar(20)', (col) => col.notNull())
    .addColumn('discount_value', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('max_uses', 'integer', (col) => col.notNull())
    .addColumn('current_uses', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('min_purchase_amount', 'numeric(10, 2)')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // ==========================================
  // CONSTRAINTS DE SEGURIDAD
  // ==========================================

  // El valor del descuento debe ser positivo
  await sql`ALTER TABLE coupons ADD CONSTRAINT chk_coupon_discount_positive CHECK (discount_value > 0)`.execute(db);

  // Los usos máximos deben ser positivos
  await sql`ALTER TABLE coupons ADD CONSTRAINT chk_coupon_max_uses_positive CHECK (max_uses > 0)`.execute(db);

  // Los usos actuales no pueden ser negativos ni exceder el máximo
  await sql`ALTER TABLE coupons ADD CONSTRAINT chk_coupon_current_uses_valid CHECK (current_uses >= 0 AND current_uses <= max_uses)`.execute(db);

  // Índice UNIQUE case-insensitive para búsqueda de códigos (ej. "VERANO26" = "verano26")
  await sql`CREATE UNIQUE INDEX idx_coupons_code_upper ON coupons (UPPER(code))`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('coupons').execute();
}
