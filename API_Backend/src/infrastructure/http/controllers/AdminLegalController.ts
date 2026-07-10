import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ListLegalDocumentsUseCase,
  GetLegalDocumentUseCase,
  UpdateLegalDocumentUseCase,
} from '../../../application/use_cases/admin/legal/LegalDocumentUseCases';
import { UpdateLegalDocumentDTO } from '../../../domain/types/LegalDocumentDTOs';
import { LegalDocumentNotFoundError } from '../../../domain/errors/LegalDocumentErrors';

/** Controlador CMS de Textos Legales (Fase 30). */
export class AdminLegalController {
  constructor(
    private readonly listDocs: ListLegalDocumentsUseCase,
    private readonly getDoc: GetLegalDocumentUseCase,
    private readonly updateDoc: UpdateLegalDocumentUseCase,
  ) {}

  async list(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const docs = await this.listDocs.execute();
    reply.status(200).send({ success: true, data: docs });
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
      const doc = await this.updateDoc.execute(slug, request.body as UpdateLegalDocumentDTO);
      reply.status(200).send({ success: true, data: doc });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof LegalDocumentNotFoundError) {
      return void reply.status(404).send({ success: false, error: err.message });
    }
    console.error('[AdminLegalController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
