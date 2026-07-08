-- Enable RLS and setup schema for Legionários Football Academy

-- 1. perfis_usuarios (Users profiles, links with Supabase Auth)
CREATE TABLE IF NOT EXISTS perfis_usuarios (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL CHECK (cargo IN ('treinador', 'auxiliar', 'atleta')) DEFAULT 'treinador',
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. atletas (Athletes)
CREATE TABLE IF NOT EXISTS atletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20')),
  posicao TEXT NOT NULL CHECK (posicao IN ('Goleiro', 'Zagueiro', 'Lateral Esquerdo', 'Lateral Direito', 'Volante', 'Meia', 'Ponta Esquerda', 'Ponta Direita', 'Centroavante')),
  peso NUMERIC,
  altura NUMERIC,
  foto_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'lesionado', 'inativo')) DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. treinos (Training sessions)
CREATE TABLE IF NOT EXISTS treinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20')),
  foco TEXT NOT NULL CHECK (foco IN ('Físico', 'Tático', 'Técnico', 'Coletivo')),
  status TEXT NOT NULL CHECK (status IN ('agendado', 'concluido', 'cancelado')) DEFAULT 'agendado',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. exercicios (Exercise Library)
CREATE TABLE IF NOT EXISTS exercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Passe', 'Finalização', 'Tática', 'Física', 'Goleiro', 'Drible')),
  duracao_minutos INTEGER DEFAULT 15,
  nivel TEXT NOT NULL CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')) DEFAULT 'iniciante',
  descricao TEXT,
  midia_url TEXT,
  midia_tipo TEXT CHECK (midia_tipo IN ('imagem', 'video', 'audio')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. presencas (Attendance)
CREATE TABLE IF NOT EXISTS presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id UUID REFERENCES treinos(id) ON DELETE CASCADE,
  atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE,
  presente BOOLEAN DEFAULT TRUE NOT NULL,
  justificativa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_treino_atleta UNIQUE (treino_id, atleta_id)
);

-- 6. avaliacoes (Performance evaluations)
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE,
  treinador_id UUID REFERENCES perfis_usuarios(id) ON DELETE SET NULL,
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  nota_tecnica NUMERIC CHECK (nota_tecnica >= 1 AND nota_tecnica <= 10) NOT NULL,
  nota_tatica NUMERIC CHECK (nota_tatica >= 1 AND nota_tatica <= 10) NOT NULL,
  nota_fisica NUMERIC CHECK (nota_fisica >= 1 AND nota_fisica <= 10) NOT NULL,
  nota_comportamental NUMERIC CHECK (nota_comportamental >= 1 AND nota_comportamental <= 10) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. jogos (Matches)
CREATE TABLE IF NOT EXISTS jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adversario TEXT NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20')),
  esquema_tatico TEXT CHECK (esquema_tatico IN ('4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1')) DEFAULT '4-3-3',
  gols_pro INTEGER DEFAULT 0 NOT NULL,
  gols_contra INTEGER DEFAULT 0 NOT NULL,
  status TEXT CHECK (status IN ('agendado', 'concluido', 'cancelado')) DEFAULT 'agendado',
  escalacao JSONB, -- Coordinates / player names mapped to positions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. estatisticas_jogos (Match player statistics)
CREATE TABLE IF NOT EXISTS estatisticas_jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID REFERENCES jogos(id) ON DELETE CASCADE,
  atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE,
  minutos_jogados INTEGER DEFAULT 0 NOT NULL,
  gols INTEGER DEFAULT 0 NOT NULL,
  assistencias INTEGER DEFAULT 0 NOT NULL,
  cartao_amarelo BOOLEAN DEFAULT FALSE NOT NULL,
  cartao_vermelho BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_jogo_atleta UNIQUE (jogo_id, atleta_id)
);

-- Enable RLS on all tables
ALTER TABLE perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estatisticas_jogos ENABLE ROW LEVEL SECURITY;

-- Create permissive public policies for development convenience
CREATE POLICY "Public Read/Write Access" ON perfis_usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON atletas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON treinos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON exercicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON presencas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON avaliacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON jogos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON estatisticas_jogos FOR ALL USING (true) WITH CHECK (true);
