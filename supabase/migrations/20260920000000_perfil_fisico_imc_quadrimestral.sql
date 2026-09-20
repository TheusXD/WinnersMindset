-- Migration: Perfil Físico, IMC e Acompanhamento Quadrimestral (Ciclo de 4 Meses)
-- Date: 2026-09-20

-- 1. Campos físicos na tabela de solicitações de cadastro
ALTER TABLE public.solicitacoes_cadastro 
ADD COLUMN IF NOT EXISTS peso NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS altura NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS nivel_atividade INT DEFAULT 3;

-- 2. Campos físicos e controle de última pesagem no cadastro dos atletas
ALTER TABLE public.atletas 
ADD COLUMN IF NOT EXISTS nivel_atividade INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS data_ultima_pesagem DATE DEFAULT CURRENT_DATE;

-- Atualizar atletas existentes para ter data de pesagem inicial se nula
UPDATE public.atletas
SET data_ultima_pesagem = CURRENT_DATE
WHERE data_ultima_pesagem IS NULL;

-- 3. Tabela de Histórico Corporal (Acompanhamento Periódico Quadrimestral)
CREATE TABLE IF NOT EXISTS public.historico_corporal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID NOT NULL REFERENCES public.atletas(id) ON DELETE CASCADE,
  peso NUMERIC(5,2) NOT NULL,
  altura NUMERIC(4,2) NOT NULL,
  imc NUMERIC(4,1) NOT NULL,
  nivel_atividade INT NOT NULL DEFAULT 3,
  data_medicao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_historico_corporal_atleta_id ON public.historico_corporal(atleta_id);
CREATE INDEX IF NOT EXISTS idx_historico_corporal_data_medicao ON public.historico_corporal(data_medicao DESC);

-- 4. Habilitar RLS e Políticas de Segurança
ALTER TABLE public.historico_corporal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin gerencia historico corporal" ON public.historico_corporal;
DROP POLICY IF EXISTS "Atleta ve seu proprio historico corporal" ON public.historico_corporal;

-- Administrador / Treinador pode ver, cadastrar, alterar e remover medições
CREATE POLICY "Admin gerencia historico corporal"
  ON public.historico_corporal
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Atleta pode visualizar seu próprio histórico de evolução física
CREATE POLICY "Atleta ve seu proprio historico corporal"
  ON public.historico_corporal
  FOR SELECT
  TO authenticated
  USING (atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()));
