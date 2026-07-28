import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('legal_documents')
    .addColumn('pdf_url', 'varchar(500)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('legal_documents')
    .dropColumn('pdf_url')
    .execute();
}
