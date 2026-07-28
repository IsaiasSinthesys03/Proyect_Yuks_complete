import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  const now = new Date();

  await db
    .insertInto('system_settings')
    .values([
      { key: 'donation_min_amount', value: JSON.stringify(10), updated_at: now },
      { key: 'donation_quick_amounts', value: JSON.stringify([10, 20, 30]), updated_at: now },
    ])
    .onConflict(oc => oc.column('key').doNothing())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .deleteFrom('system_settings')
    .where('key', 'in', ['donation_min_amount', 'donation_quick_amounts'])
    .execute();
}
