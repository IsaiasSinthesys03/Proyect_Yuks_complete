import { FastifyInstance, FastifyReply } from 'fastify';
import { GeographyCatalogService } from '../../services/geography/GeographyCatalogService';

function sendGeographyError(error: unknown, reply: FastifyReply): void {
  const message = error instanceof Error ? error.message : 'No se pudo consultar el catálogo geográfico.';
  const statusCode = message.includes('no es válido') || message.includes('no existe') ? 400 : 503;
  reply.status(statusCode).send({
    statusCode,
    error: statusCode === 400 ? 'Bad Request' : 'Service Unavailable',
    message,
  });
}

export function buildGeographyRoutes(service: GeographyCatalogService) {
  return async function geographyRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get('/countries', async (_request, reply) => {
      try {
        return reply.send({ statusCode: 200, data: await service.listCountries() });
      } catch (error) {
        return sendGeographyError(error, reply);
      }
    });

    fastify.get('/countries/:countryCode/states', async (request, reply) => {
      try {
        const { countryCode } = request.params as { countryCode: string };
        return reply.send({ statusCode: 200, data: await service.listStates(countryCode) });
      } catch (error) {
        return sendGeographyError(error, reply);
      }
    });

    fastify.get('/countries/:countryCode/states/:stateCode/cities', async (request, reply) => {
      try {
        const { countryCode, stateCode } = request.params as { countryCode: string; stateCode: string };
        return reply.send({
          statusCode: 200,
          data: await service.listCities(countryCode, decodeURIComponent(stateCode)),
        });
      } catch (error) {
        return sendGeographyError(error, reply);
      }
    });
  };
}
