import { db } from '../client';
import { IBannerRepository } from '../../../application/interfaces/IBannerRepository';
import { Banner } from '../../../domain/entities/Banner';
import { CreateBannerDTO, UpdateBannerDTO } from '../../../domain/types/BannerDTOs';

export class BannerRepository implements IBannerRepository {
  async findAll(): Promise<Banner[]> {
    const rows = await db
      .selectFrom('banners')
      .selectAll()
      .orderBy('position', 'asc')
      .orderBy('created_at', 'desc')
      .execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findActive(now: Date): Promise<Banner[]> {
    const rows = await db
      .selectFrom('banners')
      .selectAll()
      .where('is_active', '=', true)
      .where((eb) => eb.or([eb('starts_at', 'is', null), eb('starts_at', '<=', now)]))
      .where((eb) => eb.or([eb('ends_at', 'is', null), eb('ends_at', '>=', now)]))
      .orderBy('position', 'asc')
      .orderBy('created_at', 'desc')
      .execute();
    return rows.map((r) => this.mapRow(r));
  }

  async findById(id: string): Promise<Banner | null> {
    const row = await db.selectFrom('banners').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async create(data: CreateBannerDTO): Promise<Banner> {
    const row = await db
      .insertInto('banners')
      .values({
        title: data.title,
        image_url: data.imageUrl,
        link_url: data.linkUrl ?? null,
        tag: data.tag ?? null,
        description: data.description ?? null,
        video_url: data.videoUrl ?? null,
        accent_color: data.accentColor ?? null,
        button_text: data.buttonText ?? null,
        position: data.position ?? 0,
        is_active: data.isActive ?? true,
        starts_at: data.startsAt ? new Date(data.startsAt) : null,
        ends_at: data.endsAt ? new Date(data.endsAt) : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return this.mapRow(row);
  }

  async update(id: string, data: UpdateBannerDTO): Promise<Banner | null> {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (data.title !== undefined) updates['title'] = data.title;
    if (data.imageUrl !== undefined) updates['image_url'] = data.imageUrl;
    if (data.linkUrl !== undefined) updates['link_url'] = data.linkUrl;
    if (data.tag !== undefined) updates['tag'] = data.tag;
    if (data.description !== undefined) updates['description'] = data.description;
    if (data.videoUrl !== undefined) updates['video_url'] = data.videoUrl;
    if (data.accentColor !== undefined) updates['accent_color'] = data.accentColor;
    if (data.buttonText !== undefined) updates['button_text'] = data.buttonText;
    if (data.position !== undefined) updates['position'] = data.position;
    if (data.isActive !== undefined) updates['is_active'] = data.isActive;
    if (data.startsAt !== undefined) updates['starts_at'] = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt !== undefined) updates['ends_at'] = data.endsAt ? new Date(data.endsAt) : null;

    const row = await db
      .updateTable('banners')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.deleteFrom('banners').where('id', '=', id).executeTakeFirst();
    return result.numDeletedRows > 0n;
  }

  private mapRow(row: {
    id: string;
    title: string;
    image_url: string;
    link_url: string | null;
    tag: string | null;
    description: string | null;
    video_url: string | null;
    accent_color: string | null;
    button_text?: string | null;
    position: number;
    is_active: boolean;
    starts_at: Date | null;
    ends_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): Banner {
    return {
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      linkUrl: row.link_url,
      tag: row.tag,
      description: row.description,
      videoUrl: row.video_url,
      accentColor: row.accent_color,
      buttonText: row.button_text ?? null,
      position: row.position,
      isActive: row.is_active,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
