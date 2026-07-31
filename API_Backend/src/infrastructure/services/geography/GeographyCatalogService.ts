import { gunzipSync } from 'node:zlib';
import { IGeographyCatalog } from '../../../application/interfaces/IGeographyCatalog';

interface CityRecord {
  name: string;
}

interface StateRecord {
  name: string;
  iso2?: string | null;
  iso3166_2?: string | null;
  cities?: CityRecord[];
}

interface CountryRecord {
  name: string;
  iso2: string;
  states?: StateRecord[];
}

const RELEASES_API =
  'https://api.github.com/repos/dr5hn/countries-states-cities-database/releases?per_page=10';
const FALLBACK_DATASET =
  'https://github.com/dr5hn/countries-states-cities-database/releases/download/v3.1-export.2/json-countries%2Bstates%2Bcities.json.gz';
const DATASET_ASSET = 'json-countries+states+cities.json.gz';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class GeographyCatalogService implements IGeographyCatalog {
  private countries: CountryRecord[] | null = null;
  private loadedAt = 0;
  private loading: Promise<CountryRecord[]> | null = null;

  async listCountries(): Promise<Array<{ code: string; name: string }>> {
    const countries = await this.getCountries();
    return countries
      .map((country) => ({ code: country.iso2, name: country.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async listStates(countryCode: string): Promise<Array<{ code: string; name: string }>> {
    const country = await this.findCountry(countryCode);
    return (country.states ?? [])
      .map((state) => ({
        code: state.iso2 || state.iso3166_2 || state.name,
        name: state.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async listCities(countryCode: string, stateCode: string): Promise<string[]> {
    const country = await this.findCountry(countryCode);
    const normalizedStateCode = stateCode.trim().toUpperCase();
    const state = (country.states ?? []).find((candidate) =>
      [candidate.iso2, candidate.iso3166_2, candidate.name]
        .filter(Boolean)
        .some((value) => String(value).trim().toUpperCase() === normalizedStateCode)
    );

    if (!state) throw new Error('La región solicitada no existe en el país seleccionado.');

    return [...new Set((state.cities ?? []).map((city) => city.name.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'));
  }

  async isValidLocation(countryCode: string, stateName: string, municipality: string): Promise<boolean> {
    const country = await this.findCountry(countryCode);
    const normalizedState = this.normalize(stateName);
    const state = (country.states ?? []).find((candidate) => this.normalize(candidate.name) === normalizedState);
    if (!state) return false;
    const normalizedMunicipality = this.normalize(municipality);
    return (state.cities ?? []).some((city) => this.normalize(city.name) === normalizedMunicipality);
  }

  private async findCountry(countryCode: string): Promise<CountryRecord> {
    const normalizedCode = countryCode.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCode)) throw new Error('El código de país no es válido.');
    const country = (await this.getCountries()).find((candidate) => candidate.iso2 === normalizedCode);
    if (!country) throw new Error('El país solicitado no existe en el catálogo geográfico.');
    return country;
  }

  private async getCountries(): Promise<CountryRecord[]> {
    if (this.countries && Date.now() - this.loadedAt < CACHE_TTL_MS) return this.countries;
    if (!this.loading) {
      this.loading = this.downloadDataset().finally(() => {
        this.loading = null;
      });
    }
    return this.loading;
  }

  private normalize(value: string): string {
    return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  }

  private async downloadDataset(): Promise<CountryRecord[]> {
    let datasetUrl = FALLBACK_DATASET;

    try {
      const releasesResponse = await fetch(RELEASES_API, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Animayuks-Geography/1.0' },
        signal: AbortSignal.timeout(10_000),
      });
      if (releasesResponse.ok) {
        const releases = await releasesResponse.json() as Array<{
          assets?: Array<{ name?: string; browser_download_url?: string }>;
        }>;
        const asset = releases
          .flatMap((release) => release.assets ?? [])
          .find((candidate) => candidate.name === DATASET_ASSET);
        if (asset?.browser_download_url) datasetUrl = asset.browser_download_url;
      }
    } catch {
      // El release fijado permite seguir operando si GitHub limita su API.
    }

    const datasetResponse = await fetch(datasetUrl, {
      headers: { 'User-Agent': 'Animayuks-Geography/1.0' },
      signal: AbortSignal.timeout(60_000),
    });
    if (!datasetResponse.ok) {
      throw new Error(`El proveedor geográfico respondió HTTP ${datasetResponse.status}.`);
    }

    const compressed = Buffer.from(await datasetResponse.arrayBuffer());
    const parsed = JSON.parse(gunzipSync(compressed).toString('utf8')) as CountryRecord[];
    if (!Array.isArray(parsed) || parsed.length < 200) {
      throw new Error('El proveedor geográfico devolvió un catálogo incompleto.');
    }

    this.countries = parsed;
    this.loadedAt = Date.now();
    return parsed;
  }
}
