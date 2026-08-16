-- Security fix: block self-service privilege escalation on perfis_usuarios,
-- and remove the unrestricted anonymous SELECT that exposed the whole table.
-- Date: 2026-08-16

-- 1. Harden is_admin() against search_path hijacking (Supabase advisor warning)
ALTER FUNCTION public.is_admin() SET search_path = public;

-- 2. Bootstrap admin allowlist, mirrors STRICT_ADMIN_EMAILS in src/lib/auth-context.tsx.
--    Used only to preserve first-login bootstrap for known staff accounts;
--    it does NOT grant anything by itself, it just whitelists who may insert
--    themselves with an elevated cargo before any perfis_usuarios row exists.
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin_email(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT check_email = ANY (ARRAY[
    'admin_test@athle.com',
    'admin_test@legionarios.com',
    'admin@legionarios.com',
    'treinador@legionarios.com',
    'professor@wm.com',
    'matheus_silva4412@hotmail.com',
    'leandro.wm@hotmail.com',
    'miura.sport@hotmail.com'
  ]);
$$;

-- 3. Trigger that stops any authenticated user from granting themselves
--    'treinador'/'auxiliar' via direct INSERT/UPDATE on their own row.
--    RLS's WITH CHECK (auth.uid() = id) only protects row ownership, not
--    individual columns, so 'cargo' was previously self-editable by anyone.
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_email text := auth.jwt() ->> 'email';
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.cargo IN ('treinador', 'auxiliar')
       AND NOT public.is_admin()
       AND NOT public.is_bootstrap_admin_email(requester_email) THEN
      NEW.cargo := 'atleta';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.cargo IS DISTINCT FROM OLD.cargo AND NOT public.is_admin() THEN
      NEW.cargo := OLD.cargo;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation ON public.perfis_usuarios;
CREATE TRIGGER trg_prevent_privilege_escalation
BEFORE INSERT OR UPDATE ON public.perfis_usuarios
FOR EACH ROW
EXECUTE FUNCTION public.prevent_privilege_escalation();

-- 4. Remove the blanket anonymous read of perfis_usuarios (leaked every
--    user's name/email/phone/role to unauthenticated requests). Replace the
--    phone-based login lookup with a narrow RPC that only ever returns a
--    single email for an exact phone match.
DROP POLICY IF EXISTS "Allow anonymous select for phone lookup" ON public.perfis_usuarios;

CREATE OR REPLACE FUNCTION public.get_email_by_phone(phone_input text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.perfis_usuarios
  WHERE email IS NOT NULL
    AND telefone IS NOT NULL
    AND regexp_replace(telefone, '\D', '', 'g') = regexp_replace(phone_input, '\D', '', 'g')
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_email_by_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(text) TO anon, authenticated;
