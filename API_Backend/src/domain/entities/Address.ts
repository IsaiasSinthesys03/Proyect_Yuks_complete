/**
 * Entidad de Dominio: Address
 *
 * Representa una dirección de envío en la libreta del usuario (REQ-FE-09, REQ-FE-17).
 * Soporta múltiples direcciones por usuario con marcación de "Predeterminada".
 *
 * Los campos `municipality` y `state` provienen de menús desplegables (Selects),
 * no de texto libre, garantizando match exacto con el Motor de Enrutamiento (REQ-BE-07).
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface Address {
  readonly id: string;
  readonly userId: string;
  readonly label: string;
  readonly street: string;
  readonly exteriorNumber: string;
  readonly interiorNumber: string | null;
  readonly neighborhood: string;
  readonly postalCode: string;
  readonly municipality: string;
  readonly state: string;
  readonly country: string;
  readonly references: string | null;
  readonly isDefault: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
