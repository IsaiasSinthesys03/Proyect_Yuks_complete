import { Kysely, sql } from 'kysely';

/**
 * Migración 016: Persistencia de Notificaciones (Fase 32, REQ-FE-24, REQ-FE-14).
 *
 * El WebSocket es efímero: si el cliente está desconectado cuando cambia el
 * estatus de su pedido, perdería el aviso. Esta tabla respalda la "bandeja de
 * entrada" con contador de no leídas. Cada evento WS a un usuario se persiste
 * aquí ANTES de emitirse, garantizando que la notificación sobreviva reconexiones.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('notifications')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('type', 'varchar(50)', (col) => col.notNull())      // 'order:status_changed', etc.
    .addColumn('payload', 'jsonb', (col) => col.notNull())          // datos del evento
    .addColumn('is_read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Índice compuesto para el conteo de no leídas y el listado por usuario.
  await db.schema
    .createIndex('idx_notifications_user_read')
    .on('notifications')
    .columns(['user_id', 'is_read'])
    .execute();
  await db.schema
    .createIndex('idx_notifications_user_created')
    .on('notifications')
    .columns(['user_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('notifications').ifExists().execute();
}
