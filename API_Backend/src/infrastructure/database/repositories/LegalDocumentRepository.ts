import { db } from '../client';
import { ILegalDocumentRepository } from '../../../application/interfaces/ILegalDocumentRepository';
import { LegalDocument } from '../../../domain/entities/LegalDocument';
import { UpdateLegalDocumentDTO } from '../../../domain/types/LegalDocumentDTOs';

export class LegalDocumentRepository implements ILegalDocumentRepository {
  async findAll(): Promise<LegalDocument[]> {
    const rows = await db.selectFrom('legal_documents').selectAll().orderBy('slug', 'asc').execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findBySlug(slug: string): Promise<LegalDocument | null> {
    const row = await db
      .selectFrom('legal_documents')
      .selectAll()
      .where('slug', '=', slug.toLowerCase().trim())
      .executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async update(slug: string, data: UpdateLegalDocumentDTO): Promise<LegalDocument | null> {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (data.title !== undefined) updates['title'] = data.title;
    if (data.content !== undefined) updates['content'] = data.content;
    if (data.version !== undefined) updates['version'] = data.version;

    const row = await db
      .updateTable('legal_documents')
      .set(updates)
      .where('slug', '=', slug.toLowerCase().trim())
      .returningAll()
      .executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  private mapRow(row: {
    id: string;
    slug: string;
    title: string;
    content: string;
    version: string;
    created_at: Date;
    updated_at: Date;
  }): LegalDocument {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      content: row.content,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
