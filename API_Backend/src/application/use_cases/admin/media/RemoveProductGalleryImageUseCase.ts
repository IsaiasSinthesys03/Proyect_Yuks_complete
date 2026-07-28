import { IAdminProductRepository } from '../../../../application/interfaces/IAdminProductRepository';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { db } from '../../../../infrastructure/database/client';
import { sql } from 'kysely';

export class RemoveProductGalleryImageUseCase {
  constructor(
    private readonly repository: IAdminProductRepository
  ) {}

  async execute(
    productId: string,
    imageUrlToRemove: string,
    audit: AdminAuditContext
  ): Promise<void> {
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new Error('Producto no encontrado.');
    }

    const newGalleryUrls = product.galleryUrls.filter(url => url !== imageUrlToRemove);

    if (newGalleryUrls.length === product.galleryUrls.length) {
      // La imagen no estaba en la galería, no hay nada que hacer
      return;
    }

    await db.transaction().execute(async (trx) => {
      await sql`SELECT set_config('app.current_admin_id', ${audit.adminId}, true)`.execute(trx);
      await sql`SELECT set_config('app.current_admin_ip', ${audit.ip}, true)`.execute(trx);

      const result = await trx
        .updateTable('products')
        .set({
          gallery_urls: JSON.stringify(newGalleryUrls) as any,
          version: product.version + 1,
          updated_at: new Date()
        })
        .where('id', '=', productId)
        .where('version', '=', product.version)
        .executeTakeFirst();

      if (result.numUpdatedRows === 0n) {
        throw new Error('El producto fue modificado por otro administrador. Recarga e intenta de nuevo.');
      }
    });
  }
}
