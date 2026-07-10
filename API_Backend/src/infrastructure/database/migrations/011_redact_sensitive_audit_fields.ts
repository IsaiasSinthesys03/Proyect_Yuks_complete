import { Kysely, sql } from 'kysely';

/**
 * Migración Correctiva: Redacción de Campos Sensibles en `audit_logs`.
 *
 * HALLAZGO DE SEGURIDAD (detectado en verificación end-to-end de la Fase 21):
 * `fn_write_audit_log()` captura la fila COMPLETA vía `to_jsonb(NEW)`/`to_jsonb(OLD)`.
 * Para la tabla `users`, esto incluye `password_hash` (Argon2id) — verificado
 * en una prueba real: un simple ban/unban de usuario quedó con el hash de
 * contraseña duplicado dentro de `audit_logs`. Aunque el hash es resistente
 * a fuerza bruta, NO hay razón de negocio para que viva en dos tablas; cada
 * copia adicional es superficie de exposición innecesaria si `audit_logs`
 * se filtra o se expone accidentalmente vía un endpoint de lectura mal
 * configurado en el futuro.
 *
 * FIX: usar el operador `-` de jsonb (resta de clave) para eliminar
 * `password_hash` del payload ANTES de insertarlo en `audit_logs`.
 * El operador es inocuo si la clave no existe (no falla en otras tablas).
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
      v_old_value JSONB;
      v_new_value JSONB;
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

      -- Redaccion: nunca persistir credenciales en la bitacora, sin importar
      -- la tabla. El operador jsonb de resta de clave es un no-op si la clave no existe.
      v_new_value := to_jsonb(NEW) - 'password_hash';
      v_old_value := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) - 'password_hash' ELSE NULL END;

      INSERT INTO audit_logs (admin_id, admin_email, action, entity_type, entity_id, old_value, new_value, ip_address)
      VALUES (
        CASE WHEN v_admin_id IS NULL OR v_admin_id = '' THEN NULL ELSE v_admin_id::uuid END,
        v_admin_email,
        v_action,
        TG_TABLE_NAME,
        NEW.id,
        v_old_value,
        v_new_value,
        COALESCE(v_admin_ip, 'unknown')
      );

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);
}

export async function down(_db: Kysely<any>): Promise<void> {
  // Irreversible de forma segura: revertir reintroduciría la fuga de
  // `password_hash` en la bitácora. No se provee rollback de este fix.
}
