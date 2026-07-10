import { FastifyRequest, FastifyReply } from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware de Filtrado de IPs (Q22 — Simulación de Intranet).
 *
 * El SRS exige que el CMS opere en una red restringida. Como el backend
 * administrativo comparte el mismo proceso Fastify expuesto a internet
 * (monorepo, Q22), esta restricción se simula filtrando `request.ip`
 * contra una allowlist configurada por variable de entorno.
 *
 * SE EJECUTA PRIMERO en la cadena de middlewares administrativos —
 * rechazar por IP antes de verificar la firma JWT evita gastar ciclos de
 * criptografía en tráfico que ni siquiera debería tocar esta ruta.
 *
 * COMPORTAMIENTO "FAIL CLOSED" EN PRODUCCIÓN: si `ADMIN_ALLOWED_IPS` no
 * está configurada y `NODE_ENV === 'production'`, se rechaza TODO el
 * tráfico (es preferible un panel inoperable a uno abierto al mundo por
 * un error de configuración). Fuera de producción, se permite con una
 * advertencia ruidosa en logs, para no bloquear el desarrollo local.
 */
function getAllowedIps(): string[] {
  return (process.env.ADMIN_ALLOWED_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
}

export async function ipAllowlistMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const allowedIps = getAllowedIps();

  if (allowedIps.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(503).send({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'El Panel Administrativo no está configurado correctamente (ADMIN_ALLOWED_IPS ausente).',
      });
    }

    console.warn(
      '⚠️  ADMIN_ALLOWED_IPS no configurado — ipAllowlistMiddleware está INACTIVO. ' +
        'Esto solo es aceptable fuera de producción.'
    );
    return;
  }

  if (!allowedIps.includes(request.ip)) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Tu dirección IP no está autorizada para acceder al Panel Administrativo.',
    });
  }
}
