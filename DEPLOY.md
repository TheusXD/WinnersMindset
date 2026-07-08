# Guia de Implantação e Deploy - Legionários Football Academy

Este documento explica como configurar o banco de dados de produção no Supabase e implantar o projeto Next.js na Vercel (ou outra plataforma).

---

## 1. Configurando o Banco de Dados no Supabase

Para colocar o sistema em produção com um banco de dados limpo, siga os passos abaixo:

1. **Criar um novo projeto no Supabase**:
   - Vá para o [Supabase Dashboard](https://supabase.com/) e crie um novo projeto.
   - Guarde a senha do banco de dados e as credenciais (`URL` e `Anon Key`).

2. **Aplicar a Estrutura (Schema)**:
   - No menu lateral do painel do Supabase, acesse o **SQL Editor**.
   - Crie uma nova query e cole/execute o conteúdo dos arquivos de migração que estão na pasta `supabase/migrations/` **na ordem cronológica**:
     1. [20260606000000_init_schema.sql](supabase/migrations/20260606000000_init_schema.sql) (Criação de tabelas base e RLS)
     2. [20260621000000_update_schema.sql](supabase/migrations/20260621000000_update_schema.sql) (Novas colunas e tabela pagamentos)
     3. [20260621000001_personalized_trainings.sql](supabase/migrations/20260621000001_personalized_trainings.sql) (Relacionamento de treinos individuais)
     4. [20260708000000_secure_rls.sql](supabase/migrations/20260708000000_secure_rls.sql) (Políticas de segurança restritas, RLS seguro e tabela solicitações)

   *Nota: Caso utilize a CLI do Supabase localmente, você pode simplesmente rodar `supabase db push` com o novo projeto linkado.*

3. **(Opcional) Popular com dados de teste/desenvolvimento**:
   - Se precisar rodar o sistema localmente ou em ambiente de testes com dados simulados, execute o script [supabase/seed.sql](supabase/seed.sql) no SQL Editor. **Não execute este arquivo em produção**.

---

## 2. Preparando os Arquivos para o GitHub

O projeto já possui um arquivo `.gitignore` configurado para **não** subir arquivos de credenciais e variáveis de ambiente (como `.env.local` e `.env`). 

Para subir para o GitHub:
1. Inicialize o repositório git (se ainda não estiver inicializado):
   ```bash
   git init
   ```
2. Adicione os arquivos e faça o commit inicial:
   ```bash
   git add .
   git commit -m "feat: setup clean production schema and vercel support"
   ```
3. Crie um repositório no GitHub (de preferência privado por segurança) e associe ao projeto local:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Hospedagem na Vercel

1. Acesse o painel da [Vercel](https://vercel.com/) e faça login com sua conta do GitHub.
2. Clique em **Add New...** -> **Project**.
3. Importe o repositório do GitHub criado para este projeto.
4. Na seção **Environment Variables** (Variáveis de Ambiente), adicione as seguintes chaves com os valores correspondentes do seu novo projeto Supabase de produção:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase (ex: `https://xxxx.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key pública do seu projeto Supabase.
5. Clique em **Deploy**. A Vercel detectará que é um projeto Next.js, fará o build automaticamente e disponibilizará o link do sistema.

---

## 4. Primeiro Acesso do Administrador

Como o banco de dados de produção inicia completamente vazio e os atletas precisam de aprovação para acessar, siga este fluxo para criar o primeiro administrador:

1. Acesse a tela de cadastro do sistema implantado.
2. Crie uma conta utilizando um dos seguintes e-mails reservados para administradores:
   - `admin@legionarios.com`
   - `treinador@legionarios.com`
   - `professor@wm.com`
3. O sistema reconhecerá automaticamente este e-mail como administrador/treinador e criará o perfil correspondente na tabela `perfis_usuarios`.
4. Uma vez logado, você poderá acessar o painel administrativo para aprovar os cadastros de atletas que forem solicitados.
