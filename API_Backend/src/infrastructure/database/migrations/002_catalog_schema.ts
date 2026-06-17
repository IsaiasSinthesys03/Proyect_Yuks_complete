import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // Tabla: categories
  // ==========================================
  await db.schema
    .createTable('categories')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Restricción UNIQUE case-insensitive sobre el nombre de categoría.
  // Previene duplicados como "Playeras" vs "playeras" a nivel de BD,
  // usando un índice único funcional sobre LOWER(name).
  await sql`CREATE UNIQUE INDEX idx_categories_name_lower ON categories (LOWER(name))`.execute(db);

  // ==========================================
  // Tabla: products
  // ==========================================
  await db.schema
    .createTable('products')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('category_id', 'uuid', (col) => col.notNull().references('categories.id'))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('price', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('has_virtual_reward', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('is_deleted', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('image_url', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // ==========================================
  // Tabla: product_variants
  // ==========================================
  await db.schema
    .createTable('product_variants')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('product_id', 'uuid', (col) => col.notNull().references('products.id').onDelete('cascade'))
    .addColumn('sku', 'varchar(100)', (col) => col.unique().notNull())
    .addColumn('size', 'varchar(50)')
    .addColumn('color', 'varchar(50)')
    .addColumn('stock', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Constraint CHECK a nivel de BD para impedir stock negativo.
  // Esto actúa como red de seguridad independiente de la lógica de aplicación.
  await sql`ALTER TABLE product_variants ADD CONSTRAINT chk_stock_non_negative CHECK (stock >= 0)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('product_variants').execute();
  await db.schema.dropTable('products').execute();
  await db.schema.dropTable('categories').execute();
}
