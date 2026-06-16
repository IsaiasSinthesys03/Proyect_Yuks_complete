import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Database } from './schema/db-types';

dotenv.config();

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  })
});

// Database instanciado exportable como Singleton para todo el sistema
export const db = new Kysely<Database>({
  dialect,
});
