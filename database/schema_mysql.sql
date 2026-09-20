-- ==============================================================================
-- LEGIONÁRIOS FOOTBALL ACADEMY (WINNER'S MINDSET)
-- Script de Criação e Configuração do Banco de Dados MySQL 8 / MariaDB
-- Compatível com phpMyAdmin e Hospedagem Hostinger
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabela de Usuários do Sistema (Substitui auth.users do Supabase)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `senha_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Perfis dos Usuários
CREATE TABLE IF NOT EXISTS `perfis_usuarios` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `cargo` ENUM('treinador', 'auxiliar', 'atleta') NOT NULL DEFAULT 'atleta',
  `foto_url` LONGTEXT NULL,
  `email` VARCHAR(255) NULL,
  `telefone` VARCHAR(50) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_perfis_usuarios_id` FOREIGN KEY (`id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Solicitações de Cadastro (Controle de Aprovação)
CREATE TABLE IF NOT EXISTS `solicitacoes_cadastro` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `usuario_id` VARCHAR(36) NULL,
  `email` VARCHAR(255) NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `telefone` VARCHAR(50) NULL,
  `data_nascimento` DATE NULL,
  `cpf` VARCHAR(20) NULL,
  `rg` VARCHAR(20) NULL,
  `nome_pai` VARCHAR(255) NULL,
  `nome_mae` VARCHAR(255) NULL,
  `endereco` TEXT NULL,
  `status` ENUM('pendente', 'aprovado', 'recusado') NOT NULL DEFAULT 'pendente',
  `posicao` VARCHAR(50) NULL,
  `categoria` VARCHAR(50) NULL,
  `peso` DECIMAL(5,2) NULL,
  `altura` DECIMAL(5,2) NULL,
  `nivel_atividade` INT DEFAULT 1,
  `resistencia` INT DEFAULT 3,
  `equilibrio` INT DEFAULT 3,
  `flexibilidade` INT DEFAULT 3,
  `coordenacao_motora` INT DEFAULT 3,
  `potencia` INT DEFAULT 3,
  `pontos_total` INT DEFAULT 15,
  `notas_admin` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_solicitacoes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Atletas
CREATE TABLE IF NOT EXISTS `atletas` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `usuario_id` VARCHAR(36) NULL UNIQUE,
  `nome` VARCHAR(255) NOT NULL,
  `data_nascimento` DATE NOT NULL,
  `categoria` VARCHAR(50) NOT NULL,
  `posicao` VARCHAR(50) NOT NULL,
  `peso` DECIMAL(5,2) NULL,
  `altura` DECIMAL(5,2) NULL,
  `nivel_atividade` INT DEFAULT 1,
  `data_ultima_pesagem` DATE DEFAULT (CURRENT_DATE),
  `foto_url` LONGTEXT NULL,
  `status` ENUM('ativo', 'lesionado', 'inativo') NOT NULL DEFAULT 'ativo',
  `historico_medico` TEXT NULL,
  `telefone` VARCHAR(50) NULL,
  `endereco` TEXT NULL,
  `telefone_responsavel` VARCHAR(50) NULL,
  `cpf` VARCHAR(20) NULL,
  `rg` VARCHAR(20) NULL,
  `nome_pai` VARCHAR(255) NULL,
  `nome_mae` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_atletas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.1 Tabela de Histórico Corporal (Acompanhamento Quadrimestral a cada 4 meses)
CREATE TABLE IF NOT EXISTS `historico_corporal` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `atleta_id` VARCHAR(36) NOT NULL,
  `peso` DECIMAL(5,2) NOT NULL,
  `altura` DECIMAL(5,2) NOT NULL,
  `imc` DECIMAL(4,1) NOT NULL,
  `nivel_atividade` INT NOT NULL DEFAULT 1,
  `data_medicao` DATE NOT NULL,
  `observacoes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_historico_corporal_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. View de Roster de Atletas (Acesso Rápido a Colunas Não Sensíveis)
CREATE OR REPLACE VIEW `atletas_roster` AS
SELECT 
  `id`, 
  `nome`, 
  `categoria`, 
  `posicao`, 
  `peso`, 
  `altura`, 
  `nivel_atividade`,
  `data_ultima_pesagem`,
  `status`, 
  `foto_url`, 
  `usuario_id`, 
  `created_at`
FROM `atletas`;

-- 6. Tabela de Treinos Coletivos / Individuais
CREATE TABLE IF NOT EXISTS `treinos` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `data_hora` DATETIME NOT NULL,
  `local` VARCHAR(255) NULL,
  `categoria` VARCHAR(50) NOT NULL,
  `foco` ENUM('Físico', 'Tático', 'Técnico', 'Coletivo') NOT NULL,
  `status` ENUM('agendado', 'concluido', 'cancelado') NOT NULL DEFAULT 'agendado',
  `descricao` TEXT NULL,
  `youtube_url` TEXT NULL,
  `atleta_id` VARCHAR(36) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_treinos_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Biblioteca de Exercícios
CREATE TABLE IF NOT EXISTS `exercicios` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `categoria` VARCHAR(50) NOT NULL,
  `duracao_minutos` INT DEFAULT 15,
  `nivel` ENUM('iniciante', 'intermediario', 'avancado') NOT NULL DEFAULT 'iniciante',
  `descricao` TEXT NULL,
  `midia_url` TEXT NULL,
  `midia_tipo` ENUM('imagem', 'video', 'audio') NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Presenças em Treinos
CREATE TABLE IF NOT EXISTS `presencas` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `treino_id` VARCHAR(36) NOT NULL,
  `atleta_id` VARCHAR(36) NOT NULL,
  `presente` BOOLEAN NOT NULL DEFAULT TRUE,
  `justificativa` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_treino_atleta` (`treino_id`, `atleta_id`),
  CONSTRAINT `fk_presencas_treino` FOREIGN KEY (`treino_id`) REFERENCES `treinos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_presencas_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. View de Presenças com Informações Básicas
CREATE OR REPLACE VIEW `presencas_roster` AS
SELECT 
  p.`id`, 
  p.`treino_id`, 
  p.`atleta_id`, 
  p.`presente`, 
  p.`justificativa`, 
  p.`created_at`, 
  a.`nome` AS `atleta_nome`, 
  a.`categoria` AS `atleta_categoria`, 
  a.`foto_url` AS `atleta_foto_url`
FROM `presencas` p
JOIN `atletas` a ON a.`id` = p.`atleta_id`;

-- 10. Avaliações de Desempenho
CREATE TABLE IF NOT EXISTS `avaliacoes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `atleta_id` VARCHAR(36) NOT NULL,
  `treinador_id` VARCHAR(36) NULL,
  `data_avaliacao` DATE NOT NULL,
  `nota_tecnica` DECIMAL(3,1) NOT NULL,
  `nota_tatica` DECIMAL(3,1) NOT NULL,
  `nota_fisica` DECIMAL(3,1) NOT NULL,
  `nota_comportamental` DECIMAL(3,1) NOT NULL,
  `resistencia` INT NOT NULL DEFAULT 3,
  `equilibrio` INT NOT NULL DEFAULT 3,
  `flexibilidade` INT NOT NULL DEFAULT 3,
  `coordenacao_motora` INT NOT NULL DEFAULT 3,
  `potencia` INT NOT NULL DEFAULT 3,
  `pontos_total` INT NOT NULL DEFAULT 15,
  `observacoes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_avaliacoes_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_avaliacoes_treinador` FOREIGN KEY (`treinador_id`) REFERENCES `perfis_usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Jogos e Partidas
CREATE TABLE IF NOT EXISTS `jogos` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `adversario` VARCHAR(255) NOT NULL,
  `data_hora` DATETIME NOT NULL,
  `local` VARCHAR(255) NULL,
  `categoria` VARCHAR(50) NOT NULL,
  `esquema_tatico` VARCHAR(50) DEFAULT '4-3-3',
  `gols_pro` INT NOT NULL DEFAULT 0,
  `gols_contra` INT NOT NULL DEFAULT 0,
  `status` ENUM('agendado', 'concluido', 'cancelado') NOT NULL DEFAULT 'agendado',
  `escalacao` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Estatísticas de Atletas por Jogo
CREATE TABLE IF NOT EXISTS `estatisticas_jogos` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `jogo_id` VARCHAR(36) NOT NULL,
  `atleta_id` VARCHAR(36) NOT NULL,
  `minutos_jogados` INT NOT NULL DEFAULT 0,
  `gols` INT NOT NULL DEFAULT 0,
  `assistencias` INT NOT NULL DEFAULT 0,
  `cartao_amarelo` BOOLEAN NOT NULL DEFAULT FALSE,
  `cartao_vermelho` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_jogo_atleta` (`jogo_id`, `atleta_id`),
  CONSTRAINT `fk_estatisticas_jogo` FOREIGN KEY (`jogo_id`) REFERENCES `jogos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_estatisticas_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Pagamentos e Mensalidades
CREATE TABLE IF NOT EXISTS `pagamentos` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `atleta_id` VARCHAR(36) NOT NULL,
  `tipo_plano` ENUM('mensal', 'anual') NOT NULL,
  `status` ENUM('pago', 'pendente', 'atrasado') NOT NULL DEFAULT 'pendente',
  `vencimento` DATE NOT NULL,
  `valor` DECIMAL(10,2) NULL,
  `data_pagamento` DATE NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pagamentos_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Planos de Treino Periódicos
CREATE TABLE IF NOT EXISTS `planos_treino` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `atleta_id` VARCHAR(36) NOT NULL,
  `treinador_id` VARCHAR(36) NULL,
  `titulo` VARCHAR(255) NOT NULL DEFAULT 'Plano de Treino',
  `data_inicio` DATE NOT NULL,
  `data_fim` DATE NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_planos_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_planos_treinador` FOREIGN KEY (`treinador_id`) REFERENCES `perfis_usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Dias da Semana do Plano de Treino
CREATE TABLE IF NOT EXISTS `plano_treino_dias` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `plano_id` VARCHAR(36) NOT NULL,
  `dia_semana` ENUM('segunda','terca','quarta','quinta','sexta') NOT NULL,
  `exercicios` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_plano_dia` (`plano_id`, `dia_semana`),
  CONSTRAINT `fk_plano_dias_plano` FOREIGN KEY (`plano_id`) REFERENCES `planos_treino` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Execuções e Checklists de Treino
CREATE TABLE IF NOT EXISTS `treino_execucoes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `plano_id` VARCHAR(36) NOT NULL,
  `plano_dia_id` VARCHAR(36) NOT NULL,
  `atleta_id` VARCHAR(36) NOT NULL,
  `data` DATE NOT NULL,
  `concluido` BOOLEAN NOT NULL DEFAULT FALSE,
  `concluido_em` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_execucao_data` (`plano_id`, `data`),
  CONSTRAINT `fk_execucoes_plano` FOREIGN KEY (`plano_id`) REFERENCES `planos_treino` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_execucoes_plano_dia` FOREIGN KEY (`plano_dia_id`) REFERENCES `plano_treino_dias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_execucoes_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Treinos Semanais Diretos do Atleta (com Feedback de Corações)
CREATE TABLE IF NOT EXISTS `treinos_semana_atleta` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `atleta_id` VARCHAR(36) NOT NULL,
  `dia_semana` ENUM('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo') NOT NULL,
  `titulo` VARCHAR(255) NOT NULL,
  `conteudo` TEXT NOT NULL,
  `concluido` BOOLEAN NOT NULL DEFAULT FALSE,
  `concluido_em` DATETIME NULL,
  `feedback` ENUM('executado', 'dificuldade', 'nao_executado') NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_treinos_semana_atleta` FOREIGN KEY (`atleta_id`) REFERENCES `atletas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- CARGA INICIAL: USUÁRIO ADMINISTRADOR PADRÃO
-- Email: admin@legionarios.com
-- Senha inicial: admin123
-- Hash bcrypt para 'admin123': $2b$10$tZ8QWd7mS64rNfO2Hek/KOh50hF9XbIqO8xXg2eW6f2L/rIomG.kC
-- ==============================================================================

INSERT INTO `usuarios` (`id`, `email`, `senha_hash`)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@legionarios.com',
  '$2b$10$tZ8QWd7mS64rNfO2Hek/KOh50hF9XbIqO8xXg2eW6f2L/rIomG.kC'
) ON DUPLICATE KEY UPDATE `email` = `email`;

INSERT INTO `perfis_usuarios` (`id`, `nome`, `cargo`, `email`, `foto_url`)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Administrador Principal',
  'treinador',
  'admin@legionarios.com',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
) ON DUPLICATE KEY UPDATE `cargo` = 'treinador';

SET FOREIGN_KEY_CHECKS = 1;
