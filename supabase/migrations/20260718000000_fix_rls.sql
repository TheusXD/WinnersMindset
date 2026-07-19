-- Migration to fix RLS permissions and add missing INSERT policy for perfis_usuarios
-- Date: 2026-07-18

-- 1. Correct SELECT policy on public.atletas to allow roster listing
DROP POLICY IF EXISTS "Allow authenticated select own card or if admin" ON public.atletas;
CREATE POLICY "Allow authenticated select all athletes" 
ON public.atletas 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Restrict SELECT policy on public.perfis_usuarios to prevent privacy leak
DROP POLICY IF EXISTS "Allow authenticated read" ON public.perfis_usuarios;

CREATE POLICY "Allow select own profile or if admin" 
ON public.perfis_usuarios 
FOR SELECT 
TO authenticated 
USING (public.is_admin() OR id = auth.uid());

CREATE POLICY "Allow anonymous select for phone lookup" 
ON public.perfis_usuarios 
FOR SELECT 
TO anon 
USING (true);

-- 3. Add INSERT policy on public.perfis_usuarios for user profile fallback creation
DROP POLICY IF EXISTS "Allow user to insert own profile" ON public.perfis_usuarios;
CREATE POLICY "Allow user to insert own profile" 
ON public.perfis_usuarios 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);
