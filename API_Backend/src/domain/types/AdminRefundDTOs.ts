// ==========================================
// Fase 25 — DTOs para reembolsos administrativos
// ==========================================

/**
 * DTO del endpoint POST /api/admin/orders/:id/refund.
 *
 * La defensa en profundidad exige que el admin re-autentique su contraseña
 * actual en CADA operación de reembolso, independientemente de que el JWT
 * sea válido. Si el JWT fue robado, el atacante no conoce la contraseña.
 *
 * El `orderId` no va en este DTO — viene del path param `:id`.
 */
export interface ManualRefundDTO {
  /** Monto a reembolsar (MXN). Debe ser > 0 y ≤ order.totalPaid. */
  amount: number;
  /** Razón del reembolso. Persiste en audit_logs.new_value para trazabilidad inmutable. */
  reason: string;
  /** Contraseña actual del admin. Verificada con Argon2 antes de invocar a Stripe. */
  currentPassword: string;
}

/** Respuesta del reembolso exitoso. */
export interface RefundResultDTO {
  orderId: string;
  refundId: string;
  amount: number;
  reason: string;
}
