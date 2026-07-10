import { FastifyRequest, FastifyReply } from 'fastify';
import { GetAuditLogsUseCase } from '../../../application/use_cases/admin/GetAuditLogsUseCase';
import { AuditAction } from '../../../domain/entities/AuditLog';

/**
 * Controlador HTTP del Visor de Bitácora (CMS-FE-10).
 * NO contiene lógica de negocio.
 */
export class AuditLogController {
  constructor(private readonly getAuditLogsUseCase: GetAuditLogsUseCase) {}

  /** GET /api/admin/audit-logs */
  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as Record<string, string | undefined>;

      const result = await this.getAuditLogsUseCase.execute({
        adminEmail: query.adminEmail,
        action: query.action as AuditAction | undefined,
        entityType: query.entityType,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      });

      return reply.status(200).send({
        statusCode: 200,
        message: 'Bitácora de auditoría obtenida exitosamente.',
        data: result,
      });
    } catch (error) {
      console.error('❌ Error inesperado en AuditLogController:', error);
      reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
      });
    }
  }
}
