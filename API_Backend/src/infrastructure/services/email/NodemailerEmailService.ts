import nodemailer from 'nodemailer';
import { IEmailService, OrderStatusEmailParams, DonationReceiptEmailParams, PasswordResetEmailParams, OtpEmailParams } from '../../../application/interfaces/IEmailService';
import { ResendEmailService } from './ResendEmailService';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PAID:       'Pago confirmado',
  PREPARING:  'Estamos preparando tu pedido',
  SHIPPED:    'Tu pedido ha sido enviado',
  DELIVERING: 'Tu pedido está en camino',
  DELIVERED:  'Tu pedido fue entregado',
  CANCELLED:  'Tu pedido fue cancelado',
};

/**
 * Servicio de Email Híbrido Real (Gmail SMTP + Resend + Console Fallback).
 *
 * Configuración en .env:
 * - Para usar Gmail directamente:
 *     SMTP_USER="tu_correo@gmail.com"
 *     SMTP_PASS="tu_contraseña_de_aplicacion" (App Password de 16 caracteres de Google)
 *
 * - Para usar Resend:
 *     EMAIL_API_KEY="re_123456789..."
 */
export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resendService: ResendEmailService | null = null;
  private fromAddress: string;

  constructor() {
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    const resendKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || (smtpUser ? `Animayuks <${smtpUser}>` : 'Animayuks <noreply@animayuks.com>');
    this.fromAddress = from;

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log(`✉️ [Email Service] Configurado transporte SMTP real (${smtpHost}) con cuenta ${smtpUser}`);
    } else if (resendKey) {
      this.resendService = new ResendEmailService(resendKey, from);
      console.log('✉️ [Email Service] Configurado servicio Resend API');
    } else {
      console.warn('⚠️ [Email Service] No se detectó SMTP_USER/PASS ni RESEND_API_KEY en .env. Se usará el registrador de consola para desarrollo.');
    }
  }

  async sendOrderStatusEmail(params: OrderStatusEmailParams): Promise<void> {
    if (this.resendService) return this.resendService.sendOrderStatusEmail(params);

    const label = ORDER_STATUS_LABELS[params.newStatus] ?? params.newStatus;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #061f09; color: #e6c59e; padding: 24px; border-radius: 16px;">
        <h2 style="color: #03bbd3; font-size: 24px; margin-top: 0;">Animayuks</h2>
        <p>Hola, aquí está la actualización de tu pedido:</p>
        <div style="background: #0a2e0d; padding: 16px; border-radius: 12px; border: 1px solid rgba(26,154,33,0.3); margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Estado:</strong> ${label}</p>
          <p style="margin: 4px 0;"><strong>Folio:</strong> #${params.orderId.slice(0, 8).toUpperCase()}</p>
          <p style="margin: 4px 0;"><strong>Total:</strong> $${params.totalPaid.toFixed(2)} MXN</p>
        </div>
        <p style="color: #a3b899; font-size: 13px;">Puedes consultar el detalle de tu pedido iniciando sesión en animayuks.com</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: params.to,
          subject: `Animayuks — ${label} (#${params.orderId.slice(0, 8).toUpperCase()})`,
          html,
        });
        console.log(`✅ [Gmail SMTP] Email de pedido enviado a ${params.to}`);
      } catch (err: any) {
        console.error('❌ Error enviando email con SMTP:', err?.message || err);
      }
    } else {
      console.log(`📧 [DEV MOCK] Estado de Pedido #${params.orderId.slice(0, 8)} -> ${label} para ${params.to}`);
    }
  }

  async sendDonationReceiptEmail(params: DonationReceiptEmailParams): Promise<void> {
    if (this.resendService) return this.resendService.sendDonationReceiptEmail(params);

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #061f09; color: #e6c59e; padding: 24px; border-radius: 16px;">
        <h2 style="color: #96c93e; font-size: 24px; margin-top: 0;">¡Gracias por tu donación!</h2>
        <p>Tu apoyo hace posible el proyecto Animayuks.</p>
        <div style="background: #0a2e0d; padding: 16px; border-radius: 12px; border: 1px solid rgba(26,154,33,0.3); margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Monto:</strong> $${params.amount.toFixed(2)} MXN</p>
          <p style="margin: 4px 0;"><strong>Folio:</strong> #${params.donationId.slice(0, 8).toUpperCase()}</p>
        </div>
        <p style="color: #a3b899; font-size: 13px;">Este correo es tu comprobante de donación.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: params.to,
          subject: `Animayuks — Recibo de donación #${params.donationId.slice(0, 8).toUpperCase()}`,
          html,
        });
        console.log(`✅ [Gmail SMTP] Recibo de donación enviado a ${params.to}`);
      } catch (err: any) {
        console.error('❌ Error enviando recibo con SMTP:', err?.message || err);
      }
    } else {
      console.log(`📧 [DEV MOCK] Recibo de Donación #${params.donationId.slice(0, 8)} para ${params.to}`);
    }
  }

  async sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
    console.log('\n======================================================');
    console.log('📧 [SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA]');
    console.log(`Para: ${params.to}`);
    console.log(`Enlace: ${params.resetLink}`);
    console.log('======================================================\n');

    if (this.resendService) return this.resendService.sendPasswordResetEmail(params);

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #061f09; color: #e6c59e; padding: 24px; border-radius: 16px; border: 1px solid rgba(26,154,33,0.3);">
        <h2 style="color: #03bbd3; font-size: 24px; margin-top: 0;">Recuperación de Contraseña — Animayuks</h2>
        <p>Recibiste este correo porque solicitaste restablecer tu contraseña en Animayuks.</p>
        <p>El enlace expira en <strong>${params.expiresInMinutes} minutos</strong>.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${params.resetLink}" style="background-color: #03bbd3; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 16px; box-shadow: 0 4px 14px rgba(3,187,211,0.4);">
            Restablecer Mi Contraseña
          </a>
        </div>
        <p style="color: #8fa385; font-size: 12px;">Si no solicitaste esto, puedes ignorar este mensaje de forma segura.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: params.to,
          subject: 'Animayuks — Recupera tu contraseña',
          html,
        });
        console.log(`✅ [Gmail SMTP] Correo de recuperación de contraseña enviado exitosamente a ${params.to}`);
      } catch (err: any) {
        console.error('❌ Error enviando email de recuperación vía SMTP:', err?.message || err);
      }
    }
  }

  async sendOtpEmail(params: OtpEmailParams): Promise<void> {
    if (this.resendService) return this.resendService.sendOtpEmail(params);

    const purpose = params.purpose === 'email_change' ? 'cambio de correo electrónico' : 'cambio de número de teléfono';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #061f09; color: #e6c59e; padding: 24px; border-radius: 16px;">
        <h2 style="color: #ffce07; font-size: 24px; margin-top: 0;">Código de Verificación</h2>
        <p>Tu código de seguridad para ${purpose} es:</p>
        <div style="background: #0a2e0d; padding: 20px; text-align: center; border-radius: 12px; border: 1px solid rgba(255,206,7,0.4); margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffce07;">${params.otp}</span>
        </div>
        <p style="color: #a3b899; font-size: 13px;">Este código expira en 10 minutos. No lo compartas con nadie.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: params.to,
          subject: 'Animayuks — Código de verificación OTP',
          html,
        });
        console.log(`✅ [Gmail SMTP] Código OTP enviado exitosamente a ${params.to}`);
      } catch (err: any) {
        console.error('❌ Error enviando OTP vía SMTP:', err?.message || err);
      }
    } else {
      console.log(`🔑 [DEV MOCK OTP] ${params.otp} enviado a ${params.to}`);
    }
  }
}
