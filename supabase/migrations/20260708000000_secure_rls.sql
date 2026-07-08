-- Migration to secure RLS policies and synchronize schemas
-- Date: 2026-07-08

-- 1. Drop existing constraints if they exist
ALTER TABLE public.atletas DROP CONSTRAINT IF EXISTS atletas_categoria_check;
ALTER TABLE public.treinos DROP CONSTRAINT IF EXISTS treinos_categoria_check;
ALTER TABLE public.jogos DROP CONSTRAINT IF EXISTS jogos_categoria_check;

-- 2. Add correct CHECK constraints allowing 'Sub-9' and 'Profissional'
ALTER TABLE public.atletas ADD CONSTRAINT atletas_categoria_check CHECK (categoria IN ('Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Profissional'));
ALTER TABLE public.treinos ADD CONSTRAINT treinos_categoria_check CHECK (categoria IN ('Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Profissional'));
ALTER TABLE public.jogos ADD CONSTRAINT jogos_categoria_check CHECK (categoria IN ('Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Profissional'));

-- 3. Synchronize missing schema columns
ALTER TABLE public.atletas ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.atletas ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE public.atletas ADD COLUMN IF NOT EXISTS nome_pai text;
ALTER TABLE public.atletas ADD COLUMN IF NOT EXISTS nome_mae text;

ALTER TABLE public.perfis_usuarios ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.perfis_usuarios ADD COLUMN IF NOT EXISTS telefone text;

-- 4. Create solicitacoes_cadastro table
CREATE TABLE IF NOT EXISTS public.solicitacoes_cadastro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome text NOT NULL,
  telefone text,
  data_nascimento date,
  cpf text,
  rg text,
  nome_pai text,
  nome_mae text,
  endereco text,
  status text NOT NULL DEFAULT 'pendente',
  posicao text,
  categoria text,
  notas_admin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Enable RLS on all tables
ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estatisticas_jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_cadastro ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing public read/write or full access policies
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.perfis_usuarios;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.atletas;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.treinos;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.exercicios;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.presencas;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.avaliacoes;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.jogos;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.estatisticas_jogos;
DROP POLICY IF EXISTS "Public Read/Write Access" ON public.pagamentos;
DROP POLICY IF EXISTS "Permitir acesso total apenas a usuários logados" ON public.perfis_usuarios;
DROP POLICY IF EXISTS "Permitir acesso total apenas a usuários logados" ON public.atletas;
DROP POLICY IF EXISTS "Permitir acesso total apenas a usuários logados" ON public.treinos;
DROP POLICY IF EXISTS "Permitir acesso total apenas a usuários logados" ON public.exercicios;
DROP POLICY IF EXISTS "Permitir acesso total apenas a usuários logados" ON public.presencas;
DROP POLICY IF EXISTS "Permitir acesso total apenas a usuários logados" ON public.avaliacoes;
DROP POLICY IF EXISTS "Permitir acesso total apenas a usuários logados" ON public.jogos;
DROP POLICY IF EXISTS "Permitir acesso total apenas a usuários logados" ON public.estatisticas_jogos;
DROP POLICY IF EXISTS "Allow all actions for admin" ON public.solicitacoes_cadastro;
DROP POLICY IF EXISTS "Allow users to read their own registration request" ON public.solicitacoes_cadastro;
DROP POLICY IF EXISTS "Allow anonymous insert to solicitacoes_cadastro" ON public.solicitacoes_cadastro;

-- 7. Create admin function helper to check role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfis_usuarios
    WHERE id = auth.uid() AND cargo IN ('treinador', 'auxiliar')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create secure, restricted policies

-- perfis_usuarios
CREATE POLICY "Allow authenticated read" ON public.perfis_usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user to update own profile" ON public.perfis_usuarios FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin all actions" ON public.perfis_usuarios FOR ALL TO authenticated USING (public.is_admin());

-- atletas
CREATE POLICY "Allow authenticated select own card or if admin" ON public.atletas FOR SELECT TO authenticated USING (public.is_admin() OR usuario_id = auth.uid());
CREATE POLICY "Allow admin all actions" ON public.atletas FOR ALL TO authenticated USING (public.is_admin());

-- treinos
CREATE POLICY "Allow authenticated select treinos" ON public.treinos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all actions" ON public.treinos FOR ALL TO authenticated USING (public.is_admin());

-- exercicios
CREATE POLICY "Allow authenticated select exercicios" ON public.exercicios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all actions" ON public.exercicios FOR ALL TO authenticated USING (public.is_admin());

-- presencas
CREATE POLICY "Allow authenticated select presencas" ON public.presencas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all actions" ON public.presencas FOR ALL TO authenticated USING (public.is_admin());

-- avaliacoes
CREATE POLICY "Allow select own evaluations or if admin" ON public.avaliacoes FOR SELECT TO authenticated USING (public.is_admin() OR atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()));
CREATE POLICY "Allow admin all actions" ON public.avaliacoes FOR ALL TO authenticated USING (public.is_admin());

-- jogos
CREATE POLICY "Allow authenticated select jogos" ON public.jogos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all actions" ON public.jogos FOR ALL TO authenticated USING (public.is_admin());

-- estatisticas_jogos
CREATE POLICY "Allow authenticated select stats" ON public.estatisticas_jogos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all actions" ON public.estatisticas_jogos FOR ALL TO authenticated USING (public.is_admin());

-- pagamentos
CREATE POLICY "Allow select own payments or if admin" ON public.pagamentos FOR SELECT TO authenticated USING (public.is_admin() OR atleta_id IN (SELECT id FROM public.atletas WHERE usuario_id = auth.uid()));
CREATE POLICY "Allow admin all actions" ON public.pagamentos FOR ALL TO authenticated USING (public.is_admin());

-- solicitacoes_cadastro
CREATE POLICY "Allow anonymous insert" ON public.solicitacoes_cadastro FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select own request or if admin" ON public.solicitacoes_cadastro FOR SELECT USING (usuario_id = auth.uid() OR (auth.role() = 'authenticated' AND public.is_admin()));
CREATE POLICY "Allow admin all actions" ON public.solicitacoes_cadastro FOR ALL TO authenticated USING (public.is_admin());
