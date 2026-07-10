import * as crypto from 'crypto';

/**
 * Utilidades de tokens compartidas por el módulo de autenticación (Fase 29).
 *
 * Vive en la capa de aplicación porque `crypto` es stdlib de Node (no un
 * detalle de infraestructura intercambiable). Centraliza el hashing y la
 * generación de tokens opacos para que ni los Use Cases ni los repositorios
 * dupliquen esta lógica.
 */

/** Genera un token opaco criptográficamente seguro (hex). 48 bytes = 96 chars. */
export function generateOpaqueToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash SHA-256 (hex) de un token. Se almacena el hash, nunca el token crudo:
 * una fuga de la BD no permite reconstruir sesiones ni enlaces de reseteo.
 */
export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Genera un código OTP numérico de N dígitos (por defecto 6), con ceros a la izquierda. */
export function generateNumericOtp(digits = 6): string {
  const max = 10 ** digits;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(digits, '0');
}

/**
 * Convierte una duración estilo JWT ('7d', '15m', '2h', '30s', '90') a segundos.
 * Un número sin sufijo se interpreta como segundos. Fallback: 0 si no parsea.
 */
export function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(duration.trim());
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'd': return value * 86400;
    case 'h': return value * 3600;
    case 'm': return value * 60;
    case 's': return value;
    default:  return value; // sin sufijo = segundos
  }
}
