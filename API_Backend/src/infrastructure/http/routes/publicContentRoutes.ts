import { FastifyInstance } from 'fastify';
import { PublicContentController } from '../controllers/PublicContentController';

/**
 * Rutas Públicas de Contenido (Fase 30) — sin autenticación.
 * Uso: fastify.register(buildPublicContentRoutes(controller), { prefix: '/api/content' });
 */
export function buildPublicContentRoutes(controller: PublicContentController) {
  return async function publicContentRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get('/banners', async (req, reply) => controller.banners(req, reply));
    fastify.get('/home-videos', async (req, reply) => controller.youtubeVideos(req, reply));
    fastify.get('/store-config', async (req, reply) => controller.storeConfig(req, reply));
    fastify.get('/legal/:slug', async (req, reply) => controller.legal(req, reply));
  };
}
