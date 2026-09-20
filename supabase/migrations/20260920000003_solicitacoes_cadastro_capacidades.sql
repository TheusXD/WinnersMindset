-- Migration: Capacidades físicas e pontuação na solicitação de cadastro
-- Date: 2026-09-20

ALTER TABLE public.solicitacoes_cadastro 
ADD COLUMN IF NOT EXISTS resistencia INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS equilibrio INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS flexibilidade INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS coordenacao_motora INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS potencia INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS pontos_total INT DEFAULT 15;
