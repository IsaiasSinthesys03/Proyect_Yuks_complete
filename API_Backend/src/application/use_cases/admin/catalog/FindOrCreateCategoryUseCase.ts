import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { CreateCategoryDTO } from '../../../../domain/types/AdminProductDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { Category } from '../../../../domain/entities/Category';

/**
 * Caso de Uso: Encontrar o Crear una Categoría (idempotente).
 *
 * Si ya existe una categoría con el mismo nombre (case-insensitive),
 * la devuelve sin crear duplicados ni escribir en `audit_logs`.
 * Solo crea (y audita) si realmente no existe.
 */
export class FindOrCreateCategoryUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(dto: CreateCategoryDTO, context: AdminAuditContext): Promise<Category> {
    const existing = await this.repo.findCategoryByName(dto.name);
    if (existing) return existing;

    return this.repo.createCategory(dto.name, context);
  }
}
