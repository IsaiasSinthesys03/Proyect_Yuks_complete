import { Address } from '../entities/Address';
import { SystemSettingsValues } from '../types/SystemSettingsDTOs';

export const CONTINENT_CODES = ['AF', 'AS', 'EU', 'NA', 'SA', 'OC', 'AN'] as const;
export type ContinentCode = typeof CONTINENT_CODES[number];

export interface BlockedShippingRegion {
  countryCode: string;
  region: string;
}

// ISO-3166-1 alpha-2 agrupado por continente. Rusia se clasifica en Europa;
// Turquía, Chipre, Armenia, Azerbaiyán, Georgia y Kazajistán en Asia.
const COUNTRIES_BY_CONTINENT: Record<ContinentCode, readonly string[]> = {
  AF: ['DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CD','CG','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW','EH'],
  AS: ['AF','AM','AZ','BH','BD','BT','BN','KH','CN','CY','GE','IN','ID','IR','IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MY','MV','MN','MM','NP','KP','OM','PK','PS','PH','QA','SA','SG','KR','LK','SY','TW','TJ','TH','TL','TR','TM','AE','UZ','VN','YE','HK','MO'],
  EU: ['AL','AD','AT','BY','BE','BA','BG','HR','CZ','DK','EE','FI','FR','DE','GR','VA','HU','IS','IE','IT','LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE','CH','UA','GB','GI','FO','GG','IM','JE','AX'],
  NA: ['AG','BS','BB','BZ','CA','CR','CU','DM','DO','SV','GD','GT','HT','HN','JM','MX','NI','PA','KN','LC','VC','TT','US','GL','BM','PM','AI','AW','BQ','CW','GP','MQ','MS','PR','SX','TC','VG','VI','KY'],
  SA: ['AR','BO','BR','CL','CO','EC','GY','PY','PE','SR','UY','VE','FK','GF'],
  OC: ['AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU','AS','CK','GU','NC','NU','NF','MP','PF','PN','TK','UM','WF'],
  AN: ['AQ','BV','GS','HM','TF'],
};

const continentByCountry = new Map<string, ContinentCode>(
  Object.entries(COUNTRIES_BY_CONTINENT).flatMap(([continent, countries]) =>
    countries.map((country) => [country, continent as ContinentCode] as const)
  )
);

export const normalizeCountryCode = (value: string | undefined): string => {
  const normalized = (value || 'MX').trim().toUpperCase();
  if (normalized === 'MÉXICO' || normalized === 'MEXICO') return 'MX';
  return normalized;
};

export const isKnownCountryCode = (value: string | undefined): boolean =>
  continentByCountry.has(normalizeCountryCode(value));

const normalizeRegion = (value: string): string =>
  value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX');

export function validateShippingCoverageSettings(settings: Partial<SystemSettingsValues>): void {
  if (settings.blockedContinents) {
    const invalid = settings.blockedContinents.find((code) => !CONTINENT_CODES.includes(code as ContinentCode));
    if (invalid) throw new Error(`Código de continente no válido: ${invalid}.`);
  }
  if (settings.blockedCountries) {
    const invalid = settings.blockedCountries.find((code) => !/^[A-Z]{2}$/.test(code));
    if (invalid) throw new Error(`Código de país no válido: ${invalid}. Usa ISO-3166-1 alpha-2.`);
  }
  if (settings.blockedRegions) {
    const invalid = settings.blockedRegions.find(
      (item) => !/^[A-Z]{2}$/.test(item.countryCode) || !item.region?.trim()
    );
    if (invalid) throw new Error('Cada región bloqueada debe incluir un país ISO válido y un nombre.');
  }
  if (settings.shippingUnavailableMessage !== undefined) {
    const length = settings.shippingUnavailableMessage.trim().length;
    if (length < 20 || length > 500) {
      throw new Error('El mensaje de zona no disponible debe tener entre 20 y 500 caracteres.');
    }
  }
}

export function evaluateShippingCoverage(
  address: Address,
  settings: SystemSettingsValues
): { available: true } | { available: false; reason: 'CONTINENT' | 'COUNTRY' | 'REGION'; message: string } {
  const countryCode = normalizeCountryCode(address.country);
  const continent = continentByCountry.get(countryCode);
  const region = normalizeRegion(address.state);

  const blockedRegion = settings.blockedRegions.some(
    (item) => normalizeCountryCode(item.countryCode) === countryCode && normalizeRegion(item.region) === region
  );
  if (blockedRegion) {
    return { available: false, reason: 'REGION', message: settings.shippingUnavailableMessage };
  }
  if (settings.blockedCountries.includes(countryCode)) {
    return { available: false, reason: 'COUNTRY', message: settings.shippingUnavailableMessage };
  }
  if (continent && settings.blockedContinents.includes(continent)) {
    return { available: false, reason: 'CONTINENT', message: settings.shippingUnavailableMessage };
  }
  return { available: true };
}
