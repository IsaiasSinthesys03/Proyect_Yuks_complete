import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import dotenv from 'dotenv';
import * as path from 'path';
import { promises as fs } from 'fs';

dotenv.config();

/**
 * Script de Migraciones — Animayuks Backend.
 *
 * Usa el Migrator oficial de Kysely con FileMigrationProvider.
 * Esto permite:
 *   - Tracking automático de migraciones ya aplicadas (tabla `kysely_migration`).
 *   - Ejecución incremental: solo corre las migraciones pendientes.
 *   - Rollback controlado si se necesita en el futuro.
 *
 * Nota: Kysely v0.29+ exporta Migrator desde 'kysely/migration' (subpath export),
 * que no es resoluble con moduleResolution "node10". Usamos require() dinámico
 * para sortear la restricción de tipos en tiempo de compilación.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Migrator, FileMigrationProvider } = require('kysely/migration');

async function run() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  // Importar las migraciones explícitamente para evitar problemas
  // de resolución de rutas dinámicas (ESM vs CJS) en Windows con tsx.
  const migration001 = require('./migrations/001_initial_schema');
  const migration002 = require('./migrations/002_catalog_schema');

  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations() {
        return {
          '001_initial_schema': migration001,
          '002_catalog_schema': migration002,
        };
      },
    },
  });

  try {
    console.log('🔄 Ejecutando migraciones pendientes en Supabase...');

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((result: { migrationName: string; status: string }) => {
      if (result.status === 'Success') {
        console.log(`  ✅ ${result.migrationName} — aplicada exitosamente.`);
      } else if (result.status === 'Error') {
        console.error(`  ❌ ${result.migrationName} — falló.`);
      } else {
        console.log(`  ⏭️  ${result.migrationName} — ${result.status}.`);
      }
    });

    if (error) {
      console.error('\n❌ Error durante la migración:');
      console.error(error);
      process.exit(1);
    }

    if (!results || results.length === 0) {
      console.log('\n✅ No hay migraciones pendientes. La BD está al día.');
    } else {
      console.log(`\n✅ ${results.length} migración(es) aplicada(s) exitosamente.`);
    }
  } catch (err: any) {
    console.error('❌ Error fatal ejecutando migraciones:');
    console.error(err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
