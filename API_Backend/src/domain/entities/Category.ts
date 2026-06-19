/**
 * Entidad de Dominio: Category
 *
 * Representa una categoría del catálogo de productos Animayuks.
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface Category {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
}
