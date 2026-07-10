import { Kysely, sql } from 'kysely';

/**
 * Migración 005: Tablas de Pedidos (orders + order_items)
 *
 * Núcleo transaccional del e-commerce (REQ-BE-01, REQ-FE-23).
 * - Pipeline de status de 8 estados (incluyendo NEEDS_RECONCILIATION por Q4).
 * - Idempotency Key UNIQUE para prevenir doble cobro (REQ-BE-01).
 * - Campos de Última Milla (chofer, tracking) para CMS-FE-04.
 * - Audit Trail: terms_version + client_ip para compliance bancario (REQ-BE-08).
 * - Snapshots congelados de precio y nombre en order_items (inmutabilidad de la orden).
 *
 * FK a coupons es NULLABLE (no toda orden usa cupón).
 * FK a users usa ON DELETE RESTRICT (prohibido borrar usuarios con pedidos).
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // Tabla: orders
  // ==========================================
  await db.schema
    .createTable('orders')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('restrict'))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('PAYMENT_PENDING'))
    .addColumn('subtotal', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('discount_amount', 'numeric(10, 2)', (col) => col.notNull().defaultTo(sql`0`))
    .addColumn('shipping_cost', 'numeric(10, 2)', (col) => col.notNull().defaultTo(sql`0`))
    .addColumn('wallet_deduction', 'numeric(10, 2)', (col) => col.notNull().defaultTo(sql`0`))
    .addColumn('total_paid', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('delivery_type', 'varchar(50)')
    .addColumn('shipping_address', 'varchar(500)', (col) => col.notNull())
    .addColumn('postal_code', 'varchar(10)', (col) => col.notNull())
    .addColumn('municipality', 'varchar(100)', (col) => col.notNull())
    .addColumn('state', 'varchar(100)', (col) => col.notNull())
    .addColumn('terms_version', 'varchar(50)', (col) => col.notNull())
    .addColumn('client_ip', 'varchar(45)', (col) => col.notNull())
    .addColumn('idempotency_key', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('coupon_id', 'uuid', (col) => col.references('coupons.id'))
    .addColumn('stripe_payment_intent_id', 'varchar(255)')
    .addColumn('driver_name', 'varchar(100)')
    .addColumn('driver_vehicle', 'varchar(100)')
    .addColumn('driver_phone', 'varchar(20)')
    .addColumn('tracking_company', 'varchar(100)')
    .addColumn('tracking_number', 'varchar(100)')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // ==========================================
  // CONSTRAINTS DE SEGURIDAD — orders
  // ==========================================

  // El total pagado no puede ser negativo (escudo contra ataques de saldo negativo)
  await sql`ALTER TABLE orders ADD CONSTRAINT chk_order_total_paid_non_negative CHECK (total_paid >= 0)`.execute(db);

  // El subtotal no puede ser negativo
  await sql`ALTER TABLE orders ADD CONSTRAINT chk_order_subtotal_non_negative CHECK (subtotal >= 0)`.execute(db);

  // El descuento no puede ser negativo
  await sql`ALTER TABLE orders ADD CONSTRAINT chk_order_discount_non_negative CHECK (discount_amount >= 0)`.execute(db);

  // El costo de envío no puede ser negativo
  await sql`ALTER TABLE orders ADD CONSTRAINT chk_order_shipping_non_negative CHECK (shipping_cost >= 0)`.execute(db);

  // La deducción del monedero no puede ser negativa
  await sql`ALTER TABLE orders ADD CONSTRAINT chk_order_wallet_deduction_non_negative CHECK (wallet_deduction >= 0)`.execute(db);

  // ==========================================
  // ÍNDICES — orders
  // ==========================================
  await sql`CREATE INDEX idx_orders_user_id ON orders (user_id)`.execute(db);
  await sql`CREATE INDEX idx_orders_status ON orders (status)`.execute(db);

  // ==========================================
  // Tabla: order_items
  // ==========================================
  await db.schema
    .createTable('order_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('order_id', 'uuid', (col) => col.notNull().references('orders.id').onDelete('cascade'))
    .addColumn('variant_id', 'uuid', (col) => col.notNull().references('product_variants.id'))
    .addColumn('product_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('variant_sku', 'varchar(100)', (col) => col.notNull())
    .addColumn('unit_price', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('has_virtual_reward', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // ==========================================
  // CONSTRAINTS DE SEGURIDAD — order_items
  // ==========================================

  // La cantidad debe ser positiva (no se puede comprar 0 o -1 unidades)
  await sql`ALTER TABLE order_items ADD CONSTRAINT chk_order_item_quantity_positive CHECK (quantity > 0)`.execute(db);

  // El precio unitario no puede ser negativo
  await sql`ALTER TABLE order_items ADD CONSTRAINT chk_order_item_unit_price_non_negative CHECK (unit_price >= 0)`.execute(db);

  // Índice para consultas por pedido
  await sql`CREATE INDEX idx_order_items_order_id ON order_items (order_id)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Orden inverso: primero order_items (hijo), luego orders (padre)
  await db.schema.dropTable('order_items').execute();
  await db.schema.dropTable('orders').execute();
}
