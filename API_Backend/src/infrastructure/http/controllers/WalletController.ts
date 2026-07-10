import { FastifyRequest, FastifyReply } from 'fastify';
import { GetWalletUseCase } from '../../../application/use_cases/wallet/GetWalletUseCase';
import { GetWalletLedgerUseCase } from '../../../application/use_cases/wallet/GetWalletLedgerUseCase';

/**
 * Controlador HTTP del Monedero Virtual (REQ-FE-20).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 */
export class WalletController {
  constructor(
    private readonly getWalletUseCase: GetWalletUseCase,
    private readonly getWalletLedgerUseCase: GetWalletLedgerUseCase
  ) {}

  /** GET /api/profile/wallet */
  async getSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const summary = await this.getWalletUseCase.execute(userId);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Resumen del monedero obtenido exitosamente.',
        data: summary,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** GET /api/profile/wallet/transactions */
  async getLedger(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const query = request.query as Record<string, string | undefined>;
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 10;

      const ledger = await this.getWalletLedgerUseCase.execute(userId, page, limit);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Historial del monedero obtenido exitosamente.',
        data: ledger,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    console.error('❌ Error inesperado en WalletController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
