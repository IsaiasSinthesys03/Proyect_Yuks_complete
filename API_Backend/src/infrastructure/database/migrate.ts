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
  const migration003 = require('./migrations/003_addresses_schema');
  const migration004 = require('./migrations/004_coupons_schema');
  const migration005 = require('./migrations/005_orders_schema');
  const migration006 = require('./migrations/006_wallet_schema');
  const migration007 = require('./migrations/007_rewards_schema');
  const migration008 = require('./migrations/008_product_search_index');
  const migration009 = require('./migrations/009_admin_security_schema');
  const migration010 = require('./migrations/010_fix_audit_trigger_function');
  const migration011 = require('./migrations/011_redact_sensitive_audit_fields');
  const migration012 = require('./migrations/012_donations_schema');
  const migration013 = require('./migrations/013_advanced_auth_schema');
  const migration014 = require('./migrations/014_cms_content_schema');
  const migration015 = require('./migrations/015_gamification_wishlist_schema');
  const migration016 = require('./migrations/016_notifications_schema');
  const migration017 = require('./migrations/017_register_compliance');
  const migration018 = require('./migrations/018_fuzzy_search');
  const migration019 = require('./migrations/019_performance_indices');

  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations() {
        return {
          '001_initial_schema': migration001,
          '002_catalog_schema': migration002,
          '003_addresses_schema': migration003,
          '004_coupons_schema': migration004,
          '005_orders_schema': migration005,
          '006_wallet_schema': migration006,
          '007_rewards_schema': migration007,
          '008_product_search_index': migration008,
          '009_admin_security_schema': migration009,
          '010_fix_audit_trigger_function': migration010,
          '011_redact_sensitive_audit_fields': migration011,
          '012_donations_schema': migration012,
          '013_advanced_auth_schema': migration013,
          '014_cms_content_schema': migration014,
          '015_gamification_wishlist_schema': migration015,
          '016_notifications_schema': migration016,
          '017_register_compliance': migration017,
          '018_fuzzy_search': migration018,
          '019_performance_indices': migration019,
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
