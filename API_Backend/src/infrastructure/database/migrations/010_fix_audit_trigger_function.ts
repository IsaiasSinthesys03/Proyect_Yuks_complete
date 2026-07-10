import { Kysely, sql } from 'kysely';

/**
 * Migración Correctiva: Bug en `fn_write_audit_log()` (detectado en
 * verificación end-to-end de la Fase 21).
 *
 * BUG ORIGINAL: la condición `TG_TABLE_NAME = 'products' AND NEW.is_deleted = true...`
 * intentaba acceder al campo `is_deleted` de `NEW` incluso cuando el trigger
 * disparaba sobre `users` (tabla sin esa columna). PL/pgSQL no garantiza
 * resolución diferida de campos de un `RECORD` dentro de una expresión `AND`
 * combinada — el acceso al campo se evalúa contra el tipo de fila real
 * (`users`), y falla con `record "new" has no field "is_deleted"` aunque
 * `TG_TABLE_NAME = 'products'` ya hubiera sido `false`.
 *
 * FIX: usar `to_jsonb(NEW)->>'is_deleted'` en vez de acceso directo al campo.
 * `to_jsonb()` funciona sobre cualquier tipo de fila sin error, y `->>`
 * sobre una clave inexistente retorna `NULL` en vez de lanzar excepción.
 */
export async function up(db: Kysely<any>): Promise<void> {
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
        IF TG_TABLE_NAME = 'products'
           AND (to_jsonb(NEW)->>'is_deleted') = 'true'
           AND (to_jsonb(OLD)->>'is_deleted') = 'false' THEN
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
}

export async function down(_db: Kysely<any>): Promise<void> {
  // Irreversible de forma segura: revertir significaría reintroducir el bug.
  // Si se necesita rollback completo, usar el `down()` de la migración 009.
}
