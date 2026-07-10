import { FastifyRequest, FastifyReply } from 'fastify';
import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { GenerateReportUseCase } from '../../../application/use_cases/admin/reports/GenerateReportUseCase';
import { InvalidReportTypeError, ReportNotReadyError } from '../../../domain/errors/ReportErrors';
import { reportFilePath, reportFileName } from '../../services/reports/reportPaths';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Controlador de Reportes del CMS (CMS-BE-05, Fase 31).
 *
 * `generate` NO produce el CSV: encola y responde con el jobId (202).
 * `download` sirve el archivo ya generado por el worker. El jobId se valida
 * como UUID antes de construir la ruta → inmune a path traversal.
 */
export class AdminReportController {
  constructor(private readonly generateReportUseCase: GenerateReportUseCase) {}

  /** POST /api/admin/reports  { reportType, format?, startDate?, endDate? } */
  async generate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = request.body as { reportType?: string; format?: string; startDate?: string; endDate?: string };
      const requestedByEmail = request.user?.email ?? 'unknown';

      const result = await this.generateReportUseCase.execute({
        reportType: body.reportType ?? '',
        format: body.format,
        startDate: body.startDate,
        endDate: body.endDate,
        requestedByEmail,
      });

      // 202 Accepted: el trabajo se aceptó y se procesa en segundo plano.
      reply.status(202).send({
        success: true,
        message: 'Reporte en generación. Se te notificará por WebSocket cuando esté listo.',
        data: result,
      });
    } catch (err) {
      if (err instanceof InvalidReportTypeError) {
        return void reply.status(400).send({ success: false, error: err.message });
      }
      console.error('[AdminReportController.generate]', err);
      reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
    }
  }

  /** GET /api/admin/reports/:jobId/download — detecta CSV o JSON. */
  async download(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { jobId } = request.params as { jobId: string };

      // Validación estricta: solo UUIDs → la ruta nunca incorpora entrada libre.
      if (!UUID_REGEX.test(jobId)) {
        return void reply.status(400).send({ success: false, error: 'jobId inválido.' });
      }

      // El worker escribe .csv o .json según el formato pedido: se sirve el que exista.
      const candidates: Array<{ ext: 'csv' | 'json'; contentType: string }> = [
        { ext: 'csv', contentType: 'text/csv; charset=utf-8' },
        { ext: 'json', contentType: 'application/json; charset=utf-8' },
      ];

      for (const { ext, contentType } of candidates) {
        const filePath = reportFilePath(jobId, ext);
        try {
          await fs.access(filePath);
        } catch {
          continue;
        }
        reply
          .header('Content-Type', contentType)
          .header('Content-Disposition', `attachment; filename="${reportFileName(jobId, ext)}"`);
        return reply.send(createReadStream(filePath));
      }

      throw new ReportNotReadyError();
    } catch (err) {
      if (err instanceof ReportNotReadyError) {
        return void reply.status(404).send({ success: false, error: err.message });
      }
      console.error('[AdminReportController.download]', err);
      reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
    }
  }
}
