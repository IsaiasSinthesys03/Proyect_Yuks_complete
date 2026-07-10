import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { ProductNotFoundAdminError } from '../../../../domain/errors/ProductAdminErrors';

export class SoftDeleteProductUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(id: string, context: AdminAuditContext): Promise<void> {
    const deleted = await this.repo.softDelete(id, context);
    if (!deleted) throw new ProductNotFoundAdminError(id);
  }
}
