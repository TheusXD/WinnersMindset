-- Fix Row-Level Security (RLS) on solicitacoes_cadastro
-- Allows public/anonymous registration submissions while ensuring status is always 'pendente'
-- and users cannot impersonate other authenticated accounts.

DROP POLICY IF EXISTS "Allow authenticated insert own request" ON public.solicitacoes_cadastro;
DROP POLICY IF EXISTS "Allow insert registration request" ON public.solicitacoes_cadastro;

CREATE POLICY "Allow insert registration request"
ON public.solicitacoes_cadastro
FOR INSERT
TO public
WITH CHECK (
  status = 'pendente'
  AND (usuario_id IS NULL OR auth.uid() IS NULL OR usuario_id = auth.uid())
);
