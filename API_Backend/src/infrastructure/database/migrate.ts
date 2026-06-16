import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import dotenv from 'dotenv';
import { up } from './migrations/001_initial_schema';

dotenv.config();

async function run() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  try {
    console.log('Iniciando ejecución de esquema en Supabase...');
    await up(db);
    console.log('✅ Esquema creado exitosamente. ¡Conexión perfecta!');
  } catch (err: any) {
    console.error('❌ Error ejecutando el esquema:');
    console.error(err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
