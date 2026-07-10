import { Kysely } from 'kysely';

/**
 * Migración 017: Trazabilidad del Consentimiento en el Registro (Fase 33, C-04, REQ-BE-08).
 *
 * El SRS exige que "en el momento del Registro de Usuario, el backend guardará
 * un booleano confirmando la aceptación del Aviso de Privacidad". Hasta ahora el
 * registro validaba el checkbox pero NO lo persistía → sin rastro legal.
 *
 * Se guardan DOS datos: el booleano y el timestamp exacto de aceptación, para el
 * audit trail de compliance ante controversias (paralelo al `terms_version` +
 * `client_ip` que ya se sella en el checkout, REQ-BE-08).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('privacy_accepted', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('privacy_accepted_at', 'timestamptz')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('privacy_accepted_at')
    .dropColumn('privacy_accepted')
    .execute();
}
