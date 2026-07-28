import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  const now = new Date();
  await db.insertInto('system_settings').values([
    { key: 'blocked_shipping_continents', value: JSON.stringify([]), updated_at: now },
    { key: 'blocked_shipping_countries', value: JSON.stringify([]), updated_at: now },
    { key: 'blocked_shipping_regions', value: JSON.stringify([]), updated_at: now },
    {
      key: 'shipping_unavailable_message',
      value: JSON.stringify('Lo sentimos, por el momento no podemos realizar entregas en la zona de tu domicilio. Esperamos ampliar nuestra cobertura muy pronto.'),
      updated_at: now,
    },
  ]).onConflict((oc) => oc.column('key').doNothing()).execute();

  // Los registros históricos usaban el nombre del país; desde ahora se guarda ISO-2.
  await db.updateTable('addresses').set({ country: 'MX' }).where('country', 'in', ['México', 'Mexico', 'MÃ©xico']).execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('system_settings').where('key', 'in', [
    'blocked_shipping_continents',
    'blocked_shipping_countries',
    'blocked_shipping_regions',
    'shipping_unavailable_message',
  ]).execute();
}
