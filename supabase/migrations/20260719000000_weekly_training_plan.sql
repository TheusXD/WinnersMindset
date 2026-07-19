-- Migration to add weekly training plan schema, days, and executions tables with RLS
-- Date: 2026-07-19

-- 1. planos_treino table
CREATE TABLE IF NOT EXISTS public.planos_treino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID NOT NULL REFERENCES public.atletas(id) ON DELETE CASCADE,
  treinador_id UUID REFERENCES public.perfis_usuarios(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL DEFAULT 'Plano de Treino',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT periodo_valido CHECK (data_fim >= data_inicio)
);

-- 2. plano_treino_dias table (weekly template days)
CREATE TABLE IF NOT EXISTS public.plano_treino_dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES public.planos_treino(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL CHECK (dia_semana IN ('segunda','terca','quarta','quinta','sexta')),
  exercicios TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_plano_dia UNIQUE (plano_id, dia_semana)
);

-- 3. treino_execucoes table (concrete dates for workout status checks)
CREATE TABLE IF NOT EXISTS public.treino_execucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES public.planos_treino(id) ON DELETE CASCADE,
  plano_dia_id UUID NOT NULL REFERENCES public.plano_treino_dias(id) ON DELETE CASCADE,
  atleta_id UUID NOT NULL REFERENCES public.atletas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT FALSE,
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_execucao_data UNIQUE (plano_id, data)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.planos_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_treino_dias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_execucoes ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies

-- planos_treino
CREATE POLICY "Admin gerencia planos" 
ON public.planos_treino 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Atleta ve proprio plano" 
ON public.planos_treino 
FOR SELECT 
TO authenticated
USING (atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()));

-- plano_treino_dias
CREATE POLICY "Admin gerencia dias do plano" 
ON public.plano_treino_dias 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Atleta ve dias do proprio plano" 
ON public.plano_treino_dias 
FOR SELECT 
TO authenticated
USING (plano_id IN (SELECT p.id FROM public.planos_treino p JOIN public.atletas a ON a.id = p.atleta_id WHERE a.usuario_id = auth.uid()));

-- treino_execucoes
CREATE POLICY "Admin gerencia execucoes" 
ON public.treino_execucoes 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Atleta ve proprias execucoes" 
ON public.treino_execucoes 
FOR SELECT 
TO authenticated
USING (atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()));

CREATE POLICY "Atleta marca proprio check" 
ON public.treino_execucoes 
FOR UPDATE 
TO authenticated
USING (atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()))
WITH CHECK (atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()));
