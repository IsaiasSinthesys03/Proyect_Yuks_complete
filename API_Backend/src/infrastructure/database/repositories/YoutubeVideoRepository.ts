import { Kysely } from 'kysely';
import { Database } from '../schema/db-types';
import { YoutubeVideoRow, YoutubeVideoRowUpdate, NewYoutubeVideoRow } from '../schema/db-types';

export class YoutubeVideoRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findAll(): Promise<YoutubeVideoRow[]> {
    return this.db
      .selectFrom('youtube_videos')
      .selectAll()
      .orderBy('position', 'asc')
      .execute();
  }

  async findActive(): Promise<YoutubeVideoRow[]> {
    return this.db
      .selectFrom('youtube_videos')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('position', 'asc')
      .execute();
  }

  async findById(id: string): Promise<YoutubeVideoRow | undefined> {
    return this.db
      .selectFrom('youtube_videos')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async create(data: NewYoutubeVideoRow): Promise<YoutubeVideoRow> {
    return this.db
      .insertInto('youtube_videos')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, data: YoutubeVideoRowUpdate): Promise<YoutubeVideoRow> {
    return this.db
      .updateTable('youtube_videos')
      .set({ ...data, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('youtube_videos').where('id', '=', id).execute();
  }

  async getNextPosition(): Promise<number> {
    const result = await this.db
      .selectFrom('youtube_videos')
      .select(this.db.fn.max('position').as('max_pos'))
      .executeTakeFirst();
    return (result?.max_pos as number ?? -1) + 1;
  }
}
