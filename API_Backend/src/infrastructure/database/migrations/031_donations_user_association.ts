import { Kysely } from 'kysely';

/**
 * Asocia opcionalmente una donación a una cuenta autenticada. No se hace
 * backfill por correo porque donor_email no constituye prueba de identidad.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('donations')
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null')
    )
    .execute();

  await db.schema
    .createIndex('idx_donations_user_created_at')
    .on('donations')
    .columns(['user_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_donations_user_created_at').ifExists().execute();
  await db.schema.alterTable('donations').dropColumn('user_id').execute();
}
