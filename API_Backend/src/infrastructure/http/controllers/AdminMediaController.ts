import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { UploadProductImageUseCase } from '../../../application/use_cases/admin/media/UploadProductImageUseCase';
import { UploadBannerImageUseCase } from '../../../application/use_cases/admin/media/UploadBannerImageUseCase';
import { UploadBannerVideoUseCase } from '../../../application/use_cases/admin/media/UploadBannerVideoUseCase';
import { UploadDonationBannerUseCase } from '../../../application/use_cases/admin/media/UploadDonationBannerUseCase';
import { UploadProductGalleryImageUseCase } from '../../../application/use_cases/admin/media/UploadProductGalleryImageUseCase';
import { RemoveProductGalleryImageUseCase } from '../../../application/use_cases/admin/media/RemoveProductGalleryImageUseCase';
import { ProductNotFoundAdminError } from '../../../domain/errors/ProductAdminErrors';
import { BannerNotFoundError } from '../../../domain/errors/BannerErrors';
import {
  UnsupportedMediaTypeError,
  FileTooLargeError,
  ImageProcessingError,
  StorageServiceError,
} from '../../../domain/errors/MediaErrors';

/** Límite de tamaño de archivo en MB — se muestra en mensajes de error. */
const MAX_FILE_SIZE_MB = 8;

export class AdminMediaController {
  constructor(
    private readonly uploadProductImageUseCase: UploadProductImageUseCase,
    private readonly uploadBannerImageUseCase: UploadBannerImageUseCase,
    private readonly uploadBannerVideoUseCase: UploadBannerVideoUseCase,
    private readonly uploadDonationBannerUseCase: UploadDonationBannerUseCase,
    private readonly uploadProductGalleryImageUseCase: UploadProductGalleryImageUseCase,
    private readonly removeProductGalleryImageUseCase: RemoveProductGalleryImageUseCase,
  ) {}

  /** POST /api/admin/products/:id/image */
  async uploadProductImage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id: productId } = request.params as { id: string };
      const context = request.adminContext!;

      const file: MultipartFile | undefined = await request.file();

      if (!file) {
        return void reply
          .status(400)
          .send({ success: false, error: 'Se requiere un archivo de imagen en el campo "image".' });
      }

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

  /** POST /api/admin/banners/:id/image */
  async uploadBannerImage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id: bannerId } = request.params as { id: string };
      const context = request.adminContext!;

      const file: MultipartFile | undefined = await request.file();

      if (!file) {
        return void reply
          .status(400)
          .send({ success: false, error: 'Se requiere un archivo de imagen en el campo "image".' });
      }

      const buffer = await file.toBuffer();

      if (file.file.truncated) {
        throw new FileTooLargeError(MAX_FILE_SIZE_MB);
      }

      const result = await this.uploadBannerImageUseCase.execute(bannerId, buffer, context);

      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** POST /api/admin/banners/:id/video */
  async uploadBannerVideo(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id: bannerId } = request.params as { id: string };
      const context = request.adminContext!;

      const file: MultipartFile | undefined = await request.file({
        limits: { fileSize: 50 * 1024 * 1024 } // 50MB for video
      });

      if (!file) {
        return void reply
          .status(400)
          .send({ success: false, error: 'Se requiere un archivo en el campo "video".' });
      }

      const buffer = await file.toBuffer();

      if (file.file.truncated) {
        throw new FileTooLargeError(50); // 50MB
      }

      const result = await this.uploadBannerVideoUseCase.execute(bannerId, buffer, context);

      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** POST /api/admin/products/:id/gallery */
  async uploadProductGalleryImage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id: productId } = request.params as { id: string };
      const context = request.adminContext!;
      const file: MultipartFile | undefined = await request.file();

      if (!file) {
        return void reply
          .status(400)
          .send({ success: false, error: 'Se requiere un archivo de imagen en el campo "image".' });
      }
      const buffer = await file.toBuffer();
      if (file.file.truncated) {
        throw new FileTooLargeError(MAX_FILE_SIZE_MB);
      }
      const result = await this.uploadProductGalleryImageUseCase.execute(productId, buffer, file.filename, file.mimetype, context);
      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** DELETE /api/admin/products/:id/gallery */
  async removeProductGalleryImage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id: productId } = request.params as { id: string };
      const { url } = request.body as { url: string };
      const context = request.adminContext!;

      if (!url) {
        return void reply.status(400).send({ success: false, error: 'Se requiere la URL de la imagen a eliminar.' });
      }

      await this.removeProductGalleryImageUseCase.execute(productId, url, context);
      reply.status(200).send({ success: true });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** Manejo centralizado de errores para Media. */
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
  /** POST /api/admin/media/donation-banner */
  async uploadDonationBanner(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = request.adminContext!;
      const file: MultipartFile | undefined = await request.file();

      if (!file) {
        return void reply
          .status(400)
          .send({ success: false, error: 'Se requiere un archivo de imagen en el campo "image".' });
      }

      const buffer = await file.toBuffer();

      if (file.file.truncated) {
        throw new FileTooLargeError(MAX_FILE_SIZE_MB);
      }

      const result = await this.uploadDonationBannerUseCase.execute(buffer, context);

      return void reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      if (err instanceof UnsupportedMediaTypeError) {
        return void reply.status(415).send({ success: false, error: err.message });
      }
      if (err instanceof FileTooLargeError || err instanceof ImageProcessingError) {
        return void reply.status(400).send({ success: false, error: err.message });
      }
      if (err instanceof StorageServiceError) {
        return void reply.status(502).send({ success: false, error: err.message });
      }

      console.error('[AdminMediaController] Error en uploadDonationBanner:', err);
      return void reply.status(500).send({
        success: false,
        error: 'Ocurrió un error inesperado al subir el banner de donación.',
      });
    }
  }

}
