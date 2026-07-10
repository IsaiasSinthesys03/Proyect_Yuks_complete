/**
 * Entidad de Dominio: SystemSetting
 *
 * Representa una fila cruda de la tabla `system_settings` (clave/valor genérico).
 *
 * USO: Esta entidad es de uso interno de `SystemSettingsRepository` para
 * mapear filas SQL. La capa de Application NUNCA opera sobre `SystemSetting`
 * crudo — consume `ISystemSettingsRepository`, cuya interfaz expone un tipo
 * fuertemente tipado (`SystemSettingsValues`) en vez de pares clave/valor
 * genéricos, evitando que los Use Cases manejen strings de claves SQL.
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface SystemSetting {
  readonly id: string;
  readonly key: string;
  readonly value: unknown;
  readonly updatedAt: Date;
}
