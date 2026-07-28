/**
 * Data Transfer Objects para el módulo de Direcciones (REQ-FE-09, REQ-FE-17).
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * de los Use Cases de direcciones. No contienen lógica de negocio.
 */

/**
 * Payload para crear una nueva dirección.
 *
 * Nota: `municipality` y `state` provienen de menús desplegables (Selects),
 * no de texto libre, para garantizar match exacto con el Motor de
 * Enrutamiento Logístico (REQ-BE-07).
 */
export interface CreateAddressDTO {
  label: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  postalCode: string;
  municipality: string;
  state: string;
  /** ISO-3166-1 alpha-2. Los domicilios históricos y payloads omitidos usan MX. */
  countryCode?: string;
  references?: string;
}

/**
 * Payload para actualizar una dirección existente.
 * Todos los campos son opcionales — solo se actualizan los proporcionados.
 */
export type UpdateAddressDTO = Partial<CreateAddressDTO>;
