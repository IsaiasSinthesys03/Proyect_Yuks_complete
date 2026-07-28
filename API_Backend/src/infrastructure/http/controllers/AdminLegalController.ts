import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import {
  ListLegalDocumentsUseCase,
  GetLegalDocumentUseCase,
  UpdateLegalDocumentUseCase,
} from '../../../application/use_cases/admin/legal/LegalDocumentUseCases';
import { UploadLegalPdfUseCase } from '../../../application/use_cases/admin/legal/UploadLegalPdfUseCase';
import { UpdateLegalDocumentDTO } from '../../../domain/types/LegalDocumentDTOs';
import { InvalidLegalPdfError, LegalDocumentNotFoundError } from '../../../domain/errors/LegalDocumentErrors';
import { FileTooLargeError, StorageServiceError } from '../../../domain/errors/MediaErrors';

/** Controlador CMS de Textos Legales (Fase 30). */
export class AdminLegalController {
  constructor(
    private readonly listDocs: ListLegalDocumentsUseCase,
    private readonly getDoc: GetLegalDocumentUseCase,
    private readonly updateDoc: UpdateLegalDocumentUseCase,
    private readonly uploadPdf: UploadLegalPdfUseCase,
  ) {}

  async list(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const docs = await this.listDocs.execute();
    reply.status(200).send({ success: true, data: docs });
  }

  async uploadDocumentPdf(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { slug } = request.params as { slug: string };
      const file: MultipartFile | undefined = await request.file();
      if (!file) {
        return void reply.status(400).send({ success: false, error: 'Se requiere un PDF en el campo "file".' });
      }

      const buffer = await file.toBuffer();
      if (file.file.truncated) throw new FileTooLargeError(8);

      const document = await this.uploadPdf.execute(slug, buffer, request.adminContext!);
      reply.status(200).send({ success: true, data: document });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { slug } = request.params as { slug: string };
      const doc = await this.getDoc.execute(slug);
      reply.status(200).send({ success: true, data: doc });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { slug } = request.params as { slug: string };
      const doc = await this.updateDoc.execute(slug, request.body as UpdateLegalDocumentDTO, request.adminContext!);
      reply.status(200).send({ success: true, data: doc });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof LegalDocumentNotFoundError) {
      return void reply.status(404).send({ success: false, error: err.message });
    }
    if (err instanceof InvalidLegalPdfError) {
      return void reply.status(415).send({ success: false, error: err.message });
    }
    if (err instanceof FileTooLargeError) {
      return void reply.status(413).send({ success: false, error: err.message });
    }
    if (err instanceof StorageServiceError) {
      return void reply.status(503).send({ success: false, error: err.message });
    }
    console.error('[AdminLegalController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
