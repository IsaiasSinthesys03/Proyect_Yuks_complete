import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('banners')
    .addColumn('tag', 'varchar(100)')
    .addColumn('description', 'text')
    .addColumn('video_url', 'varchar(500)')
    .addColumn('accent_color', 'varchar(20)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('banners')
    .dropColumn('tag')
    .dropColumn('description')
    .dropColumn('video_url')
    .dropColumn('accent_color')
    .execute();
}
