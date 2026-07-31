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
  vatPercentage: 'vat_percentage',
  baseState: 'base_state',
  nearbyMunicipalities: 'nearby_municipalities',
  donationMinAmount: 'donation_min_amount',
  donationQuickAmounts: 'donation_quick_amounts',
  donationBannerUrl: 'donation_banner_url',
  donationTitle: 'donation_title',
  donationDescription: 'donation_description',
  storeAddress: 'store_address',
  localEta: 'local_eta',
  blockedContinents: 'blocked_shipping_continents',
  blockedCountries: 'blocked_shipping_countries',
  blockedRegions: 'blocked_shipping_regions',
  shippingUnavailableMessage: 'shipping_unavailable_message',
  socialFacebookUrl: 'social_facebook_url',
  socialInstagramUrl: 'social_instagram_url',
  socialTwitterUrl: 'social_twitter_url',
  supportWhatsapp: 'support_whatsapp',
  supportEmail: 'support_email',
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
      vatPercentage: Number(valueByKey.get(SETTINGS_KEY_MAP.vatPercentage) ?? 16),
      baseState: String(valueByKey.get(SETTINGS_KEY_MAP.baseState)),
      nearbyMunicipalities: (valueByKey.get(SETTINGS_KEY_MAP.nearbyMunicipalities) as string[]) ?? [],
      donationMinAmount: Number(valueByKey.get(SETTINGS_KEY_MAP.donationMinAmount) ?? 10),
      donationQuickAmounts: (valueByKey.get(SETTINGS_KEY_MAP.donationQuickAmounts) as number[]) ?? [10, 20, 30],
      donationBannerUrl: valueByKey.get(SETTINGS_KEY_MAP.donationBannerUrl) as string | undefined,
      donationTitle: (valueByKey.get(SETTINGS_KEY_MAP.donationTitle) as string) || 'Apoya el Proyecto',
      donationDescription: (valueByKey.get(SETTINGS_KEY_MAP.donationDescription) as string) || 'Tu aportación nos ayuda a mantener los servidores encendidos. 💖',
      storeAddress: (valueByKey.get(SETTINGS_KEY_MAP.storeAddress) as string) || 'Calle 60 #123 x 45 y 47, Centro, Mérida, Yucatán',
      localEta: (valueByKey.get(SETTINGS_KEY_MAP.localEta) as string) || 'Llega hoy mismo',
      blockedContinents: (valueByKey.get(SETTINGS_KEY_MAP.blockedContinents) as string[]) ?? [],
      blockedCountries: (valueByKey.get(SETTINGS_KEY_MAP.blockedCountries) as string[]) ?? [],
      blockedRegions: (valueByKey.get(SETTINGS_KEY_MAP.blockedRegions) as SystemSettingsValues['blockedRegions']) ?? [],
      shippingUnavailableMessage: (valueByKey.get(SETTINGS_KEY_MAP.shippingUnavailableMessage) as string)
        || 'Lo sentimos, por el momento no podemos realizar entregas en la zona de tu domicilio. Esperamos ampliar nuestra cobertura muy pronto.',
      socialFacebookUrl: (valueByKey.get(SETTINGS_KEY_MAP.socialFacebookUrl) as string) || 'https://facebook.com',
      socialInstagramUrl: (valueByKey.get(SETTINGS_KEY_MAP.socialInstagramUrl) as string) || 'https://instagram.com',
      socialTwitterUrl: (valueByKey.get(SETTINGS_KEY_MAP.socialTwitterUrl) as string) || 'https://twitter.com',
      supportWhatsapp: (valueByKey.get(SETTINGS_KEY_MAP.supportWhatsapp) as string) || '+52 999 123 4567',
      supportEmail: (valueByKey.get(SETTINGS_KEY_MAP.supportEmail) as string) || 'hola@animayuks.com',
    };
  }

  async updateMany(settings: UpdateSystemSettingsDTO): Promise<SystemSettingsValues> {
    const entries = Object.entries(settings) as Array<
      [keyof SystemSettingsValues, SystemSettingsValues[keyof SystemSettingsValues]]
    >;

    await db.transaction().execute(async (trx) => {
      for (const [field, value] of entries) {
        if (value === undefined) continue;

        const key = SETTINGS_KEY_MAP[field];
        if (!key) continue;

        await trx
          .insertInto('system_settings')
          .values({
            key,
            value: JSON.stringify(value),
            updated_at: new Date(),
          })
          .onConflict((oc) =>
            oc.column('key').doUpdateSet({
              value: JSON.stringify(value),
              updated_at: new Date(),
            })
          )
          .execute();
      }
    });

    // BRECHA-16: invalidar la caché para que el cambio de tarifas del admin
    // aplique de inmediato en el checkout, sin esperar a que expire el TTL.
    try {
      if (this.cache.status !== 'ready') {
        throw new Error(`Redis no disponible (estado: ${this.cache.status})`);
      }
      await this.cache.del(CHECKOUT_CONFIG_CACHE_KEY);
    } catch (err) {
      console.error('[SystemSettingsRepository] No se pudo invalidar la caché de checkout:', err);
    }

    return this.getAll();
  }

  async getCheckoutConfig(): Promise<SystemSettingsValues> {
    // 1. Intentar la caché (TTL corto).
    try {
      if (this.cache.status === 'ready') {
        const cached = await this.cache.get(CHECKOUT_CONFIG_CACHE_KEY);
        if (cached) {
          return JSON.parse(cached) as SystemSettingsValues;
        }
      }
    } catch (err) {
      // Un fallo de caché nunca debe romper el checkout: se cae a la BD.
      console.error('[SystemSettingsRepository] Error leyendo caché de checkout:', err);
    }

    // 2. Miss: leer de BD y repoblar la caché con TTL.
    const config = await this.getAll();
    try {
      if (this.cache.status === 'ready') {
        await this.cache.set(CHECKOUT_CONFIG_CACHE_KEY, JSON.stringify(config), 'EX', CHECKOUT_CONFIG_TTL_SECONDS);
      }
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
