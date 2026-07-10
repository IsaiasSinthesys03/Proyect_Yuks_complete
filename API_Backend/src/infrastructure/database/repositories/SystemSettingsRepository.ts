import IORedis from 'ioredis';
import { db } from '../client';
import { ISystemSettingsRepository } from '../../../application/interfaces/ISystemSettingsRepository';
import { SystemSettingsValues, UpdateSystemSettingsDTO, GamificationConfig } from '../../../domain/types/SystemSettingsDTOs';

/** Clave y TTL de la caché de configuración de checkout (BRECHA-16). */
const CHECKOUT_CONFIG_CACHE_KEY = 'cache:system-settings:checkout';
const CHECKOUT_CONFIG_TTL_SECONDS = 60;

/**
 * Implementación concreta de ISystemSettingsRepository usando Kysely.
 *
 * Traduce entre la tabla clave/valor genérica `system_settings` y el
 * contrato fuertemente tipado `SystemSettingsValues`. Este mapeo
 * (camelCase ↔ clave SQL) es la ÚNICA razón de ser de esta clase —
 * ningún Use Case debe conocer las claves SQL.
 *
 * NOTA: la columna `value` es JSONB; `pg`/Kysely ya la deserializa a su
 * tipo JS nativo (number, string, array) automáticamente — no requiere
 * `JSON.parse` manual.
 */
const SETTINGS_KEY_MAP: Record<keyof SystemSettingsValues, string> = {
  freeShippingThreshold: 'free_shipping_threshold',
  minPurchaseAmount: 'min_purchase_amount',
  localShippingCost: 'local_shipping_cost',
  externalShippingCost: 'external_shipping_cost',
  baseState: 'base_state',
  nearbyMunicipalities: 'nearby_municipalities',
};

const DEVELOPER_CODE_HASH_KEY = 'developer_code_hash';

export class SystemSettingsRepository implements ISystemSettingsRepository {
  /**
   * @param cache Cliente Redis para la caché de checkout (BRECHA-16). Se inyecta
   *   desde el Composition Root — el repositorio no crea la conexión.
   */
  constructor(private readonly cache: IORedis) {}

  async getAll(): Promise<SystemSettingsValues> {
    const rows = await db
      .selectFrom('system_settings')
      .select(['key', 'value'])
      .execute();

    const valueByKey = new Map(rows.map((row) => [row.key, row.value]));

    return {
      freeShippingThreshold: Number(valueByKey.get(SETTINGS_KEY_MAP.freeShippingThreshold)),
      minPurchaseAmount: Number(valueByKey.get(SETTINGS_KEY_MAP.minPurchaseAmount)),
      localShippingCost: Number(valueByKey.get(SETTINGS_KEY_MAP.localShippingCost)),
      externalShippingCost: Number(valueByKey.get(SETTINGS_KEY_MAP.externalShippingCost)),
      baseState: String(valueByKey.get(SETTINGS_KEY_MAP.baseState)),
      nearbyMunicipalities: (valueByKey.get(SETTINGS_KEY_MAP.nearbyMunicipalities) as string[]) ?? [],
    };
  }

  async updateMany(settings: UpdateSystemSettingsDTO): Promise<SystemSettingsValues> {
    const entries = Object.entries(settings) as Array<
      [keyof SystemSettingsValues, SystemSettingsValues[keyof SystemSettingsValues]]
    >;

    await db.transaction().execute(async (trx) => {
      for (const [field, value] of entries) {
        if (value === undefined) continue;

        await trx
          .updateTable('system_settings')
          .set({ value: JSON.stringify(value), updated_at: new Date() })
          .where('key', '=', SETTINGS_KEY_MAP[field])
          .execute();
      }
    });

    // BRECHA-16: invalidar la caché para que el cambio de tarifas del admin
    // aplique de inmediato en el checkout, sin esperar a que expire el TTL.
    try {
      await this.cache.del(CHECKOUT_CONFIG_CACHE_KEY);
    } catch (err) {
      console.error('[SystemSettingsRepository] No se pudo invalidar la caché de checkout:', err);
    }

    return this.getAll();
  }

  async getCheckoutConfig(): Promise<SystemSettingsValues> {
    // 1. Intentar la caché (TTL corto).
    try {
      const cached = await this.cache.get(CHECKOUT_CONFIG_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as SystemSettingsValues;
      }
    } catch (err) {
      // Un fallo de caché nunca debe romper el checkout: se cae a la BD.
      console.error('[SystemSettingsRepository] Error leyendo caché de checkout:', err);
    }

    // 2. Miss: leer de BD y repoblar la caché con TTL.
    const config = await this.getAll();
    try {
      await this.cache.set(CHECKOUT_CONFIG_CACHE_KEY, JSON.stringify(config), 'EX', CHECKOUT_CONFIG_TTL_SECONDS);
    } catch (err) {
      console.error('[SystemSettingsRepository] Error escribiendo caché de checkout:', err);
    }
    return config;
  }

  async getDeveloperCodeHash(): Promise<string | null> {
    const row = await db
      .selectFrom('system_settings')
      .select('value')
      .where('key', '=', DEVELOPER_CODE_HASH_KEY)
      .executeTakeFirst();

    if (!row) return null;
    return row.value as string;
  }

  async getDonationMinAmount(): Promise<number> {
    const row = await db
      .selectFrom('system_settings')
      .select('value')
      .where('key', '=', 'donation_min_amount')
      .executeTakeFirst();

    if (!row) return 10;
    return Number(row.value);
  }

  async getGamificationConfig(): Promise<GamificationConfig> {
    const rows = await db
      .selectFrom('system_settings')
      .select(['key', 'value'])
      .where('key', 'in', [
        'xp_per_currency',
        'tier_silver_threshold',
        'tier_gold_threshold',
        'tier_platinum_threshold',
      ])
      .execute();

    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    // Fallbacks defensivos por si la migración 015 aún no se aplicó.
    return {
      xpPerCurrency: byKey.has('xp_per_currency') ? Number(byKey.get('xp_per_currency')) : 1,
      silverThreshold: byKey.has('tier_silver_threshold') ? Number(byKey.get('tier_silver_threshold')) : 500,
      goldThreshold: byKey.has('tier_gold_threshold') ? Number(byKey.get('tier_gold_threshold')) : 2000,
      platinumThreshold: byKey.has('tier_platinum_threshold') ? Number(byKey.get('tier_platinum_threshold')) : 5000,
    };
  }

  async getTierShippingMultiplier(tier: string): Promise<number> {
    // BRONZE (o desconocido) no tiene descuento logístico: multiplicador 1.0.
    const keyByTier: Record<string, string> = {
      SILVER: 'tier_shipping_multiplier_silver',
      GOLD: 'tier_shipping_multiplier_gold',
      PLATINUM: 'tier_shipping_multiplier_platinum',
    };
    const key = keyByTier[tier];
    if (!key) return 1.0;

    const row = await db
      .selectFrom('system_settings')
      .select('value')
      .where('key', '=', key)
      .executeTakeFirst();

    if (!row) return 1.0;
    const value = Number(row.value);
    // Guardia: un multiplicador inválido nunca debe encarecer/anular el envío.
    return Number.isFinite(value) && value > 0 && value <= 1 ? value : 1.0;
  }

  async setDeveloperCodeHash(hash: string): Promise<void> {
    // Upsert: la clave existe desde la migración 009, pero usamos onConflict
    // por robustez ante entornos donde se haya limpiado.
    await db
      .insertInto('system_settings')
      .values({ key: DEVELOPER_CODE_HASH_KEY, value: JSON.stringify(hash) })
      .onConflict((oc) =>
        oc.column('key').doUpdateSet({ value: JSON.stringify(hash), updated_at: new Date() })
      )
      .execute();
  }
}
