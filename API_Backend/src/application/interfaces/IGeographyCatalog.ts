export interface IGeographyCatalog {
  isValidLocation(countryCode: string, stateName: string, municipality: string): Promise<boolean>;
}
