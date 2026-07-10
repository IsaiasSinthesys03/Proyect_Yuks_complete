import { Transaction, sql } from 'kysely';
import { db } from './client';
import { Database } from './schema/db-types';
import { AdminAuditContext } from '../../domain/types/AdminTypes';

/**
 * Ejecuta una operación dentro de una transacción SQL que tiene seteado
 * el contexto del administrador autenticado (`app.current_admin_id`,
 * `app.current_admin_email`, `app.current_admin_ip`) vía `set_config(...)`.
 *
 * Los triggers de auditoría (migración 009) leen estas variables de sesión
 * con `current_setting(..., true)` para poblar `audit_logs` automáticamente
 * cuando la transacción muta una tabla administrable. Si esta función NO
 * se usa para envolver una mutación, el trigger simplemente no encuentra
 * contexto de admin y omite el log — por eso es indispensable que todo
 * Use Case administrativo que escriba en BD pase por aquí.
 *
 * Se usa `set_config()` (función SQL parametrizable) en vez de `SET LOCAL`
 * con interpolación de string, para que el email/IP del admin NUNCA se
 * concatenen directamente en SQL (cero superficie de inyección aquí).
 */
export async function withAdminAuditContext<T>(
  context: AdminAuditContext,
  callback: (trx: Transaction<Database>) => Promise<T>
): Promise<T> {
  return db.transaction().execute(async (trx) => {
    await sql`SELECT set_config('app.current_admin_id', ${context.adminId}, true)`.execute(trx);
    await sql`SELECT set_config('app.current_admin_email', ${context.adminEmail}, true)`.execute(trx);
    await sql`SELECT set_config('app.current_admin_ip', ${context.ip}, true)`.execute(trx);

    return callback(trx);
  });
}
