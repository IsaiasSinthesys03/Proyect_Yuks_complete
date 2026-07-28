import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('banners')
    .addColumn('button_text', 'varchar(50)', (col) => col.defaultTo('Descargar en Google Play'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('banners')
    .dropColumn('button_text')
    .execute();
}
