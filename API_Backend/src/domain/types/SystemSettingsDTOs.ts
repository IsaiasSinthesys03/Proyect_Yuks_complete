/**
 * Data Transfer Objects para Configuración Global del Sistema (CMS-FE-11).
 *
 * Estos campos sustituyen el `DEFAULT_SYSTEM_CONFIG` que vivía hardcodeado
 * en `ProcessCheckoutUseCase` (deuda técnica señalada en la Fase 16/19,
 * cerrada en la Fase 21). El `developer_code_hash` JAMÁS aparece aquí —
 * no se lee ni se actualiza por esta vía.
 */
export interface SystemSettingsValues {
  freeShippingThreshold: number;
  minPurchaseAmount: number;
  localShippingCost: number;
  externalShippingCost: number;
  baseState: string;
  nearbyMunicipalities: string[];
}

/** Payload de actualización parcial — solo se modifican los campos presentes. */
export type UpdateSystemSettingsDTO = Partial<SystemSettingsValues>;

/**
 * Configuración de gamificación (Fase 31, REQ-FE-14). Vive en `system_settings`
 * para que el admin ajuste el ritmo de progresión sin desplegar código.
 */
export interface GamificationConfig {
  /** XP otorgado por cada unidad monetaria efectivamente pagada. */
  xpPerCurrency: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
}
