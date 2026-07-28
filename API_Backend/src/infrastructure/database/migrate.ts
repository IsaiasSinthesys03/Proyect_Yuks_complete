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
  const migration020 = require('./migrations/020_product_gallery_schema');
  const migration021 = require('./migrations/021_product_status');
  const migration022 = require('./migrations/022_expand_banners_schema');
  const migration023 = require('./migrations/023_add_button_text_to_banners');
  const migration024 = require('./migrations/024_add_donation_settings');
  const migration025 = require('./migrations/025_add_missing_donation_settings');
  const migration026 = require('./migrations/026_add_logistics_details_settings');
  const migration027 = require('./migrations/027_add_pdf_url_to_legal_documents');
  const migration028 = require('./migrations/028_add_shipping_coverage_policy');
  const migration029 = require('./migrations/029_product_categories_schema');
  const migration030 = require('./migrations/030_youtube_videos_schema');
  const migration031 = require('./migrations/031_donations_user_association');

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
          '020_product_gallery_schema': migration020,
          '021_product_status': migration021,
          '022_expand_banners_schema': migration022,
          '023_add_button_text_to_banners': migration023,
          '024_add_donation_settings': migration024,
          '025_add_missing_donation_settings': migration025,
          '026_add_logistics_details_settings': migration026,
          '027_add_pdf_url_to_legal_documents': migration027,
          '028_add_shipping_coverage_policy': migration028,
          '029_product_categories_schema': migration029,
          '030_youtube_videos_schema': migration030,
          '031_donations_user_association': migration031,
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
