import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import dotenv from 'dotenv';
import * as argon2 from 'argon2';

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
    const developerCodeHash = await argon2.hash('000000', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await db
      .updateTable('system_settings')
      .set({ value: JSON.stringify(developerCodeHash) })
      .where('key', '=', 'developer_code_hash')
      .execute();

    console.log('Developer code hash updated to "000000"');
  } catch (err) {
    console.error(err);
  } finally {
    await db.destroy();
  }
}

run();
