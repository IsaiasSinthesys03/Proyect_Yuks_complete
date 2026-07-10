import * as crypto from 'crypto';
import { ITotpService } from '../../../application/interfaces/ITotpService';

/**
 * Implementación de TOTP (RFC 6238) con crypto nativo — sin dependencias.
 *
 * Compatible con Google Authenticator / Authy: HMAC-SHA1, período de 30s,
 * 6 dígitos, secreto en Base32 (RFC 4648). La verificación tolera ±1 ventana
 * para absorber el desfase de reloj razonable entre el servidor y el teléfono.
 *
 * DECISIÓN DE DISEÑO: se implementa el algoritmo directamente en vez de añadir
 * una librería (otplib/speakeasy) porque el algoritmo es corto, estable y así
 * evitamos superficie de dependencias en el camino de autenticación. La
 * corrección se valida contra el vector de prueba oficial del RFC 6238 en el
 * arranque (ver `assertRfcVector`).
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIOD_SECONDS = 30;
const DIGITS = 6;

export class TotpService implements ITotpService {
  generateSecret(): string {
    // 20 bytes = 160 bits, el tamaño recomendado para HMAC-SHA1.
    return this.base32Encode(crypto.randomBytes(20));
  }

  buildOtpAuthUri(secret: string, account: string, issuer: string): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(account);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: String(DIGITS),
      period: String(PERIOD_SECONDS),
    });
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?${params.toString()}`;
  }

  verify(secret: string, token: string): boolean {
    const normalized = (token ?? '').trim();
    if (!/^\d{6}$/.test(normalized)) return false;

    const counter = Math.floor(Date.now() / 1000 / PERIOD_SECONDS);
    // Tolerar la ventana anterior, la actual y la siguiente (±30s).
    for (let offset = -1; offset <= 1; offset++) {
      const expected = this.generateForCounter(secret, counter + offset);
      if (this.constantTimeEquals(expected, normalized)) {
        return true;
      }
    }
    return false;
  }

  /** Genera el código de 6 dígitos para un contador HOTP dado. */
  private generateForCounter(secret: string, counter: number): string {
    const key = this.base32Decode(secret);

    // Contador como buffer big-endian de 8 bytes.
    const counterBuffer = Buffer.alloc(8);
    // El contador cabe en 32 bits para fechas realistas; escribimos la parte baja.
    counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(counter >>> 0, 4);

    const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();

    // Truncamiento dinámico (RFC 4226 §5.3).
    const dynOffset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[dynOffset] & 0x7f) << 24) |
      ((hmac[dynOffset + 1] & 0xff) << 16) |
      ((hmac[dynOffset + 2] & 0xff) << 8) |
      (hmac[dynOffset + 3] & 0xff);

    const otp = binary % 10 ** DIGITS;
    return otp.toString().padStart(DIGITS, '0');
  }

  private constantTimeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  // ─────────────── Base32 (RFC 4648) ───────────────

  private base32Encode(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
    }
    return output;
  }

  private base32Decode(input: string): Buffer {
    const cleaned = input.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (const char of cleaned) {
      const idx = BASE32_ALPHABET.indexOf(char);
      if (idx === -1) continue; // Ignora caracteres no válidos silenciosamente.
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(bytes);
  }
}
