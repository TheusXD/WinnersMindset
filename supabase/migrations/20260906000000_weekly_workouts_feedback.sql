-- Migration to add heart feedback/performance rating to treinos_semana_atleta
-- Values: 'executado' (💚), 'dificuldade' (💛), 'nao_executado' (❤️)
-- Date: 2026-09-06

ALTER TABLE public.treinos_semana_atleta 
ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('executado', 'dificuldade', 'nao_executado'));

-- Backfill any existing completed workouts as 'executado'
UPDATE public.treinos_semana_atleta 
SET feedback = 'executado' 
WHERE concluido = true AND feedback IS NULL;
