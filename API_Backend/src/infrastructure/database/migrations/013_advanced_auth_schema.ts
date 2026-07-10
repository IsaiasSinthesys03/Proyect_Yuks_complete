import { Kysely, sql } from 'kysely';

/**
 * Migración 013: Autenticación Avanzada (Fase 29).
 *
 * Cubre cuatro capacidades del SRS:
 *   1. Recuperación de Contraseña — `password_reset_tokens` (tokens de un solo uso, hasheados).
 *   2. Refresh Token Rotation (RTR) — `refresh_tokens` con `family_id` para detectar
 *      reutilización y matar toda la familia de una sesión comprometida.
 *   3. OTP para cambio de email/teléfono (REQ-FE-16) — `otp_codes`.
 *   4. 2FA TOTP para administradores + vinculación OAuth — columnas nuevas en `users`.
 *
 * PRINCIPIO DE SEGURIDAD TRANSVERSAL: ningún secreto se guarda en texto plano.
 *   - Los tokens de reset y refresh se almacenan como SHA-256 (el crudo solo vive
 *     en el cliente). Una fuga de la BD no permite suplantar sesiones.
 *   - Los códigos OTP se almacenan hasheados (Argon2id) igual que las contraseñas.
 *   - El secreto TOTP se guarda en claro por necesidad del algoritmo (RFC 6238),
 *     pero solo para administradores y en una columna dedicada.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // 1. Columnas nuevas en `users`: 2FA (TOTP) + OAuth (Google)
  // ==========================================
  await db.schema
    .alterTable('users')
    .addColumn('totp_secret', 'varchar(255)')            // Base32 (RFC 6238); null si no configurado
    .addColumn('totp_enabled', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('google_id', 'varchar(255)')              // "sub" de Google; null si no vinculado
    .execute();

  // google_id debe ser único cuando está presente (un usuario Google ↔ una cuenta).
  await sql`CREATE UNIQUE INDEX idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL`.execute(db);

  // ==========================================
  // 2. Tabla: password_reset_tokens (Recuperación de Contraseña)
  // ==========================================
  await db.schema
    .createTable('password_reset_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('token_hash', 'varchar(64)', (col) => col.unique().notNull()) // SHA-256 hex = 64 chars
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('used_at', 'timestamptz')                 // null = aún válido; set = ya consumido
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema.createIndex('idx_password_reset_user').on('password_reset_tokens').column('user_id').execute();

  // ==========================================
  // 3. Tabla: refresh_tokens (Refresh Token Rotation con detección de reúso)
  // ==========================================
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('family_id', 'uuid', (col) => col.notNull()) // Todos los tokens rotados de una sesión comparten familia
    .addColumn('token_hash', 'varchar(64)', (col) => col.unique().notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('used_at', 'timestamptz')                 // set cuando se rota; presentarlo de nuevo = reúso
    .addColumn('revoked', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema.createIndex('idx_refresh_tokens_family').on('refresh_tokens').column('family_id').execute();
  await db.schema.createIndex('idx_refresh_tokens_user').on('refresh_tokens').column('user_id').execute();

  // ==========================================
  // 4. Tabla: otp_codes (Cambio de email/teléfono verificado — REQ-FE-16)
  // ==========================================
  await db.schema
    .createTable('otp_codes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('code_hash', 'varchar(255)', (col) => col.notNull())     // Argon2id del código de 6 dígitos
    .addColumn('purpose', 'varchar(20)', (col) => col.notNull())        // 'email_change' | 'phone_change'
    .addColumn('new_value', 'varchar(255)', (col) => col.notNull())     // Email o teléfono pendiente de confirmar
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('consumed_at', 'timestamptz')
    .addColumn('attempts', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await sql`ALTER TABLE otp_codes ADD CONSTRAINT chk_otp_purpose CHECK (purpose IN ('email_change', 'phone_change'))`.execute(db);
  await db.schema.createIndex('idx_otp_codes_user').on('otp_codes').column('user_id').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('otp_codes').ifExists().execute();
  await db.schema.dropTable('refresh_tokens').ifExists().execute();
  await db.schema.dropTable('password_reset_tokens').ifExists().execute();

  await sql`DROP INDEX IF EXISTS idx_users_google_id`.execute(db);
  await db.schema
    .alterTable('users')
    .dropColumn('google_id')
    .dropColumn('totp_enabled')
    .dropColumn('totp_secret')
    .execute();
}
