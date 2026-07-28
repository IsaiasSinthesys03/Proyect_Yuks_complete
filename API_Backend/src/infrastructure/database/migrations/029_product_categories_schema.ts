import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Create the many-to-many relationship table
  await db.schema
    .createTable('product_categories')
    .addColumn('product_id', 'uuid', (col) => col.notNull().references('products.id').onDelete('cascade'))
    .addColumn('category_id', 'uuid', (col) => col.notNull().references('categories.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('pk_product_categories', ['product_id', 'category_id'])
    .execute();

  // 2. Migrate existing data from products.category_id to the new table
  await sql`
    INSERT INTO product_categories (product_id, category_id)
    SELECT id, category_id
    FROM products
    WHERE category_id IS NOT NULL
    ON CONFLICT DO NOTHING
  `.execute(db);

  // 3. Drop the old category_id column from products
  await db.schema
    .alterTable('products')
    .dropColumn('category_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // 1. Restore the column in products
  await db.schema
    .alterTable('products')
    .addColumn('category_id', 'uuid', (col) => col.references('categories.id'))
    .execute();

  // 2. Try to restore one category per product (picks the first one found)
  await sql`
    UPDATE products p
    SET category_id = (
      SELECT category_id 
      FROM product_categories pc 
      WHERE pc.product_id = p.id 
      LIMIT 1
    )
  `.execute(db);

  // 3. Drop the many-to-many table
  await db.schema
    .dropTable('product_categories')
    .execute();
}
