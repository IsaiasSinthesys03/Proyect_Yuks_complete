import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('products')
    .addColumn('gallery_urls', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('products')
    .dropColumn('gallery_urls')
    .execute();
}
