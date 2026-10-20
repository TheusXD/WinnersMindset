-- Migration: Fix numeric overflow for altura and peso
-- Expands NUMERIC(4,2) to NUMERIC(6,2) on solicitacoes_cadastro and historico_corporal
-- to prevent numeric field overflow if height is entered in cm (e.g. 155, 175) or larger values.

ALTER TABLE public.solicitacoes_cadastro 
  ALTER COLUMN altura TYPE NUMERIC(6,2),
  ALTER COLUMN peso TYPE NUMERIC(6,2);

ALTER TABLE public.historico_corporal 
  ALTER COLUMN altura TYPE NUMERIC(6,2),
  ALTER COLUMN peso TYPE NUMERIC(6,2),
  ALTER COLUMN imc TYPE NUMERIC(5,1);
