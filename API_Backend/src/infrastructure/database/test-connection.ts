import { Pool } from 'pg';
import { Kysely, PostgresDialect, sql } from 'kysely';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  try {
    console.log('⏳ Conectando a Supabase...');
    // Realizamos una consulta simple para comprobar que hay respuesta
    const result = await sql`SELECT 1 as connected, version() as pg_version`.execute(db);
    
    console.log('✅ ¡Conexión Exitosa!');
    console.log('📌 Detalles del servidor de BD:', (result.rows[0] as any).pg_version);
  } catch (err: any) {
    console.error('❌ Fallo al conectar con la Base de Datos:');
    console.error(err.message);
  } finally {
    await db.destroy();
  }
}

testConnection();
