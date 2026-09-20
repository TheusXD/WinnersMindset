-- Migration: Capacidades Físicas (1 a 5) e Pontos Totais na Avaliação
-- Date: 2026-09-20

ALTER TABLE public.avaliacoes
ADD COLUMN IF NOT EXISTS resistencia INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS equilibrio INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS flexibilidade INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS coordenacao_motora INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS potencia INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS pontos_total INT DEFAULT 15;

UPDATE public.avaliacoes
SET 
  resistencia = COALESCE(ROUND(nota_fisica / 2), 3),
  equilibrio = COALESCE(ROUND(nota_fisica / 2), 3),
  flexibilidade = COALESCE(ROUND(nota_fisica / 2), 3),
  coordenacao_motora = COALESCE(ROUND(nota_fisica / 2), 3),
  potencia = COALESCE(ROUND(nota_fisica / 2), 3),
  pontos_total = COALESCE(ROUND(nota_fisica / 2) * 5, 15)
WHERE pontos_total IS NULL OR pontos_total = 0;
