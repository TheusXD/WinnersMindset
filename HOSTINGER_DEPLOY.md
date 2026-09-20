# Guia Completo de Implantação e Hospedagem na Hostinger
### Legionários Football Academy (Winner's Mindset)

Este guia ensina como colocar o sistema no ar usando **100% da infraestrutura da Hostinger** (Aplicação Node.js + Banco de Dados MySQL no phpMyAdmin), funcionando 24 horas por dia, 7 dias por semana, sem hibernar ou desligar.

---

## 1. Criando o Banco de Dados MySQL na Hostinger

1. Acesse o painel de controle da Hostinger (**hPanel**).
2. No menu lateral ou na busca, acesse **Bancos de Dados** -> **Gerenciamento**.
3. Na seção **Criar Novo Banco de Dados MySQL e Usuário**, preencha:
   * **Nome do Banco de Dados:** ex: `legionarios_db` (o painel adicionará seu prefixo, ficando algo como `u123456789_legionarios_db`).
   * **Nome de Usuário:** ex: `legionarios_user`.
   * **Senha:** crie uma senha forte e anote-a.
4. Clique em **Criar**.
5. Guarde essas informações. O endereço do servidor (Host) na Hostinger é sempre **`localhost`**.

---

## 2. Importando a Estrutura (Tabelas) no phpMyAdmin

1. Na lista de bancos de dados da Hostinger, localize o banco que acabou de criar e clique no botão **Entrar no phpMyAdmin**.
2. No topo do phpMyAdmin, clique na aba **Importar**.
3. No campo *Escolher arquivo*, selecione o arquivo que geramos no projeto:
   👉 **`database/schema_mysql.sql`**
4. Role até o final da página e clique em **Executar** (ou **Importar**).
5. Pronto! Todas as 17 tabelas, views e o usuário administrador padrão serão criados instantaneamente.

---

## 3. Configurando o Node.js no Painel da Hostinger

1. No hPanel da Hostinger, acesse **Websites** -> clique em **Gerenciar** no seu domínio.
2. Na barra de pesquisa ou no menu lateral, procure por **Node.js**.
3. Configure as opções básicas:
   * **Versão do Node.js:** Escolha **20.x** (LTS).
   * **Modo de Aplicação:** `Production`.
   * **Diretório da Aplicação:** `public_html` (ou raiz do domínio).
   * **Arquivo de Inicialização:** `server.js`.
4. Clique em **Salvar** ou **Criar**.

---

## 4. Configurando as Variáveis de Ambiente

No painel de configuração do Node.js na Hostinger, localize a seção de **Variáveis de Ambiente** (Environment Variables) e adicione as seguintes chaves com os dados do seu banco:

| Chave | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `MYSQL_HOST` | `localhost` | Sempre `localhost` na Hostinger |
| `MYSQL_PORT` | `3306` | Porta padrão do MySQL |
| `MYSQL_USER` | `u123456789_legionarios_user` | Usuário do banco criado no Passo 1 |
| `MYSQL_PASSWORD` | `SuaSenhaForteAqui` | Senha do banco criado no Passo 1 |
| `MYSQL_DATABASE` | `u123456789_legionarios_db` | Nome completo do banco criado |
| `JWT_SECRET` | `legionarios_chave_secreta_2026_jwt_token` | Uma frase longa e aleatória para assinar os logins |
| `NODE_ENV` | `production` | Modo de produção |
| `PORT` | `3000` | Porta interna gerenciada pelo Node.js |

---

## 5. Gerando o Pacote e Enviando os Arquivos

1. No seu computador, no terminal do projeto, execute o comando de build:
   ```bash
   npm run build
   ```
2. Após a compilação, suba os arquivos para a Hostinger (pode ser via **Gerenciador de Arquivos** do hPanel, **FTP** ou **Git**):
   * A pasta `.next`
   * A pasta `public`
   * A pasta `src`
   * O arquivo `server.js`
   * O arquivo `package.json`
   * O arquivo `next.config.ts`
3. No painel da Hostinger, clique em **Instalar Dependências** (ou abra o terminal SSH e rode `npm install --omit=dev`).
4. Clique em **Iniciar Aplicação** ou **Reiniciar Aplicação**.

---

## 6. Primeiro Acesso do Administrador

O banco de dados já foi inicializado com a conta mestre do Treinador/Administrador:

* **E-mail:** `admin@legionarios.com`
* **Senha padrão:** `admin123`

Assim que fizer o primeiro login:
1. Você terá acesso total a todas as categorias, treinos, atletas e financeiro.
2. Qualquer novo atleta que criar conta pelo botão de cadastro ficará na aba de **Solicitações** aguardando sua aprovação.
3. Você pode alterar a senha mestre a qualquer momento pela tela de redefinição de senha ou pelo seu perfil.
