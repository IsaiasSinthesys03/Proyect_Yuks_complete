import { Resend } from 'resend';
import { IEmailService, OrderStatusEmailParams, DonationReceiptEmailParams, PasswordResetEmailParams, OtpEmailParams } from '../../../application/interfaces/IEmailService';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PAID:       'Pago confirmado',
  PREPARING:  'Estamos preparando tu pedido',
  SHIPPED:    'Tu pedido ha sido enviado',
  DELIVERING: 'Tu pedido está en camino',
  DELIVERED:  'Tu pedido fue entregado',
  CANCELLED:  'Tu pedido fue cancelado',
};

/**
 * Implementación concreta del IEmailService usando Resend.
 *
 * Solo se instancia desde el Email Worker (proceso asíncrono),
 * NUNCA desde un controlador HTTP. Esto garantiza que el usuario
 * no espera a Resend para recibir su respuesta HTTP.
 */
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly apiKey: string;
  private readonly fromAddress: string;

  constructor(apiKey: string, fromAddress: string) {
    this.apiKey = apiKey;
    this.resend = new Resend(apiKey || 're_placeholder');
    this.fromAddress = fromAddress;
  }

  async sendOrderStatusEmail(params: OrderStatusEmailParams): Promise<void> {
    const label = ORDER_STATUS_LABELS[params.newStatus] ?? params.newStatus;
    if (!this.apiKey) {
      console.log(`📧 [DEV EMAIL MOCK] Estado de Pedido #${params.orderId.slice(0, 8)} -> ${label} para ${params.to}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to: params.to,
        subject: `Animayuks — ${label} (#${params.orderId.slice(0, 8).toUpperCase()})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6D28D9;">Animayuks</h2>
            <p>Hola, aquí está la actualización de tu pedido:</p>
            <div style="background: #F5F3FF; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Estado:</strong> ${label}</p>
              <p><strong>Folio:</strong> #${params.orderId.slice(0, 8).toUpperCase()}</p>
              <p><strong>Total:</strong> $${params.totalPaid.toFixed(2)} MXN</p>
            </div>
            <p style="color: #6B7280; font-size: 14px;">
              Puedes consultar el detalle de tu pedido iniciando sesión en animayuks.com
            </p>
          </div>
        `,
      });
    } catch (err: any) {
      console.warn(`⚠️ [Resend Error] No se pudo enviar email de estado de pedido: ${err?.message || err}`);
    }
  }

  async sendDonationReceiptEmail(params: DonationReceiptEmailParams): Promise<void> {
    if (!this.apiKey) {
      console.log(`📧 [DEV EMAIL MOCK] Recibo de Donación #${params.donationId.slice(0, 8)} para ${params.to}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to: params.to,
        subject: `Animayuks — Recibo de donación #${params.donationId.slice(0, 8).toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6D28D9;">¡Gracias por tu donación!</h2>
            <p>Tu apoyo hace posible el proyecto Animayuks.</p>
            <div style="background: #F5F3FF; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Monto:</strong> $${params.amount.toFixed(2)} MXN</p>
              <p><strong>Folio:</strong> #${params.donationId.slice(0, 8).toUpperCase()}</p>
            </div>
            <p style="color: #6B7280; font-size: 14px;">Este correo es tu comprobante de donación.</p>
          </div>
        `,
      });
    } catch (err: any) {
      console.warn(`⚠️ [Resend Error] No se pudo enviar recibo de donación: ${err?.message || err}`);
    }
  }

  async sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
    console.log('\n======================================================');
    console.log('📧 [RECUPERACIÓN DE CONTRASEÑA]');
    console.log(`Para: ${params.to}`);
    console.log(`Enlace de restablecimiento: ${params.resetLink}`);
    console.log(`Válido por: ${params.expiresInMinutes} minutos`);
    console.log('======================================================\n');

    if (!this.apiKey) return;

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to: params.to,
        subject: 'Animayuks — Recupera tu contraseña',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6D28D9;">Recupera tu contraseña</h2>
            <p>Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
            <p>El enlace expira en <strong>${params.expiresInMinutes} minutos</strong>.</p>
            <a href="${params.resetLink}"
               style="display: inline-block; background: #6D28D9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
              Restablecer contraseña
            </a>
            <p style="color: #6B7280; font-size: 14px;">Si no solicitaste esto, ignora este correo.</p>
          </div>
        `,
      });
    } catch (err: any) {
      console.warn(`⚠️ [Resend Error] No se pudo entregar email real vía Resend: ${err?.message || err}`);
    }
  }

  async sendOtpEmail(params: OtpEmailParams): Promise<void> {
    const purpose = params.purpose === 'email_change'
      ? 'cambio de correo electrónico'
      : 'cambio de número de teléfono';

    await this.resend.emails.send({
      from: this.fromAddress,
      to: params.to,
      subject: 'Animayuks — Código de verificación',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6D28D9;">Tu código de verificación</h2>
          <p>Usa este código para confirmar tu ${purpose}:</p>
          <div style="background: #F5F3FF; padding: 24px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6D28D9;">
              ${params.otp}
            </span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">Expira en 10 minutos. Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    });
  }
}
