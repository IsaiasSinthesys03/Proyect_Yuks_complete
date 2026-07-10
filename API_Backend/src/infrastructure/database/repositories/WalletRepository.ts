import { db } from '../client';
import { sql } from 'kysely';
import { IWalletRepository } from '../../../application/interfaces/IWalletRepository';
import { Wallet } from '../../../domain/entities/Wallet';
import { WalletTransaction, WalletTransactionSource, WalletTransactionType } from '../../../domain/entities/WalletTransaction';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';
import { InsufficientFundsError } from '../../../domain/errors/WalletErrors';

const WALLET_RENEWAL_MONTHS = 12;

/**
 * Implementación concreta de IWalletRepository usando Kysely.
 *
 * Reglas críticas implementadas:
 *   - Q8: `debit` usa UPDATE condicional (`balance >= amount`) como guardián
 *     atómico; el CHECK SQL `balance >= 0` es la red de seguridad final.
 *   - Resolución #4: `credit` SIN `originalExpiresAt` renueva `expires_at` a NOW() + 12 meses.
 *   - Resolución #5: `credit` CON `originalExpiresAt` hereda esa fecha sin renovar.
 *   - Resolución #5: `debit` captura el `expires_at` PREVIO a la operación en
 *     `original_expires_at` de la transacción WITHDRAWAL, para que la futura
 *     cancelación pueda heredarlo.
 */
export class WalletRepository implements IWalletRepository {
  async findByUserId(userId: string): Promise<Wallet | null> {
    const row = await db
      .selectFrom('wallet')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToWallet(row);
  }

  async getOrCreate(userId: string): Promise<Wallet> {
    // VULN-03: INSERT atómico con ON CONFLICT DO NOTHING. El patrón anterior
    // (SELECT y luego INSERT) tenía una ventana de carrera en la que dos
    // requests concurrentes del mismo usuario (ej. checkout + consulta de
    // saldo) podían intentar crear dos wallets → violación del UNIQUE(user_id)
    // o dos filas. Aquí la creación es una sola operación atómica.
    const inserted = await db
      .insertInto('wallet')
      .values({ user_id: userId })
      .onConflict((oc) => oc.column('user_id').doNothing())
      .returningAll()
      .executeTakeFirst();

    if (inserted) {
      return this.mapRowToWallet(inserted);
    }

    // Hubo conflicto (la wallet ya existía): la leemos. Está garantizada por el
    // ON CONFLICT sobre user_id, así que este SELECT siempre encuentra la fila.
    const existing = await this.findByUserId(userId);
    if (!existing) {
      // Escenario imposible salvo corrupción — falla ruidosa en vez de silenciosa.
      throw new Error(`Inconsistencia: no se encontró la wallet del usuario ${userId} tras ON CONFLICT.`);
    }
    return existing;
  }

  async debit(
    walletId: string,
    amount: number,
    orderId: string,
    source: WalletTransactionSource
  ): Promise<WalletTransaction> {
    return db.transaction().execute(async (trx) => {
      const currentWallet = await trx
        .selectFrom('wallet')
        .selectAll()
        .where('id', '=', walletId)
        .executeTakeFirstOrThrow();

      const updateResult = await trx
        .updateTable('wallet')
        .set({ balance: sql<string>`balance - ${amount}`, updated_at: new Date() })
        .where('id', '=', walletId)
        .where(sql<boolean>`balance >= ${amount}`)
        .executeTakeFirst();

      if (updateResult.numUpdatedRows === 0n) {
        throw new InsufficientFundsError(amount, parseFloat(currentWallet.balance));
      }

      const transactionRow = await trx
        .insertInto('wallet_transactions')
        .values({
          wallet_id: walletId,
          order_id: orderId,
          amount: amount.toString(),
          type: 'WITHDRAWAL',
          source,
          original_expires_at: currentWallet.expires_at,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapRowToWalletTransaction(transactionRow);
    });
  }

  async credit(
    walletId: string,
    amount: number,
    orderId: string | null,
    source: WalletTransactionSource,
    originalExpiresAt?: Date
  ): Promise<WalletTransaction> {
    return db.transaction().execute(async (trx) => {
      const newExpiresAt =
        originalExpiresAt ?? this.addMonths(new Date(), WALLET_RENEWAL_MONTHS);

      await trx
        .updateTable('wallet')
        .set({
          balance: sql<string>`balance + ${amount}`,
          expires_at: newExpiresAt,
          updated_at: new Date(),
        })
        .where('id', '=', walletId)
        .execute();

      const transactionRow = await trx
        .insertInto('wallet_transactions')
        .values({
          wallet_id: walletId,
          order_id: orderId,
          amount: amount.toString(),
          type: 'DEPOSIT',
          source,
          original_expires_at: originalExpiresAt ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapRowToWalletTransaction(transactionRow);
    });
  }

  async getTransactions(
    walletId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponseDTO<WalletTransaction>> {
    const offset = (page - 1) * limit;

    const countResult = await db
      .selectFrom('wallet_transactions')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .where('wallet_id', '=', walletId)
      .executeTakeFirstOrThrow();

    const total = Number(countResult.total);

    const rows = await db
      .selectFrom('wallet_transactions')
      .selectAll()
      .where('wallet_id', '=', walletId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      data: rows.map((row) => this.mapRowToWalletTransaction(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTransactionByOrderId(
    orderId: string,
    source: WalletTransactionSource
  ): Promise<WalletTransaction | null> {
    const row = await db
      .selectFrom('wallet_transactions')
      .selectAll()
      .where('order_id', '=', orderId)
      .where('source', '=', source)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToWalletTransaction(row);
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  private mapRowToWallet(row: {
    id: string;
    user_id: string;
    balance: string;
    expires_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): Wallet {
    return {
      id: row.id,
      userId: row.user_id,
      balance: parseFloat(row.balance),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToWalletTransaction(row: {
    id: string;
    wallet_id: string;
    order_id: string | null;
    amount: string;
    type: string;
    source: string;
    description: string | null;
    original_expires_at: Date | null;
    created_at: Date;
  }): WalletTransaction {
    return {
      id: row.id,
      walletId: row.wallet_id,
      orderId: row.order_id,
      amount: parseFloat(row.amount),
      type: row.type as WalletTransactionType,
      source: row.source as WalletTransactionSource,
      description: row.description,
      originalExpiresAt: row.original_expires_at,
      createdAt: row.created_at,
    };
  }
}
