/**
 * Puerto (Interfaz) del Servicio de Email Transaccional (REQ-BE-04).
 *
 * Clean Architecture: los Use Cases dependen de esta abstracción,
 * nunca del SDK de Resend/Nodemailer directamente.
 * El envío real ocurre de forma ASÍNCRONA via BullMQ worker —
 * los métodos de este servicio NO se llaman desde el flujo HTTP
 * (solo desde el worker), lo que garantiza que el usuario
 * nunca espera a la API de email para recibir su respuesta HTTP.
 */
export interface IEmailService {
  /** Notificación de cambio de estado de pedido (REQ-BE-04) */
  sendOrderStatusEmail(params: OrderStatusEmailParams): Promise<void>;

  /** Recibo de donación al donante (REQ-BE-09) */
  sendDonationReceiptEmail(params: DonationReceiptEmailParams): Promise<void>;

  /** Enlace de recuperación de contraseña (REQ-FE-10 — Fase 29) */
  sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void>;

  /** Código OTP para cambio de email/teléfono (REQ-FE-16 — Fase 29) */
  sendOtpEmail(params: OtpEmailParams): Promise<void>;
}

export interface OrderStatusEmailParams {
  to: string;
  orderId: string;
  newStatus: string;
  totalPaid: number;
}

export interface DonationReceiptEmailParams {
  to: string;
  donationId: string;
  amount: number;
}

export interface PasswordResetEmailParams {
  to: string;
  resetLink: string;
  expiresInMinutes: number;
}

export interface OtpEmailParams {
  to: string;
  otp: string;
  purpose: 'email_change' | 'phone_change';
}
