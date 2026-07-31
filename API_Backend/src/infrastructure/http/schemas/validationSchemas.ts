/**
 * Esquemas JSON (Fastify/ajv) para validación a NIVEL DE RUTA (Fase 34, REQ-BE-06).
 *
 * La validación ocurre en la fase `validation` del ciclo de vida de Fastify, que
 * corre ANTES de los hooks `preHandler` y del handler → un body mal formado
 * retorna 400 sin que la lógica del Use Case llegue a ejecutarse.
 *
 * Se evitan `format` (email, etc.) para no depender de ajv-formats: se usan
 * type + required + minLength/minimum, suficientes para rechazar payloads inválidos.
 */

/** Config de rate limit HIPER-ESTRICTO (5/min) para endpoints sensibles, independiente del global. */
export const STRICT_RATE_LIMIT = {
  rateLimit: { max: 5, timeWindow: '1 minute' },
} as const;

export const registerBodySchema = {
  type: 'object',
  required: ['email', 'password', 'firstName', 'lastName', 'phone', 'termsAccepted'],
  properties: {
    email: { type: 'string', minLength: 3, maxLength: 255 },
    password: { type: 'string', minLength: 6, maxLength: 200 },
    firstName: { type: 'string', minLength: 1, maxLength: 100 },
    lastName: { type: 'string', minLength: 1, maxLength: 100 },
    phone: { type: 'string', minLength: 1, maxLength: 20 },
    termsAccepted: { type: 'boolean' },
  },
} as const;

export const resetPasswordBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['token', 'newPassword'],
  properties: {
    token: { type: 'string', minLength: 1, maxLength: 512 },
    newPassword: {
      type: 'string',
      minLength: 8,
      maxLength: 200,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,200}$',
    },
  },
} as const;

export const checkoutBodySchema = {
  type: 'object',
  required: ['items', 'addressId', 'termsVersion'],
  properties: {
    addressId: { type: 'string', minLength: 1 },
    termsVersion: { type: 'string', minLength: 1 },
    couponCode: { type: 'string' },
    walletAmount: { type: 'number', minimum: 0 },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['variantId', 'quantity'],
        properties: {
          variantId: { type: 'string', minLength: 1 },
          quantity: { type: 'integer', minimum: 1 },
        },
      },
    },
  },
} as const;

export const refundBodySchema = {
  type: 'object',
  required: ['amount', 'reason', 'currentPassword'],
  properties: {
    amount: { type: 'number', exclusiveMinimum: 0 },
    reason: { type: 'string', minLength: 1 },
    currentPassword: { type: 'string', minLength: 1 },
  },
} as const;

export const donateBodySchema = {
  type: 'object',
  required: ['amount'],
  properties: {
    amount: { type: 'number', exclusiveMinimum: 0 },
    donorEmail: { type: 'string' },
    idempotencyKey: { type: 'string' },
  },
} as const;
