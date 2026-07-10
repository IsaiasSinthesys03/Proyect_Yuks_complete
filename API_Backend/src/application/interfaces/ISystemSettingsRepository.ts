import { SystemSettingsValues, UpdateSystemSettingsDTO, GamificationConfig } from '../../domain/types/SystemSettingsDTOs';

/**
 * Puerto (Interfaz) del Repositorio de Configuración Global del Sistema.
 *
 * DECISIÓN DE DISEÑO: aunque la tabla `system_settings` es una estructura
 * clave/valor genérica a nivel SQL (para no requerir una migración nueva
 * cada vez que se agregue un parámetro), esta interfaz expone un contrato
 * FUERTEMENTE TIPADO (`SystemSettingsValues`) — los Use Cases nunca manejan
 * strings de claves SQL ("free_shipping_threshold"), solo campos con nombre.
 * La traducción clave↔campo vive exclusivamente en `SystemSettingsRepository`.
 *
 * `getDeveloperCodeHash` está deliberadamente separado de `getAll()`:
 * el hash del Código de Desarrollador NUNCA debe poder filtrarse a través
 * de un endpoint de lectura general de configuración.
 */
export interface ISystemSettingsRepository {
  getAll(): Promise<SystemSettingsValues>;
  updateMany(settings: UpdateSystemSettingsDTO): Promise<SystemSettingsValues>;

  /**
   * Configuración logística/financiera para el motor de checkout (BRECHA-16).
   *
   * A diferencia de `getAll()` (lectura directa de BD), este método CACHEA el
   * resultado en Redis con un TTL corto. Resuelve la deuda técnica de la config
   * cacheada en memoria al arranque: el checkout lee siempre un valor fresco
   * (a lo sumo con `TTL` segundos de retraso), de modo que un cambio de tarifas
   * en el CMS aplica SIN reiniciar el contenedor. `updateMany` invalida esta
   * caché para que el cambio surta efecto de inmediato.
   */
  getCheckoutConfig(): Promise<SystemSettingsValues>;

  /**
   * Obtiene el hash Argon2id del Código de Desarrollador (Q21).
   * Uso EXCLUSIVO de `RegisterAdminUseCase` para verificación — nunca se
   * expone a través de `getAll()` ni de ningún DTO de respuesta HTTP.
   */
  getDeveloperCodeHash(): Promise<string | null>;

  /**
   * Obtiene el monto mínimo de donación configurable desde el CMS (REQ-BE-09).
   * Retorna el valor de `donation_min_amount` o 10 como fallback.
   */
  getDonationMinAmount(): Promise<number>;

  /**
   * Obtiene la configuración de gamificación (Fase 31): ratio XP↔moneda y
   * umbrales de tier. Usada al confirmar un pago para otorgar XP y recalcular
   * el tier del usuario dinámicamente.
   */
  getGamificationConfig(): Promise<GamificationConfig>;

  /**
   * Reemplaza el hash del Código de Desarrollador (Fase 31). Se invoca solo
   * tras una re-autenticación exitosa del admin (flujo defensivo). Recibe el
   * hash Argon2id ya calculado — nunca el código en claro.
   */
  setDeveloperCodeHash(hash: string): Promise<void>;

  /**
   * Multiplicador del umbral de envío gratis según el tier de lealtad del
   * usuario (Fase 35, REQ-BE-07 / REQ-FE-14). `< 1` reduce el umbral (envío
   * gratis más fácil) para rangos altos. BRONZE (o tier desconocido) → 1.0.
   */
  getTierShippingMultiplier(tier: string): Promise<number>;
}
