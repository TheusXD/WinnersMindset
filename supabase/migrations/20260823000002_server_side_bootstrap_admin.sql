-- Security fix: STRICT_ADMIN_EMAILS / STRICT_TEST_STUDENTS were hardcoded
-- in the client bundle (src/lib/auth-context.tsx), including real staff
-- emails and dead test credentials — shipped to every visitor's browser.
-- The server already had the authoritative allowlist (is_bootstrap_admin_email,
-- used by the privilege-escalation trigger); expose two narrow RPCs so the
-- client no longer needs its own copy of the list to decide cargo/approval.
-- Date: 2026-08-23

-- 1. Lets the client ask "is the current session's email on the bootstrap
--    admin allowlist?" without knowing the list itself.
CREATE OR REPLACE FUNCTION public.is_bootstrap_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_bootstrap_admin_email(auth.jwt() ->> 'email');
$$;

REVOKE ALL ON FUNCTION public.is_bootstrap_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_bootstrap_admin() TO authenticated;

-- 2. Creates (or refreshes the email on) the caller's own perfis_usuarios
--    row the first time they log in with no profile yet, resolving cargo
--    from the server-side bootstrap allowlist instead of trusting the
--    client. Email is always taken from the verified JWT claim, never from
--    a client-supplied parameter.
CREATE OR REPLACE FUNCTION public.bootstrap_own_profile(display_nome text DEFAULT NULL)
RETURNS public.perfis_usuarios
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_email text := auth.jwt() ->> 'email';
  resolved_cargo text;
  resolved_foto text;
  result public.perfis_usuarios;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  resolved_cargo := CASE WHEN public.is_bootstrap_admin_email(jwt_email) THEN 'treinador' ELSE 'atleta' END;
  resolved_foto := CASE WHEN resolved_cargo IN ('treinador', 'auxiliar')
    THEN 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    ELSE NULL
  END;

  INSERT INTO public.perfis_usuarios (id, nome, cargo, foto_url, email)
  VALUES (
    auth.uid(),
    COALESCE(NULLIF(trim(display_nome), ''), split_part(jwt_email, '@', 1), 'Usuário'),
    resolved_cargo,
    resolved_foto,
    jwt_email
  )
  ON CONFLICT (id) DO UPDATE SET email = COALESCE(public.perfis_usuarios.email, EXCLUDED.email)
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_own_profile(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_own_profile(text) TO authenticated;
