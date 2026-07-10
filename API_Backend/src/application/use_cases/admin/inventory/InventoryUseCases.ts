import { IAdminInventoryRepository } from '../../../interfaces/IAdminInventoryRepository';
import { PaginatedResponseDTO } from '../../../../domain/types/ProductDTOs';
import { InventoryItemDTO, AdminProductListItemDTO } from '../../../../domain/types/InventoryDTOs';

/** Casos de uso de lectura del catálogo administrativo (Fase 35). */

function sanitizePage(page?: number): number { return Math.max(Math.floor(page ?? 1), 1); }
function sanitizeLimit(limit?: number): number { return Math.min(Math.max(Math.floor(limit ?? 20), 1), 100); }

export class GetInventoryMonitorUseCase {
  constructor(private readonly repo: IAdminInventoryRepository) {}
  execute(page?: number, limit?: number): Promise<PaginatedResponseDTO<InventoryItemDTO>> {
    return this.repo.findAllVariantsPaginated(sanitizePage(page), sanitizeLimit(limit));
  }
}

export class ListAdminProductsUseCase {
  constructor(private readonly repo: IAdminInventoryRepository) {}
  execute(page?: number, limit?: number, includeDeleted = false): Promise<PaginatedResponseDTO<AdminProductListItemDTO>> {
    return this.repo.findAllProductsPaginated(sanitizePage(page), sanitizeLimit(limit), includeDeleted);
  }
}
