import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('products')
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
    .execute();

  // Create an index for faster lookups on public catalog
  await db.schema
    .createIndex('products_status_idx')
    .on('products')
    .column('status')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('products_status_idx').execute();
  
  await db.schema
    .alterTable('products')
    .dropColumn('status')
    .execute();
}
