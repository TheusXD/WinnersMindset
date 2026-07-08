-- Migration to update Legionários Football Academy base management schema

-- 1. Add new columns to atletas table
ALTER TABLE atletas ADD COLUMN IF NOT EXISTS historico_medico TEXT;
ALTER TABLE atletas ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE atletas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE atletas ADD COLUMN IF NOT EXISTS telefone_responsavel TEXT;
ALTER TABLE atletas ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES perfis_usuarios(id) ON DELETE SET NULL;

-- 2. Add youtube_url to treinos table
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- 3. Create pagamentos table
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE,
  tipo_plano TEXT NOT NULL CHECK (tipo_plano IN ('mensal', 'anual')),
  status TEXT NOT NULL CHECK (status IN ('pago', 'pendente', 'atrasado')) DEFAULT 'pendente',
  vencimento DATE NOT NULL,
  valor NUMERIC,
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on pagamentos
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Create permissive public policy for development convenience
CREATE POLICY "Public Read/Write Access" ON pagamentos FOR ALL USING (true) WITH CHECK (true);


