import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // Tabla: youtube_videos
  // ==========================================
  await db.schema
    .createTable('youtube_videos')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('youtube_url', 'varchar(500)', (col) => col.notNull())
    .addColumn('video_id', 'varchar(50)', (col) => col.notNull())
    .addColumn('position', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createIndex('idx_youtube_videos_active_position')
    .on('youtube_videos')
    .columns(['is_active', 'position'])
    .execute();

  // Insert some seed data to maintain the default behavior on the landing page initially
  await db
    .insertInto('youtube_videos')
    .values([
      {
        title: 'Tráiler Oficial Animayuks',
        youtube_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
        video_id: 'ScMzIvxBSi4',
        position: 0,
        is_active: true,
      },
      {
        title: 'Gameplay Revelación',
        youtube_url: 'https://www.youtube.com/watch?v=M7FIvfx5J10',
        video_id: 'M7FIvfx5J10',
        position: 1,
        is_active: true,
      },
      {
        title: 'Colección eSports',
        youtube_url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
        video_id: '3JZ_D3ELwOQ',
        position: 2,
        is_active: true,
      }
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('youtube_videos').ifExists().execute();
}
