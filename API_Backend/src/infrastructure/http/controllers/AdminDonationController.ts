import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminListDonationsUseCase } from '../../../application/use_cases/donations/AdminListDonationsUseCase';
import { DonationStatus } from '../../../domain/entities/Donation';

/** Controlador HTTP de Donaciones para el panel CMS (CMS-FE-13) */
export class AdminDonationController {
  constructor(private readonly adminListDonationsUseCase: AdminListDonationsUseCase) {}

  /** GET /api/admin/donations */
  async listDonations(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as {
        status?: string;
        page?:   string;
        limit?:  string;
      };

      const result = await this.adminListDonationsUseCase.execute({
        status: query.status as DonationStatus | undefined,
        page:   query.page  ? parseInt(query.page,  10) : 1,
        limit:  query.limit ? parseInt(query.limit, 10) : 20,
      });

      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      console.error('[AdminDonationController]', err);
      reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
    }
  }
}
