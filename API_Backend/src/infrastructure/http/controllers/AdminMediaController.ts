import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { UploadProductImageUseCase } from '../../../application/use_cases/admin/media/UploadProductImageUseCase';
import { ProductNotFoundAdminError } from '../../../domain/errors/ProductAdminErrors';
import {
  UnsupportedMediaTypeError,
  FileTooLargeError,
  ImageProcessingError,
  StorageServiceError,
} from '../../../domain/errors/MediaErrors';

/** Límite de tamaño de archivo en MB — se muestra en mensajes de error. */
const MAX_FILE_SIZE_MB = 8;

/**
 * Controlador HTTP para el pipeline de upload de imágenes de productos (Fase 23).
 *
 * Responsabilidades EXCLUSIVAS de esta clase:
 *   1. Leer el archivo multipart del request usando `request.file()`.
 *   2. Detectar si el stream fue truncado por el límite de tamaño (→ 413).
 *   3. Pasar el buffer bruto al use case (toda la validación ocurre allí).
 *   4. Traducir errores de dominio a respuestas HTTP apropiadas.
 *
 * Sin lógica de validación de imagen aquí — pertenece al use case.
 */
export class AdminMediaController {
  constructor(
    private readonly uploadProductImageUseCase: UploadProductImageUseCase,
  ) {}

  /** POST /api/admin/products/:id/image */
  async uploadProductImage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id: productId } = request.params as { id: string };
      const context = request.adminContext!;

      // Leer el primer archivo del request multipart.
      // `@fastify/multipart` fue registrado con `limits.fileSize` en el plugin de rutas.
      const file: MultipartFile | undefined = await request.file();

      if (!file) {
        return void reply
          .status(400)
          .send({ success: false, error: 'Se requiere un archivo de imagen en el campo "image".' });
      }

      // Leer el stream completo a memoria. Si el tamaño supera el límite configurado
      // en @fastify/multipart, `file.file.truncated` será `true` después del toBuffer().
      const buffer = await file.toBuffer();

      if (file.file.truncated) {
        throw new FileTooLargeError(MAX_FILE_SIZE_MB);
      }

      const result = await this.uploadProductImageUseCase.execute(productId, buffer, context);

      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof FileTooLargeError) {
      return void reply.status(413).send({ success: false, error: err.message });
    }
    if (err instanceof UnsupportedMediaTypeError) {
      return void reply.status(415).send({ success: false, error: err.message });
    }
    if (err instanceof ImageProcessingError) {
      return void reply.status(422).send({ success: false, error: err.message });
    }
    if (err instanceof ProductNotFoundAdminError) {
      return void reply.status(404).send({ success: false, error: err.message });
    }
    if (err instanceof StorageServiceError) {
      return void reply.status(503).send({ success: false, error: err.message });
    }
    console.error('[AdminMediaController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
