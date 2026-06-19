/**
 * Entidad de Dominio: Product
 *
 * Representa un producto del catálogo e-commerce Animayuks.
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 *
 * Campos clave de negocio:
 *   - isDeleted: Soft Delete. Los productos nunca se eliminan físicamente (REQ SRS).
 *   - version: Optimistic Concurrency Control (OCC). Previene colisiones de edición
 *     simultánea entre administradores del CMS (CMS-BE-02).
 *   - hasVirtualReward: Indica si la compra de este producto genera un código UUID
 *     canjeable en el videojuego Animayuks (Game Bridge REQ-BE-05).
 */
export interface Product {
  readonly id: string;
  readonly categoryId: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly hasVirtualReward: boolean;
  readonly isDeleted: boolean;
  readonly version: number;
  readonly imageUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Producto enriquecido con el nombre de su categoría.
 *
 * Se usa en las respuestas del catálogo público donde el cliente
 * necesita ver "Playeras" en lugar del UUID de la categoría.
 */
export interface ProductWithCategory extends Product {
  readonly categoryName: string;
}
