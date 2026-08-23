-- Security fix: atletas, treinos and presencas had "USING (true)" SELECT
-- policies, letting any authenticated user (not just admins/owners) read
-- every athlete's CPF/RG/medical history/address/guardian phone, every
-- personalized training note, and every absence justification. Restrict
-- reads to admin-or-owner, and add narrow "roster" views (non-sensitive
-- columns only) for the legitimate team-wide listing/dropdown use cases.
-- Also close the open INSERT on solicitacoes_cadastro, which allowed
-- anyone (including anon) to submit a request under someone else's
-- usuario_id with no ownership check.
-- Date: 2026-08-23

-- 1. atletas: restrict SELECT to admin or the linked user
DROP POLICY IF EXISTS "Allow authenticated select all athletes" ON public.atletas;
CREATE POLICY "Allow select own athlete row or if admin"
ON public.atletas
FOR SELECT
TO authenticated
USING (public.is_admin() OR usuario_id = auth.uid());

-- Non-sensitive columns only, readable by any authenticated user — used for
-- roster browsing, lineup/evaluation/payment dropdowns, etc. Views without
-- security_invoker run with the view owner's privileges, so this
-- intentionally bypasses the now-restrictive atletas RLS for just these
-- columns.
CREATE OR REPLACE VIEW public.atletas_roster
WITH (security_invoker = false) AS
SELECT id, nome, categoria, posicao, foto_url, status, peso, altura
FROM public.atletas;

REVOKE ALL ON public.atletas_roster FROM PUBLIC, anon;
GRANT SELECT ON public.atletas_roster TO authenticated;

-- 2. treinos: restrict SELECT to admin, the athlete a personalized training
--    is assigned to, or general team-wide trainings (atleta_id IS NULL)
DROP POLICY IF EXISTS "Allow authenticated select treinos" ON public.treinos;
CREATE POLICY "Allow select general or own training or if admin"
ON public.treinos
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR atleta_id IS NULL
  OR atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid())
);

-- 3. presencas: restrict SELECT to admin or the athlete's own record
DROP POLICY IF EXISTS "Allow authenticated select presencas" ON public.presencas;
CREATE POLICY "Allow select own presence or if admin"
ON public.presencas
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid())
);

-- Presence (present/absent) without the free-text absence justification —
-- keeps the "who attended training X" team view without exposing
-- potentially medical/personal absence reasons to teammates.
CREATE OR REPLACE VIEW public.presencas_roster
WITH (security_invoker = false) AS
SELECT id, treino_id, atleta_id, presente, created_at
FROM public.presencas;

REVOKE ALL ON public.presencas_roster FROM PUBLIC, anon;
GRANT SELECT ON public.presencas_roster TO authenticated;

-- 4. solicitacoes_cadastro: INSERT must be by the authenticated account
--    itself, not an arbitrary usuario_id chosen by the caller
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.solicitacoes_cadastro;
CREATE POLICY "Allow authenticated insert own request"
ON public.solicitacoes_cadastro
FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid());
