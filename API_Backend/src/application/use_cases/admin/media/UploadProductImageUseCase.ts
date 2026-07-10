import * as crypto from 'crypto';
import sharp from 'sharp';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { IMediaStorageService } from '../../../interfaces/IMediaStorageService';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { ProductNotFoundAdminError } from '../../../../domain/errors/ProductAdminErrors';
import {
  UnsupportedMediaTypeError,
  ImageProcessingError,
  StorageServiceError,
} from '../../../../domain/errors/MediaErrors';

/**
 * Tipos MIME aceptados. Todos los demás — incluyendo SVG — son rechazados.
 *
 * SVG está EXPLÍCITAMENTE PROHIBIDO: puede contener JavaScript embebido,
 * referencias externas y scripts que se ejecutan si el navegador lo renderiza
 * directamente desde una URL pública de S3.
 */
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Dimensión máxima de cualquier lado antes del resize. Defensa anti-decompression-bomb. */
const MAX_INPUT_DIMENSION_PX = 8_000;

/** Dimensión de salida uniforme: cuadrado 1080×1080 WEBP. */
const OUTPUT_SIZE_PX = 1080;

/**
 * Caso de Uso: Subir imagen de producto con pipeline de seguridad completo.
 *
 * Cadena de defensa en profundidad:
 *   1. Verificar que el producto existe (antes de tocar el archivo).
 *   2. Detectar tipo real por magic number (file-type) — NO por extensión.
 *   3. Rechazar SVG y cualquier no-imagen explícitamente.
 *   4. Procesar con sharp (failOn:'error') → anti-decompression-bomb.
 *   5. Rechazar si dimensiones > MAX_INPUT_DIMENSION_PX.
 *   6. Redimensionar a OUTPUT_SIZE_PX × OUTPUT_SIZE_PX WEBP (cover fit).
 *   7. Generar nombre de archivo via crypto.randomUUID() — anti path-traversal.
 *   8. Subir buffer final al servicio de almacenamiento.
 *   9. Actualizar product.image_url en BD con contexto de auditoría.
 *
 * El buffer recibido ya fue limitado por @fastify/multipart (8 MB).
 * Este use case no conoce Fastify, S3 SDK ni Kysely.
 */
export class UploadProductImageUseCase {
  constructor(
    private readonly adminProductRepo: IAdminProductRepository,
    private readonly mediaStorage: IMediaStorageService,
  ) {}

  async execute(
    productId: string,
    fileBuffer: Buffer,
    context: AdminAuditContext,
  ): Promise<{ imageUrl: string }> {

    // ── Paso 1: Verificar existencia del producto ──────────────────────────
    const product = await this.adminProductRepo.findById(productId);
    if (!product) throw new ProductNotFoundAdminError(productId);

    // ── Paso 2 & 3: Magic number — validación de tipo real ─────────────────
    const detected = await fileTypeFromBuffer(fileBuffer);
    const mimeType = detected?.mime ?? 'application/octet-stream';

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      // 'image/svg+xml' cae aquí explícitamente — no necesita caso especial.
      throw new UnsupportedMediaTypeError(mimeType);
    }

    // ── Paso 4 & 5: Anti-decompression bomb con sharp ─────────────────────
    let processedBuffer: Buffer;
    try {
      // `failOn: 'error'` hace que sharp lance excepción ante cualquier
      // anomalía de formato (cabeceras mal formadas, chunks IDAT corruptos, etc.).
      const image = sharp(fileBuffer, { failOn: 'error' });

      // Leer metadata ANTES del resize para detectar dimensiones absurdas.
      // Un PNG 8000×8000 con 1-bit-por-pixel pesa ~8MB pero descomprimido
      // ocupa 64 MB — aquí cortamos antes de decodificar completamente.
      const metadata = await image.metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;

      if (width > MAX_INPUT_DIMENSION_PX || height > MAX_INPUT_DIMENSION_PX) {
        throw new ImageProcessingError(
          `Las dimensiones de la imagen (${width}×${height}px) superan el máximo ` +
          `permitido de ${MAX_INPUT_DIMENSION_PX}×${MAX_INPUT_DIMENSION_PX}px.`
        );
      }

      // Resize + conversión a WEBP. `fit: 'cover'` recorta para llenar el cuadrado.
      // `withoutEnlargement: false` asegura que imágenes pequeñas se escalen hacia arriba
      // de forma consistente (canvas uniforme 1080×1080 para el frontend).
      processedBuffer = await image
        .resize(OUTPUT_SIZE_PX, OUTPUT_SIZE_PX, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 85 })
        .toBuffer();

    } catch (err: unknown) {
      // Repasar errores de dominio propios sin envolverlos
      if (err instanceof ImageProcessingError) throw err;
      const message = err instanceof Error ? err.message : 'error desconocido';
      throw new ImageProcessingError(
        `No se pudo procesar el archivo. Puede estar corrupto o contener datos maliciosos. (${message})`
      );
    }

    // ── Paso 7: Nombre seguro — crypto.randomUUID() ──────────────────────
    // Nunca usar el filename original del cliente: previene path-traversal,
    // enumeración de nombres y sobrescritura intencional de archivos ajenos.
    const safeFilename = `${crypto.randomUUID()}.webp`;

    // ── Paso 8: Upload al almacenamiento cloud ───────────────────────────
    let imageUrl: string;
    try {
      imageUrl = await this.mediaStorage.upload(processedBuffer, safeFilename, 'image/webp');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      throw new StorageServiceError(message);
    }

    // ── Paso 9: Persistir URL en BD con auditoría ────────────────────────
    await this.adminProductRepo.updateImageUrl(productId, imageUrl, context);

    return { imageUrl };
  }
}
