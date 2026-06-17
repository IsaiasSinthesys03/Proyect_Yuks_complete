import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Habilitar UUID
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db);

  // Crear Tabla Users
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('email', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('role', 'varchar(50)', (col) => col.notNull().defaultTo('CLIENT'))
    .addColumn('is_banned', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Crear Tabla Profiles
  await db.schema
    .createTable('profiles')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.unique().notNull().references('users.id').onDelete('cascade'))
    .addColumn('first_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('last_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('phone', 'varchar(20)')
    .addColumn('tier_level', 'varchar(50)', (col) => col.notNull().defaultTo('BRONZE'))
    .addColumn('experience_points', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('profiles').execute();
  await db.schema.dropTable('users').execute();
}
