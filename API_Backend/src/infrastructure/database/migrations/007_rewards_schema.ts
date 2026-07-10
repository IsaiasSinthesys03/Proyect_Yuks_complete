import { Kysely, sql } from 'kysely';

/**
 * Migración 007: Tabla de Códigos de Recompensa (reward_codes)
 *
 * Game Bridge (REQ-BE-05, REQ-FE-22).
 *
 * Reglas de negocio críticas:
 *   - Resolución #6: Los UUIDs NO caducan temporalmente. Pueden guardarse y regalarse
 *     meses después. La "Garbage Collection" solo ocurre por cancelación de orden.
 *   - Resolución #7: Generación Unitaria (1 a 1). Si el cliente compra 5 peluches,
 *     se generan 5 códigos UUID separados, vinculados a cada order_item individual.
 *   - Anti-fraude (Cancelación): Si el código ya fue canjeado ('CLAIMED') en el juego,
 *     el backend bloquea la cancelación automática del pedido.
 *   - Q11: Validación M2M. El servidor del juego consulta estos códigos usando
 *     un Service Account Token (JWT estático de larga duración).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('reward_codes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('order_id', 'uuid', (col) => col.notNull().references('orders.id'))
    .addColumn('order_item_id', 'uuid', (col) => col.notNull().references('order_items.id'))
    .addColumn('code', 'uuid', (col) => col.unique().notNull().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('AVAILABLE'))
    .addColumn('claimed_at', 'timestamptz')
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Índice para consultas por pedido (listar recompensas de una orden)
  await sql`CREATE INDEX idx_reward_codes_order_id ON reward_codes (order_id)`.execute(db);

  // Índice para búsqueda rápida M2M por código UUID
  await sql`CREATE INDEX idx_reward_codes_code ON reward_codes (code)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('reward_codes').execute();
}
