import { FastifyRequest, FastifyReply } from 'fastify';
import { ListAllUsersUseCase } from '../../../application/use_cases/admin/users/ListAllUsersUseCase';
import { BanUserUseCase } from '../../../application/use_cases/admin/users/BanUserUseCase';
import { UnbanUserUseCase } from '../../../application/use_cases/admin/users/UnbanUserUseCase';
import { GetAdminUserLedgerUseCase } from '../../../application/use_cases/admin/users/GetAdminUserLedgerUseCase';
import {
  SelfBanNotAllowedError,
  UserNotFoundAdminError,
} from '../../../domain/errors/AdminErrors';

export class AdminUserCrmController {
  constructor(
    private readonly listAllUsersUseCase: ListAllUsersUseCase,
    private readonly getAdminUserLedgerUseCase: GetAdminUserLedgerUseCase,
    private readonly banUserUseCase: BanUserUseCase,
    private readonly unbanUserUseCase: UnbanUserUseCase,
  ) {}

  async listUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as { page?: string; limit?: string };
      const page  = query.page  ? parseInt(query.page,  10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 20;
      const result = await this.listAllUsersUseCase.execute(page, limit);
      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async getLedger(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const query = request.query as { page?: string; limit?: string };
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 20;
      const result = await this.getAdminUserLedgerUseCase.execute(id, page, limit);
      reply.status(200).send({ success: true, data: result });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async banUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const context = request.adminContext!;
      const user = await this.banUserUseCase.execute(id, context);
      reply.status(200).send({ success: true, data: user });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async unbanUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const context = request.adminContext!;
      const user = await this.unbanUserUseCase.execute(id, context);
      reply.status(200).send({ success: true, data: user });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof SelfBanNotAllowedError) {
      return void reply.status(422).send({ success: false, error: (err as Error).message });
    }
    if (err instanceof UserNotFoundAdminError) {
      return void reply.status(404).send({ success: false, error: (err as Error).message });
    }
    console.error('[AdminUserCrmController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
