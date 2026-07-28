import * as crypto from 'crypto';
import sharp from 'sharp';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { IMediaStorageService } from '../../../interfaces/IMediaStorageService';
import { ISystemSettingsRepository } from '../../../interfaces/ISystemSettingsRepository';
import { IAuditLogRepository } from '../../../interfaces/IAuditLogRepository';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import {
  UnsupportedMediaTypeError,
  ImageProcessingError,
  StorageServiceError,
} from '../../../../domain/errors/MediaErrors';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_INPUT_DIMENSION_PX = 8_000;
const OUTPUT_WIDTH_PX = 800; // Un tamaño adecuado para el header del modal de donaciones
const OUTPUT_HEIGHT_PX = 400; // Aspect ratio 2:1

export class UploadDonationBannerUseCase {
  constructor(
    private readonly systemSettingsRepository: ISystemSettingsRepository,
    private readonly mediaStorage: IMediaStorageService,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(
    fileBuffer: Buffer,
    context: AdminAuditContext,
  ): Promise<{ imageUrl: string }> {
    const detected = await fileTypeFromBuffer(fileBuffer);
    const mimeType = detected?.mime ?? 'application/octet-stream';

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new UnsupportedMediaTypeError(mimeType);
    }

    let processedBuffer: Buffer;
    try {
      const image = sharp(fileBuffer, { failOn: 'error' });
      const metadata = await image.metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;

      if (width > MAX_INPUT_DIMENSION_PX || height > MAX_INPUT_DIMENSION_PX) {
        throw new ImageProcessingError(
          `Las dimensiones de la imagen (${width}×${height}px) superan el máximo ` +
          `permitido de ${MAX_INPUT_DIMENSION_PX}×${MAX_INPUT_DIMENSION_PX}px.`
        );
      }

      processedBuffer = await image
        .resize(OUTPUT_WIDTH_PX, OUTPUT_HEIGHT_PX, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (err: unknown) {
      if (err instanceof ImageProcessingError) throw err;
      const message = err instanceof Error ? err.message : 'error desconocido';
      throw new ImageProcessingError(
        `No se pudo procesar el archivo. Puede estar corrupto o contener datos maliciosos. (${message})`
      );
    }

    const safeFilename = `donation-banner-${crypto.randomUUID()}.webp`;

    let imageUrl: string;
    try {
      imageUrl = await this.mediaStorage.upload(processedBuffer, safeFilename, 'image/webp');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      throw new StorageServiceError(message);
    }

    const previous = await this.systemSettingsRepository.getAll();
    const updated = await this.systemSettingsRepository.updateMany({ donationBannerUrl: imageUrl });
    
    await this.auditLogRepository.write({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'UPDATE',
      entityType: 'system_settings',
      entityId: context.adminId,
      oldValue: { donationBannerUrl: previous.donationBannerUrl },
      newValue: { donationBannerUrl: updated.donationBannerUrl },
      ipAddress: context.ip,
    });

    return { imageUrl };
  }
}
