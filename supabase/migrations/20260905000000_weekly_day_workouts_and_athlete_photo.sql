-- Migration to support flexible weekly day-by-day training management and athlete profile updates
-- Date: 2026-09-05

-- 1. Create treinos_semana_atleta table
CREATE TABLE IF NOT EXISTS public.treinos_semana_atleta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID NOT NULL REFERENCES public.atletas(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL CHECK (dia_semana IN ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo')),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT FALSE,
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.treinos_semana_atleta ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies if they exist
DROP POLICY IF EXISTS "Admin gerencia treinos semana atleta" ON public.treinos_semana_atleta;
DROP POLICY IF EXISTS "Atleta ve seus treinos da semana" ON public.treinos_semana_atleta;
DROP POLICY IF EXISTS "Atleta marca conclusao do treino" ON public.treinos_semana_atleta;

-- Policies for treinos_semana_atleta
CREATE POLICY "Admin gerencia treinos semana atleta"
  ON public.treinos_semana_atleta
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Atleta ve seus treinos da semana"
  ON public.treinos_semana_atleta
  FOR SELECT
  TO authenticated
  USING (atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()));

CREATE POLICY "Atleta marca conclusao do treino"
  ON public.treinos_semana_atleta
  FOR UPDATE
  TO authenticated
  USING (atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()))
  WITH CHECK (atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()));

-- 2. Allow athlete to update own record (e.g. foto_url) on public.atletas
DROP POLICY IF EXISTS "Allow athlete to update own photo and info" ON public.atletas;
CREATE POLICY "Allow athlete to update own photo and info"
  ON public.atletas
  FOR UPDATE
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());
