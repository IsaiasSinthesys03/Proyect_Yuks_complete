/** Monto por debajo del mínimo configurado en system_settings */
export class DonationAmountTooLowError extends Error {
  constructor(amount: number, minimum: number) {
    super(`El monto de la donación ($${amount}) es menor al mínimo permitido ($${minimum}).`);
    this.name = 'DonationAmountTooLowError';
  }
}

/** Intento de crear una donación con idempotency_key ya procesada */
export class DonationAlreadyProcessedError extends Error {
  constructor(idempotencyKey: string) {
    super(`La donación con clave de idempotencia "${idempotencyKey}" ya fue procesada.`);
    this.name = 'DonationAlreadyProcessedError';
  }
}

/** Donación no encontrada (uso interno del webhook) */
export class DonationNotFoundError extends Error {
  constructor(paymentIntentId: string) {
    super(`No se encontró ninguna donación con Stripe Payment Intent ID: ${paymentIntentId}`);
    this.name = 'DonationNotFoundError';
  }
}
