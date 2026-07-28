import { IAdminProductRepository } from '../../../../application/interfaces/IAdminProductRepository';
import { IMediaStorageService } from '../../../../application/interfaces/IMediaStorageService';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { db } from '../../../../infrastructure/database/client';
import { sql } from 'kysely';

export class UploadProductGalleryImageUseCase {
  constructor(
    private readonly repository: IAdminProductRepository,
    private readonly mediaStorage: IMediaStorageService
  ) {}

  async execute(
    productId: string,
    fileBuffer: Buffer,
    filename: string,
    contentType: string,
    audit: AdminAuditContext
  ): Promise<string> {
    const product = await this.repository.findById(productId);
    if (!product) {
      throw new Error('Producto no encontrado.');
    }

    // El storage service prefija con la ruta adecuada y sube a S3
    const url = await this.mediaStorage.upload(fileBuffer, `gallery/${productId}_${filename}`, contentType);

    const newGalleryUrls = [...product.galleryUrls, url];

    await db.transaction().execute(async (trx) => {
      // 1) Establecer contexto de auditoría
      await sql`SELECT set_config('app.current_admin_id', ${audit.adminId}, true)`.execute(trx);
      await sql`SELECT set_config('app.current_admin_ip', ${audit.ip}, true)`.execute(trx);

      // 2) Actualizar producto
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

    return url;
  }
}
