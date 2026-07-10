import { Kysely, sql } from 'kysely';
import * as argon2 from 'argon2';

/**
 * Migración: Infraestructura de Seguridad del Panel CMS (Fase 21).
 *
 * Crea:
 *   1. `system_settings` — configuración logística/financiera dinámica
 *      (saca el `DEFAULT_SYSTEM_CONFIG` hardcodeado de `ProcessCheckoutUseCase`)
 *      + el hash Argon2id del Código de Desarrollador (Q21).
 *   2. `audit_logs` — bitácora inmutable de acciones administrativas.
 *   3. Triggers síncronos que pueblan `audit_logs` automáticamente cuando
 *      hay contexto de admin en la sesión SQL (`app.current_admin_email`),
 *      seteado por la aplicación vía `withAdminAuditContext` ANTES de
 *      ejecutar la mutación (ver `infrastructure/database/withAdminAuditContext.ts`).
 *   4. Un trigger BLOQUEANTE que impide `UPDATE`/`DELETE` sobre `audit_logs`
 *      incondicionalmente — esto es más fuerte que un `REVOKE` de permisos,
 *      porque en Supabase la conexión de la app suele usar un rol que ES
 *      el propietario de la tabla (los propietarios siempre tienen permisos
 *      implícitos que un `REVOKE` normal no puede quitarles). Un trigger
 *      `BEFORE UPDATE OR DELETE` que siempre lanza excepción es inmune a eso.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // ==========================================
  // Tabla: system_settings
  // ==========================================
  await db.schema
    .createTable('system_settings')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('key', 'varchar(100)', (col) => col.unique().notNull())
    .addColumn('value', 'jsonb', (col) => col.notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Seed: hash Argon2id del Código de Desarrollador por defecto ("000000", Q21).
  // NUNCA se guarda en texto plano ni se expone vía ningún endpoint de lectura.
  const developerCodeHash = await argon2.hash('000000', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await db
    .insertInto('system_settings')
    .values([
      { key: 'developer_code_hash', value: JSON.stringify(developerCodeHash) },
      { key: 'free_shipping_threshold', value: JSON.stringify(1500) },
      { key: 'min_purchase_amount', value: JSON.stringify(200) },
      { key: 'local_shipping_cost', value: JSON.stringify(50) },
      { key: 'external_shipping_cost', value: JSON.stringify(150) },
      { key: 'base_state', value: JSON.stringify('Yucatán') },
      { key: 'nearby_municipalities', value: JSON.stringify(['Mérida', 'Kanasín', 'Umán', 'Conkal']) },
    ])
    .execute();

  // ==========================================
  // Tabla: audit_logs (Bitácora Inmutable)
  // ==========================================
  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('admin_id', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('admin_email', 'varchar(255)', (col) => col.notNull())
    .addColumn('action', 'varchar(50)', (col) => col.notNull())
    .addColumn('entity_type', 'varchar(100)', (col) => col.notNull())
    .addColumn('entity_id', 'uuid', (col) => col.notNull())
    .addColumn('old_value', 'jsonb')
    .addColumn('new_value', 'jsonb')
    .addColumn('ip_address', 'varchar(45)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await sql`CREATE INDEX idx_audit_logs_admin_email ON audit_logs (admin_email)`.execute(db);
  await sql`CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id)`.execute(db);
  await sql`CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC)`.execute(db);

  // ==========================================
  // Guardián de Inmutabilidad: bloquea UPDATE/DELETE sobre audit_logs
  // incondicionalmente, sin importar el rol que ejecute la query.
  // ==========================================
  await sql`
    CREATE OR REPLACE FUNCTION fn_block_audit_log_mutation()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'audit_logs es una tabla inmutable: % no está permitido.', TG_OP;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  await sql`
    CREATE TRIGGER trg_block_audit_log_mutation
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION fn_block_audit_log_mutation();
  `.execute(db);

  // ==========================================
  // Función genérica de auditoría: lee el contexto de sesión seteado por
  // `withAdminAuditContext` (app.current_admin_id / _email / _ip). Si no hay
  // contexto de admin (ej. una mutación disparada por el motor de checkout
  // de un cliente, no por el CMS), se omite el log silenciosamente — esto
  // es intencional: solo nos interesa auditar acciones ADMINISTRATIVAS.
  // ==========================================
  await sql`
    CREATE OR REPLACE FUNCTION fn_write_audit_log()
    RETURNS TRIGGER AS $$
    DECLARE
      v_admin_id TEXT;
      v_admin_email TEXT;
      v_admin_ip TEXT;
      v_action TEXT;
    BEGIN
      v_admin_email := current_setting('app.current_admin_email', true);

      IF v_admin_email IS NULL OR v_admin_email = '' THEN
        RETURN NEW;
      END IF;

      v_admin_id := current_setting('app.current_admin_id', true);
      v_admin_ip := current_setting('app.current_admin_ip', true);

      IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
      ELSIF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'products' AND NEW.is_deleted = true AND OLD.is_deleted = false THEN
          v_action := 'SOFT_DELETE';
        ELSIF TG_TABLE_NAME = 'users' THEN
          v_action := 'BAN';
        ELSE
          v_action := 'UPDATE';
        END IF;
      END IF;

      INSERT INTO audit_logs (admin_id, admin_email, action, entity_type, entity_id, old_value, new_value, ip_address)
      VALUES (
        CASE WHEN v_admin_id IS NULL OR v_admin_id = '' THEN NULL ELSE v_admin_id::uuid END,
        v_admin_email,
        v_action,
        TG_TABLE_NAME,
        NEW.id,
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        to_jsonb(NEW),
        COALESCE(v_admin_ip, 'unknown')
      );

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  // --- Triggers por tabla administrable ---

  await sql`
    CREATE TRIGGER trg_audit_products
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_write_audit_log();
  `.execute(db);

  await sql`
    CREATE TRIGGER trg_audit_product_variants
    AFTER INSERT OR UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION fn_write_audit_log();
  `.execute(db);

  await sql`
    CREATE TRIGGER trg_audit_coupons
    AFTER INSERT OR UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION fn_write_audit_log();
  `.execute(db);

  // Solo auditar `orders` cuando cambia `status` — evita ruido de updates
  // internos del motor de checkout que no tocan status (no aplica aquí
  // porque el trigger igual se omite sin contexto de admin, pero la
  // condición WHEN reduce el costo de disparo en el camino transaccional caliente).
  await sql`
    CREATE TRIGGER trg_audit_orders
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION fn_write_audit_log();
  `.execute(db);

  await sql`
    CREATE TRIGGER trg_audit_users_ban
    AFTER UPDATE OF is_banned ON users
    FOR EACH ROW
    WHEN (OLD.is_banned IS DISTINCT FROM NEW.is_banned)
    EXECUTE FUNCTION fn_write_audit_log();
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS trg_audit_users_ban ON users`.execute(db);
  await sql`DROP TRIGGER IF EXISTS trg_audit_orders ON orders`.execute(db);
  await sql`DROP TRIGGER IF EXISTS trg_audit_coupons ON coupons`.execute(db);
  await sql`DROP TRIGGER IF EXISTS trg_audit_product_variants ON product_variants`.execute(db);
  await sql`DROP TRIGGER IF EXISTS trg_audit_products ON products`.execute(db);
  await sql`DROP FUNCTION IF EXISTS fn_write_audit_log()`.execute(db);

  await sql`DROP TRIGGER IF EXISTS trg_block_audit_log_mutation ON audit_logs`.execute(db);
  await sql`DROP FUNCTION IF EXISTS fn_block_audit_log_mutation()`.execute(db);

  await db.schema.dropTable('audit_logs').execute();
  await db.schema.dropTable('system_settings').execute();
}
