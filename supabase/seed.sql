-- Seed data for Legionários Football Academy
-- Use this file to populate your development/staging database with mock data.

-- 1. Insert default user profiles
INSERT INTO perfis_usuarios (id, nome, cargo, foto_url) VALUES 
('c48f2195-20d0-44ff-a0ff-517b62900000', 'Treinador Matheus', 'treinador', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'),
('d68f2195-20d0-44ff-a0ff-517b62900000', 'Lucas Silva', 'atleta', 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert mock data for athletes (Atletas)
INSERT INTO atletas (id, nome, data_nascimento, categoria, posicao, peso, altura, status, foto_url) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lucas Silva', '2011-04-12', 'Sub-15', 'Centroavante', 62.5, 1.72, 'ativo', 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=150&auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Enzo Gabriel', '2011-09-25', 'Sub-15', 'Meia', 54.0, 1.65, 'ativo', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Gabriel Santos', '2011-01-30', 'Sub-15', 'Zagueiro', 68.0, 1.80, 'ativo', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=150&auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Matheus Oliveira', '2011-07-15', 'Sub-15', 'Goleiro', 65.2, 1.78, 'lesionado', 'https://images.unsplash.com/photo-1525916805047-75e11ee94fd8?w=150&auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Pedro Henrique', '2011-11-02', 'Sub-15', 'Ponta Direita', 51.5, 1.62, 'ativo', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=150&auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'João Pedro', '2009-02-14', 'Sub-17', 'Centroavante', 71.0, 1.83, 'ativo', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=150&auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Felipe Santos', '2009-08-08', 'Sub-17', 'Volante', 69.5, 1.76, 'ativo', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Gustavo Lima', '2009-05-19', 'Sub-17', 'Lateral Esquerdo', 63.8, 1.71, 'ativo', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- Update athletes details
UPDATE atletas SET 
  usuario_id = 'd68f2195-20d0-44ff-a0ff-517b62900000',
  telefone = '(21) 99999-8888',
  endereco = 'Rua das Laranjeiras, 123 - Rio de Janeiro',
  telefone_responsavel = '(21) 98888-7777',
  historico_medico = 'Sem alergias. Histórico de asma na infância controlada. Cartão de vacina em dia.'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

UPDATE atletas SET 
  telefone = '(21) 97777-6666',
  endereco = 'Rua General Severiano, 456 - Rio de Janeiro',
  telefone_responsavel = '(21) 96666-5555',
  historico_medico = 'Nenhuma restrição médica conhecida. Saudável.'
WHERE id <> 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- 3. Insert default exercises (Exercícios)
INSERT INTO exercicios (id, titulo, categoria, duracao_minutos, nivel, descricao, midia_tipo, midia_url) VALUES
('e0011c99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Treino de Finalização Rápida', 'Finalização', 20, 'intermediario', 'Exercício focado em finalização de primeira após receber passe lateral. Exige rapidez de reação e precisão no chute no canto do goleiro.', 'imagem', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=80'),
('e0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Rondos 4v2 Pressão e Transição', 'Tática', 15, 'intermediario', 'Rondos em espaço reduzido. O objetivo é manter a posse de bola rápida e mudar de direção rapidamente. Os defensores tentam interceptar e transitar para mini-gols.', 'video', 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop&q=80'),
('e0011c99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Circuito de Agilidade Física', 'Física', 25, 'avancado', 'Trabalho de pliometria, corrida em zigue-zague com cones e barreiras, seguido de sprint curto de 10 metros com bola.', 'imagem', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert default training sessions (Treinos)
INSERT INTO treinos (id, titulo, data_hora, local, categoria, foco, status, descricao) VALUES
('b0011c99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Treino Tático - Posicionamento defensivo', CURRENT_TIMESTAMP + INTERVAL '2 hours', 'Campo Principal - Arena Legionários', 'Sub-15', 'Tático', 'agendado', 'Sessão com foco em transição defensiva e basculação de linha de 4 zagueiros.'),
('b0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Trabalho de Potência e Finalização', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Campo Auxiliar 1', 'Sub-15', 'Técnico', 'concluido', 'Sessão concluída. Foco em chutes de média distância e cruzamentos na área.'),
('b0011c99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Treino Integrado Sub-17', CURRENT_TIMESTAMP + INTERVAL '1 day', 'Campo Principal', 'Sub-17', 'Coletivo', 'agendado', 'Jogo-treino para simulação tática do próximo confronto.')
ON CONFLICT (id) DO NOTHING;

-- Update treinos with youtube URLs
UPDATE treinos SET youtube_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' WHERE id = 'b0011c99-9c0b-4ef8-bb6d-6bb9bd380a01';
UPDATE treinos SET youtube_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' WHERE id = 'b0011c99-9c0b-4ef8-bb6d-6bb9bd380a03';

-- 5. Insert personalized training for Lucas Silva
INSERT INTO treinos (titulo, data_hora, local, categoria, foco, status, descricao, youtube_url, atleta_id) VALUES
(
  'Aprimoramento de Pivô e Finalização', 
  CURRENT_TIMESTAMP + INTERVAL '1 day', 
  'Campo Auxiliar 2', 
  'Sub-15', 
  'Técnico', 
  'agendado', 
  'Lucas, seu foco neste treino individual é trabalhar a recepção de bola de costas para a marcação (pivô), fazendo o giro rápido sobre o zagueiro e finalizando com firmeza de perna direita. Assista ao vídeo de exemplo e preste atenção no movimento do corpo antes do chute.', 
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert default attendance records (Presenças)
INSERT INTO presencas (treino_id, atleta_id, presente, justificativa) VALUES
('b0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', TRUE, NULL),
('b0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', TRUE, NULL),
('b0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', TRUE, NULL),
('b0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', FALSE, 'Lesão muscular constatada no DM.'),
('b0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', TRUE, NULL)
ON CONFLICT (treino_id, atleta_id) DO NOTHING;

-- 7. Insert default evaluations (Avaliações)
INSERT INTO avaliacoes (atleta_id, treinador_id, data_avaliacao, nota_tecnica, nota_tatica, nota_fisica, nota_comportamental, observacoes) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c48f2195-20d0-44ff-a0ff-517b62900000', CURRENT_DATE - INTERVAL '10 days', 8.5, 7.0, 9.0, 8.0, 'Excelente força física e explosão, boa finalização de perna direita. Precisa melhorar posicionamento em impedimentos.'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c48f2195-20d0-44ff-a0ff-517b62900000', CURRENT_DATE, 9.0, 7.5, 9.0, 8.5, 'Evolução tática visível nos treinos de movimentação em pivô.'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c48f2195-20d0-44ff-a0ff-517b62900000', CURRENT_DATE, 8.8, 8.5, 7.2, 9.0, 'Meia armador clássico, ótima visão de jogo e passes verticais. Precisa aprimorar recomposição e força física.')
ON CONFLICT (id) DO NOTHING;

-- 8. Insert default matches (Jogos)
INSERT INTO jogos (id, adversario, data_hora, local, categoria, esquema_tatico, gols_pro, gols_contra, status, escalacao) VALUES
('f0011c99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Academia Cruzeiro Sub-15', CURRENT_TIMESTAMP + INTERVAL '3 days', 'Estádio Municipal das Mangueiras', 'Sub-15', '4-3-3', 0, 0, 'agendado', 
 '{"titulares": [{"pos": "Goleiro", "nome": "Matheus Oliveira"}, {"pos": "Lateral Direito", "nome": "Pedro Henrique"}, {"pos": "Zagueiro", "nome": "Gabriel Santos"}, {"pos": "Centroavante", "nome": "Lucas Silva"}]}'::jsonb),
 ('f0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Bangu Esporte Clube Sub-15', CURRENT_TIMESTAMP - INTERVAL '3 days', 'Arena Legionários', 'Sub-15', '4-3-3', 3, 1, 'concluido',
 '{"titulares": [{"pos": "Goleiro", "nome": "Matheus Oliveira"}, {"pos": "Centroavante", "nome": "Lucas Silva"}]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 9. Insert default match stats
INSERT INTO estatisticas_jogos (jogo_id, atleta_id, minutos_jogados, gols, assistencias, cartao_amarelo, cartao_vermelho) VALUES
('f0011c99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 80, 2, 1, FALSE, FALSE),
('f0011c99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 75, 1, 1, TRUE, FALSE)
ON CONFLICT (jogo_id, atleta_id) DO NOTHING;

-- 10. Insert default payments (Pagamentos)
INSERT INTO pagamentos (atleta_id, tipo_plano, status, vencimento, valor, data_pagamento) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'mensal', 'pendente', '2026-07-05', 150.00, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'mensal', 'pago', '2026-06-10', 150.00, '2026-06-08'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'anual', 'pago', '2026-12-15', 1200.00, '2025-12-14'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'mensal', 'atrasado', '2026-06-05', 150.00, NULL),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'mensal', 'pago', '2026-06-20', 150.00, '2026-06-19')
ON CONFLICT DO NOTHING;
