import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  const now = new Date();

  await db
    .insertInto('system_settings')
    .values([
      { key: 'donation_banner_url', value: JSON.stringify(null), updated_at: now },
      { key: 'donation_title', value: JSON.stringify('Apoya el Proyecto'), updated_at: now },
      { key: 'donation_description', value: JSON.stringify('Tu aportación nos ayuda a mantener los servidores encendidos. 💖'), updated_at: now },
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .deleteFrom('system_settings')
    .where('key', 'in', ['donation_banner_url', 'donation_title', 'donation_description'])
    .execute();
}
