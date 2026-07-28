import { PaginatedResponseDTO } from '../../domain/types/ProductDTOs';
import { InventoryItemDTO, AdminProductListItemDTO } from '../../domain/types/InventoryDTOs';

/**
 * Puerto de lectura del catálogo administrativo (Fase 35).
 * Consultas paginadas server-side para el CMS.
 */
export interface IAdminInventoryRepository {
  /** Monitor Global de Inventario (CMS-FE-16): todas las variantes con su estatus de stock. */
  findAllVariantsPaginated(page: number, limit: number, search?: string, status?: string): Promise<PaginatedResponseDTO<InventoryItemDTO>>;

  /** Listado admin de productos (CMS-FE-06): incluye descontinuados si `includeDeleted`. */
  findAllProductsPaginated(page: number, limit: number, includeDeleted: boolean, search?: string, status?: string): Promise<PaginatedResponseDTO<AdminProductListItemDTO>>;
}
