import { db } from '../client';
import { IAddressRepository } from '../../../application/interfaces/IAddressRepository';
import { Address } from '../../../domain/entities/Address';
import { CreateAddressDTO, UpdateAddressDTO } from '../../../domain/types/AddressDTOs';

/**
 * Implementación concreta de IAddressRepository usando Kysely.
 *
 * Este adaptador vive en la capa de Infraestructura y es el ÚNICO lugar
 * donde se tocan tipos de SQL (snake_case) y Kysely para direcciones.
 */
export class AddressRepository implements IAddressRepository {
  async findByUserId(userId: string): Promise<Address[]> {
    const rows = await db
      .selectFrom('addresses')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map((row) => this.mapRowToAddress(row));
  }

  async findById(addressId: string, userId: string): Promise<Address | null> {
    const row = await db
      .selectFrom('addresses')
      .selectAll()
      .where('id', '=', addressId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToAddress(row);
  }

  async create(userId: string, data: CreateAddressDTO): Promise<Address> {
    const row = await db
      .insertInto('addresses')
      .values({
        user_id: userId,
        label: data.label,
        street: data.street,
        exterior_number: data.exteriorNumber,
        interior_number: data.interiorNumber ?? null,
        neighborhood: data.neighborhood,
        postal_code: data.postalCode,
        municipality: data.municipality,
        state: data.state,
        references: data.references ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToAddress(row);
  }

  async update(addressId: string, userId: string, data: UpdateAddressDTO): Promise<Address> {
    const row = await db
      .updateTable('addresses')
      .set({
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.street !== undefined ? { street: data.street } : {}),
        ...(data.exteriorNumber !== undefined ? { exterior_number: data.exteriorNumber } : {}),
        ...(data.interiorNumber !== undefined ? { interior_number: data.interiorNumber } : {}),
        ...(data.neighborhood !== undefined ? { neighborhood: data.neighborhood } : {}),
        ...(data.postalCode !== undefined ? { postal_code: data.postalCode } : {}),
        ...(data.municipality !== undefined ? { municipality: data.municipality } : {}),
        ...(data.state !== undefined ? { state: data.state } : {}),
        ...(data.references !== undefined ? { references: data.references } : {}),
        updated_at: new Date(),
      })
      .where('id', '=', addressId)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRowToAddress(row);
  }

  async delete(addressId: string, userId: string): Promise<void> {
    await db
      .deleteFrom('addresses')
      .where('id', '=', addressId)
      .where('user_id', '=', userId)
      .execute();
  }

  async setDefault(addressId: string, userId: string): Promise<void> {
    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('addresses')
        .set({ is_default: false, updated_at: new Date() })
        .where('user_id', '=', userId)
        .where('is_default', '=', true)
        .execute();

      await trx
        .updateTable('addresses')
        .set({ is_default: true, updated_at: new Date() })
        .where('id', '=', addressId)
        .where('user_id', '=', userId)
        .execute();
    });
  }

  private mapRowToAddress(row: {
    id: string;
    user_id: string;
    label: string;
    street: string;
    exterior_number: string;
    interior_number: string | null;
    neighborhood: string;
    postal_code: string;
    municipality: string;
    state: string;
    country: string;
    references: string | null;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
  }): Address {
    return {
      id: row.id,
      userId: row.user_id,
      label: row.label,
      street: row.street,
      exteriorNumber: row.exterior_number,
      interiorNumber: row.interior_number,
      neighborhood: row.neighborhood,
      postalCode: row.postal_code,
      municipality: row.municipality,
      state: row.state,
      country: row.country,
      references: row.references,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
