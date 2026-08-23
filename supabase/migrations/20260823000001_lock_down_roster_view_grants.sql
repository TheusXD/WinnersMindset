-- The roster views (atletas_roster, presencas_roster) are simple single-
-- table SELECTs, which Postgres treats as auto-updatable. Supabase's
-- default privilege grants on new public-schema objects gave `authenticated`
-- INSERT/UPDATE/DELETE on them too, on top of the intended SELECT — since
-- the views run with their owner's (postgres) privileges, that would have
-- let any authenticated user write to atletas/presencas through the view,
-- bypassing the RLS tightened in the previous migration.
-- Explicitly strip write access, keep read-only.
-- Date: 2026-08-23

REVOKE ALL ON public.atletas_roster FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.atletas_roster TO authenticated;

REVOKE ALL ON public.presencas_roster FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.presencas_roster TO authenticated;
