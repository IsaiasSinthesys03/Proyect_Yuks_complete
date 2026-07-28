import { Kysely } from 'kysely';

/**
 * Fase 50: Agregar detalles logísticos a system_settings.
 * - store_address: Dirección física del local.
 * - local_eta: Tiempo estimado de entrega local.
 * - external_eta: Tiempo estimado de entrega foráneo.
 */
export async function up(db: Kysely<any>): Promise<void> {
  const now = new Date();
  
  await db
    .insertInto('system_settings')
    .values([
      { key: 'store_address', value: JSON.stringify('Calle 60 #123 x 45 y 47, Centro, Mérida, Yucatán'), updated_at: now },
      { key: 'local_eta', value: JSON.stringify('Llega hoy mismo'), updated_at: now },
      { key: 'external_eta', value: JSON.stringify('3 a 5 días hábiles'), updated_at: now },
    ])
    .onConflict(oc => oc.column('key').doNothing())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .deleteFrom('system_settings')
    .where('key', 'in', ['store_address', 'local_eta', 'external_eta'])
    .execute();
}
