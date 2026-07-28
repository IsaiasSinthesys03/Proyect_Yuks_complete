import { FastifyRequest, FastifyReply } from 'fastify';
import { ProcessDonationUseCase } from '../../../application/use_cases/donations/ProcessDonationUseCase';
import { GetMyDonationsUseCase } from '../../../application/use_cases/donations/GetMyDonationsUseCase';
import {
  DonationAmountTooLowError,
  DonationAlreadyProcessedError,
} from '../../../domain/errors/DonationErrors';

/**
 * Controlador HTTP público de Donaciones (REQ-BE-09).
 *
 * El endpoint es completamente público: no exige JWT de usuario.
 * La seguridad anti-fraude la garantiza Stripe (3D Secure + firma de webhook).
 */
export class DonationController {
  constructor(
    private readonly processDonationUseCase: ProcessDonationUseCase,
    private readonly getMyDonationsUseCase: GetMyDonationsUseCase
  ) {}

  /** POST /api/donate */
  async donate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = request.body as {
        amount: number;
        donorEmail: string;
        idempotencyKey: string;
      };

      if (!body.amount || !body.donorEmail || !body.idempotencyKey) {
        return void reply.status(400).send({
          success: false,
          error: 'Los campos amount, donorEmail e idempotencyKey son obligatorios.',
        });
      }

      const result = await this.processDonationUseCase.execute({
        amount: body.amount,
        donorEmail: body.donorEmail,
        idempotencyKey: body.idempotencyKey,
        userId: request.user?.sub,
      });

      reply.status(201).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** GET /api/profile/donations */
  async listMine(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as { page?: string; limit?: string };
      const result = await this.getMyDonationsUseCase.execute(
        request.user!.sub,
        Number(query.page) || 1,
        Number(query.limit) || 20
      );
      reply.send({ success: true, data: result });
    } catch (err) {
      console.error('[DonationController.listMine]', err);
      reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof DonationAmountTooLowError) {
      return void reply.status(422).send({ success: false, error: (err as Error).message });
    }
    if (err instanceof DonationAlreadyProcessedError) {
      return void reply.status(409).send({ success: false, error: (err as Error).message });
    }
    console.error('[DonationController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
