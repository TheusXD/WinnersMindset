'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Trophy, Calendar, MapPin, Plus, Shield, Check, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Game {
  id: string;
  adversario: string;
  data_hora: string;
  local: string | null;
  categoria: string;
  esquema_tatico: '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1';
  gols_pro: number;
  gols_contra: number;
  status: 'agendado' | 'concluido' | 'cancelado';
  escalacao: Record<string, string> | null; // Mapeia "nome_posicao" -> "atleta_id"
}

interface Athlete {
  id: string;
  nome: string;
  categoria: string;
  posicao: string;
}

const MOCK_GAMES: Game[] = [
  {
    id: 'f0011c99-9c0b-4ef8-bb6d-6bb9bd380a01',
    adversario: 'Academia Cruzeiro Sub-15',
    data_hora: '2026-06-09T15:00:00Z',
    local: 'Estádio Municipal das Mangueiras',
    categoria: 'Sub-15',
    esquema_tatico: '4-3-3',
    gols_pro: 0,
    gols_contra: 0,
    status: 'agendado',
    escalacao: {
      GK: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      CB_L: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      ST: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    },
  },
  {
    id: 'f0011c99-9c0b-4ef8-bb6d-6bb9bd380a02',
    adversario: 'Bangu Esporte Clube Sub-15',
    data_hora: '2026-06-03T10:00:00Z',
    local: 'Arena Winner\'s Mindset',
    categoria: 'Sub-15',
    esquema_tatico: '4-3-3',
    gols_pro: 3,
    gols_contra: 1,
    status: 'concluido',
    escalacao: {
      GK: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      ST: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    },
  },
];

const MOCK_ATHLETES: Athlete[] = [
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', nome: 'Lucas Silva', categoria: 'Sub-15', posicao: 'Centroavante' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', nome: 'Enzo Gabriel', categoria: 'Sub-15', posicao: 'Meia' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', nome: 'Gabriel Santos', categoria: 'Sub-15', posicao: 'Zagueiro' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', nome: 'Matheus Oliveira', categoria: 'Sub-15', posicao: 'Goleiro' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', nome: 'Pedro Henrique', categoria: 'Sub-15', posicao: 'Ponta Direita' },
];

// Definition of layouts positions on the pitch (percentages from top and left)
const FORMATIONS = {
  '4-3-3': [
    { id: 'GK', label: 'GOL', top: '85%', left: '50%' },
    { id: 'CB_L', label: 'ZAG-E', top: '70%', left: '35%' },
    { id: 'CB_R', label: 'ZAG-D', top: '70%', left: '65%' },
    { id: 'LB', label: 'LE', top: '66%', left: '15%' },
    { id: 'RB', label: 'LD', top: '66%', left: '85%' },
    { id: 'DM', label: 'VOL', top: '50%', left: '50%' },
    { id: 'MC_L', label: 'MEI-E', top: '42%', left: '30%' },
    { id: 'MC_R', label: 'MEI-D', top: '42%', left: '70%' },
    { id: 'LW', label: 'PE', top: '20%', left: '20%' },
    { id: 'RW', label: 'PD', top: '20%', left: '80%' },
    { id: 'ST', label: 'ATA', top: '15%', left: '50%' },
  ],
  '4-4-2': [
    { id: 'GK', label: 'GOL', top: '85%', left: '50%' },
    { id: 'CB_L', label: 'ZAG-E', top: '70%', left: '35%' },
    { id: 'CB_R', label: 'ZAG-D', top: '70%', left: '65%' },
    { id: 'LB', label: 'LE', top: '66%', left: '15%' },
    { id: 'RB', label: 'LD', top: '66%', left: '85%' },
    { id: 'MC_L', label: 'VOL-E', top: '48%', left: '38%' },
    { id: 'MC_R', label: 'VOL-D', top: '48%', left: '62%' },
    { id: 'LM', label: 'ME-E', top: '42%', left: '15%' },
    { id: 'RM', label: 'MD-D', top: '42%', left: '85%' },
    { id: 'ST_L', label: 'ATA-E', top: '20%', left: '35%' },
    { id: 'ST_R', label: 'ATA-D', top: '20%', left: '65%' },
  ],
  '3-5-2': [
    { id: 'GK', label: 'GOL', top: '85%', left: '50%' },
    { id: 'CB_C', label: 'ZAG-C', top: '72%', left: '50%' },
    { id: 'CB_L', label: 'ZAG-E', top: '70%', left: '25%' },
    { id: 'CB_R', label: 'ZAG-D', top: '70%', left: '75%' },
    { id: 'DM_L', label: 'VOL-E', top: '52%', left: '35%' },
    { id: 'DM_R', label: 'VOL-D', top: '52%', left: '65%' },
    { id: 'LM', label: 'ALA-E', top: '40%', left: '15%' },
    { id: 'RM', label: 'ALA-D', top: '40%', left: '85%' },
    { id: 'AM', label: 'MEI', top: '35%', left: '50%' },
    { id: 'ST_L', label: 'ATA-E', top: '20%', left: '35%' },
    { id: 'ST_R', label: 'ATA-D', top: '20%', left: '65%' },
  ],
  '5-3-2': [
    { id: 'GK', label: 'GOL', top: '85%', left: '50%' },
    { id: 'CB_C', label: 'ZAG-C', top: '74%', left: '50%' },
    { id: 'CB_L', label: 'ZAG-E', top: '72%', left: '30%' },
    { id: 'CB_R', label: 'ZAG-D', top: '72%', left: '70%' },
    { id: 'LB', label: 'ALA-E', top: '65%', left: '15%' },
    { id: 'RB', label: 'ALA-D', top: '65%', left: '85%' },
    { id: 'DM', label: 'VOL', top: '50%', left: '50%' },
    { id: 'MC_L', label: 'MEI-E', top: '42%', left: '30%' },
    { id: 'MC_R', label: 'MEI-D', top: '42%', left: '70%' },
    { id: 'ST_L', label: 'ATA-E', top: '20%', left: '35%' },
    { id: 'ST_R', label: 'ATA-D', top: '20%', left: '65%' },
  ],
  '4-2-3-1': [
    { id: 'GK', label: 'GOL', top: '85%', left: '50%' },
    { id: 'CB_L', label: 'ZAG-E', top: '70%', left: '35%' },
    { id: 'CB_R', label: 'ZAG-D', top: '70%', left: '65%' },
    { id: 'LB', label: 'LE', top: '66%', left: '15%' },
    { id: 'RB', label: 'LD', top: '66%', left: '85%' },
    { id: 'DM_L', label: 'VOL-E', top: '53%', left: '35%' },
    { id: 'DM_R', label: 'VOL-D', top: '53%', left: '65%' },
    { id: 'AM_L', label: 'PE', top: '35%', left: '22%' },
    { id: 'AM_R', label: 'PD', top: '35%', left: '78%' },
    { id: 'AM', label: 'MEI', top: '32%', left: '50%' },
    { id: 'ST', label: 'ATA', top: '15%', left: '50%' },
  ],
};

export default function GamesPage() {
  const { isAdmin } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGame, setNewGame] = useState<{
    adversario: string;
    data_hora: string;
    local: string;
    categoria: string;
    esquema_tatico: '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1';
  }>({
    adversario: '',
    data_hora: '',
    local: '',
    categoria: 'Sub-15',
    esquema_tatico: '4-3-3',
  });

  // Tactical Board state
  const [activeBoardGame, setActiveBoardGame] = useState<Game | null>(null);
  const [lineup, setLineup] = useState<Record<string, string>>({});
  const [savingLineup, setSavingLineup] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Result state
  const [activeResultGame, setActiveResultGame] = useState<Game | null>(null);
  const [scorePro, setScorePro] = useState(0);
  const [scoreContra, setScoreContra] = useState(0);
  const [savingResult, setSavingResult] = useState(false);

  async function fetchGamesAndAthletes() {
    try {
      setLoading(true);
      const { data: gamesData, error: gamesError } = await supabase
        .from('jogos')
        .select('*')
        .order('data_hora', { ascending: false });

      const { data: athletesData, error: athletesError } = await supabase
        .from('atletas')
        .select('id, nome, categoria, posicao');

      if (gamesError || athletesError) throw gamesError || athletesError;

      if (gamesData) {
        setGames(gamesData as Game[]);
      } else {
        setGames([]);
      }

      if (athletesData) {
        setAthletes(athletesData as Athlete[]);
      } else {
        setAthletes([]);
      }
    } catch (err) {
      console.warn('Erro ao buscar dados de jogos do Supabase:', err);
      setGames([]);
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGamesAndAthletes();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGame.adversario || !newGame.data_hora) return;

    const gameData = {
      adversario: newGame.adversario,
      data_hora: newGame.data_hora,
      local: newGame.local,
      categoria: newGame.categoria,
      esquema_tatico: newGame.esquema_tatico,
      gols_pro: 0,
      gols_contra: 0,
      status: 'agendado' as const,
      escalacao: {},
    };

    try {
      const { error } = await supabase.from('jogos').insert([gameData]);
      if (error) throw error;

      setShowAddForm(false);
      setNewGame({
        adversario: '',
        data_hora: '',
        local: '',
        categoria: 'Sub-15',
        esquema_tatico: '4-3-3',
      });
      fetchGamesAndAthletes();
    } catch (err) {
      console.error('Erro ao agendar jogo no Supabase, cadastrando localmente:', err);
      const localNewGame: Game = {
        id: Math.random().toString(),
        ...gameData,
      };
      setGames(prev => [localNewGame, ...prev]);
      setShowAddForm(false);
    }
  };

  const openTacticalBoard = (game: Game) => {
    setActiveBoardGame(game);
    setLineup(game.escalacao || {});
    setSelectedPosition(null);
  };

  const selectPlayerForPosition = (athleteId: string) => {
    if (!selectedPosition) return;
    setLineup(prev => ({
      ...prev,
      [selectedPosition]: athleteId,
    }));
    setSelectedPosition(null);
  };

  const saveLineup = async () => {
    if (!activeBoardGame) return;
    setSavingLineup(true);

    try {
      const { error } = await supabase
        .from('jogos')
        .update({
          escalacao: lineup,
          esquema_tatico: activeBoardGame.esquema_tatico,
        })
        .eq('id', activeBoardGame.id);

      if (error) throw error;
      
      setActiveBoardGame(null);
      fetchGamesAndAthletes();
    } catch (err) {
      console.error('Erro ao salvar escalação no Supabase. Salvando localmente:', err);
      setGames(prev =>
        prev.map(g =>
          g.id === activeBoardGame.id ? { ...g, escalacao: lineup, esquema_tatico: activeBoardGame.esquema_tatico } : g
        )
      );
      setActiveBoardGame(null);
    } finally {
      setSavingLineup(false);
    }
  };

  const saveResult = async () => {
    if (!activeResultGame || savingResult) return;
    setSavingResult(true);

    try {
      const { error } = await supabase
        .from('jogos')
        .update({
          gols_pro: scorePro,
          gols_contra: scoreContra,
          status: 'concluido',
        })
        .eq('id', activeResultGame.id);

      if (error) throw error;

      setActiveResultGame(null);
      fetchGamesAndAthletes();
    } catch (err) {
      console.error('Erro ao salvar resultado no Supabase. Atualizando localmente:', err);
      setGames(prev =>
        prev.map(g =>
          g.id === activeResultGame.id
            ? { ...g, gols_pro: scorePro, gols_contra: scoreContra, status: 'concluido' }
            : g
        )
      );
      setActiveResultGame(null);
    } finally {
      setSavingResult(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Controle de Jogos e Escalações</h2>
          <p className="text-sm text-gray-400">Monte o time taticamente e registre placares de partidas.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agendar Confronto
          </button>
        )}
      </div>

      {/* Add Game Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-l-4 border-l-accent">
          <h3 className="text-lg font-bold text-white mb-4">Agendar Novo Jogo</h3>
          <form onSubmit={handleAddGame} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Adversário</label>
              <input
                type="text"
                required
                className="w-full glass-input"
                placeholder="Ex: Santos FC Sub-15"
                value={newGame.adversario}
                onChange={(e) => setNewGame({ ...newGame, adversario: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Data e Hora</label>
              <input
                type="datetime-local"
                required
                className="w-full glass-input"
                value={newGame.data_hora}
                onChange={(e) => setNewGame({ ...newGame, data_hora: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Local do Confronto</label>
              <input
                type="text"
                className="w-full glass-input"
                placeholder="Ex: Arena Winner's Mindset"
                value={newGame.local}
                onChange={(e) => setNewGame({ ...newGame, local: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria</label>
              <select
                className="w-full glass-input bg-neutral-dark/80"
                value={newGame.categoria}
                onChange={(e) => setNewGame({ ...newGame, categoria: e.target.value })}
              >
                {['Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Profissional'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Esquema Tático Padrão</label>
              <select
                className="w-full glass-input bg-neutral-dark/80"
                value={newGame.esquema_tatico}
                onChange={(e) => setNewGame({ ...newGame, esquema_tatico: e.target.value as '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1' })}
              >
                {['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1'].map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors"
              >
                Agendar Jogo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Result Entry Modal/Form */}
      {activeResultGame && (
        <div className="glass-card p-5 border-l-4 border-l-accent max-w-md mx-auto">
          <h3 className="text-lg font-bold text-white mb-4 text-center">Registrar Placar</h3>
          <p className="text-xs text-gray-400 text-center mb-4">{activeResultGame.adversario}</p>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">WINNER'S MINDSET</span>
              <input
                type="number"
                min="0"
                className="w-16 h-12 text-center text-xl font-bold bg-neutral-dark/80 border border-white/10 rounded-lg text-white"
                value={scorePro}
                onChange={(e) => setScorePro(parseInt(e.target.value) || 0)}
              />
            </div>
            <span className="text-xl font-bold text-gray-500">vs</span>
            <div className="text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">RIVAL</span>
              <input
                type="number"
                min="0"
                className="w-16 h-12 text-center text-xl font-bold bg-neutral-dark/80 border border-white/10 rounded-lg text-white"
                value={scoreContra}
                onChange={(e) => setScoreContra(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setActiveResultGame(null)}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={saveResult}
              disabled={savingResult}
              className="px-5 py-2.5 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingResult ? 'Salvando...' : 'Salvar Placar'}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Tactical Board */}
      {activeBoardGame && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pitch Area */}
          <div className="lg:col-span-2 glass-card p-4 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <div>
                <h3 className="font-bold text-white text-base">Escalação Tática Visual</h3>
                <p className="text-[10px] text-gray-400">Clique na posição para escolher o atleta.</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 font-semibold">Esquema:</span>
                <select
                  disabled={!isAdmin}
                  className="glass-input text-xs py-1.5 bg-neutral-dark/80 disabled:opacity-75 disabled:cursor-not-allowed"
                  value={activeBoardGame.esquema_tatico}
                  onChange={(e) =>
                    setActiveBoardGame({
                      ...activeBoardGame,
                      esquema_tatico: e.target.value as '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1',
                    })
                  }
                >
                  {['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1'].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Soccer Pitch Container */}
            <div className="pitch-bg w-full max-w-lg aspect-[3/4] p-4 flex flex-col justify-between">
              {/* Midfield Line */}
              <div className="absolute top-1/2 left-0 right-0 border-t border-white/10" />
              {/* Midfield Circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-white/10 rounded-full" />
              {/* Penalty Area Top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-x border-white/10" />
              {/* Penalty Area Bottom */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-white/10" />

              {/* Render Players in Positions */}
              {FORMATIONS[activeBoardGame.esquema_tatico].map((pos) => {
                const assignedAthleteId = lineup[pos.id];
                const athlete = athletes.find((a) => a.id === assignedAthleteId);
                const isSelected = selectedPosition === pos.id;

                return (
                  <button
                    key={pos.id}
                    onClick={() => setSelectedPosition(pos.id)}
                    disabled={!isAdmin}
                    style={{ top: pos.top, left: pos.left }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group transition-all duration-300 ${!isAdmin ? 'cursor-default' : ''}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-md transition-all ${
                        isSelected
                          ? 'bg-yellow-500 border-white text-neutral-dark scale-110'
                          : athlete
                          ? 'bg-accent border-primary text-neutral-dark font-extrabold'
                          : 'bg-neutral-dark/80 border-white/20 text-gray-400 group-hover:border-accent group-hover:text-accent'
                      }`}
                    >
                      {pos.label}
                    </div>
                    <span
                      className={`text-[9px] mt-1 px-1.5 py-0.5 rounded shadow-sm text-center max-w-[80px] truncate transition-colors ${
                        isSelected
                          ? 'bg-yellow-500 text-neutral-dark font-bold'
                          : athlete
                          ? 'bg-primary/95 text-white border border-primary-light/30'
                          : 'bg-black/40 text-gray-500 group-hover:text-white'
                      }`}
                    >
                      {athlete ? athlete.nome.split(' ')[0] : 'Vago'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Roster / Player Selection Panel */}
          <div className="glass-card p-5 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <h3 className="font-bold text-white text-sm">Elenco de Jogadores</h3>
              <button
                onClick={() => setSelectedPosition(null)}
                className="text-[10px] text-gray-400 hover:text-white"
              >
                Limpar seleção
              </button>
            </div>

            {!isAdmin ? (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px]">
                <p className="text-xs text-accent font-semibold mb-2">Escalação do Time:</p>
                {FORMATIONS[activeBoardGame.esquema_tatico].map((pos) => {
                  const assignedAthleteId = lineup[pos.id];
                  const athlete = athletes.find((a) => a.id === assignedAthleteId);
                  return (
                    <div
                      key={pos.id}
                      className="flex items-center justify-between p-2.5 bg-neutral-dark/80 rounded-xl border border-white/5 text-xs text-white"
                    >
                      <div>
                        <p className="font-semibold">{pos.label}: {athlete ? athlete.nome : 'Vago'}</p>
                        {athlete && <p className="text-[9px] text-gray-400">{athlete.posicao}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedPosition ? (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px]">
                <p className="text-xs text-yellow-500 font-medium">
                  Selecione o atleta para a posição:{' '}
                  <span className="font-bold uppercase bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 ml-1">
                    {selectedPosition}
                  </span>
                </p>
                {athletes
                  .filter((a) => a.categoria === activeBoardGame.categoria)
                  .map((athlete) => {
                    const isAssigned = Object.values(lineup).includes(athlete.id);
                    const isAssignedToThisPos = lineup[selectedPosition] === athlete.id;

                    return (
                      <button
                        key={athlete.id}
                        onClick={() => selectPlayerForPosition(athlete.id)}
                        disabled={isAssigned && !isAssignedToThisPos}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isAssignedToThisPos
                            ? 'bg-accent/10 border-accent text-accent font-bold'
                            : isAssigned
                            ? 'bg-white/2 border-white/5 text-gray-600 cursor-not-allowed'
                            : 'bg-neutral-dark/80 border-white/10 text-white hover:border-accent/40'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{athlete.nome}</p>
                          <p className="text-[9px] text-gray-400">{athlete.posicao}</p>
                        </div>
                        {isAssignedToThisPos && <Check className="h-4 w-4 text-accent" />}
                      </button>
                    );
                  })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-gray-500 py-12">
                <Shield className="h-8 w-8 text-white/10 mb-2" />
                <span>Clique em uma posição no campo para escalar um atleta do elenco {activeBoardGame.categoria}.</span>
              </div>
            )}

            <div className="border-t border-white/5 pt-4 mt-4 flex gap-2">
              <button
                onClick={() => setActiveBoardGame(null)}
                className="flex-1 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white text-center border border-white/10 rounded-lg"
              >
                Voltar
              </button>
              {isAdmin && (
                <button
                  onClick={saveLineup}
                  disabled={savingLineup}
                  className="flex-grow inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingLineup ? 'Salvando...' : 'Salvar Escalação'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Matches List */}
      {!activeBoardGame && (
        <div className="space-y-4">
          {games.map((game) => {
            const date = new Date(game.data_hora);
            const formattedDate = date.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={game.id} className="glass-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
                {/* Visual accent based on status */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

                <div className="pl-2 space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-primary text-accent rounded-full">
                      {game.categoria}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">
                      Tática: {game.esquema_tatico}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1 flex items-center">
                    {game.adversario}
                  </h3>
                  
                  {game.status === 'concluido' && (
                    <div className="flex items-center space-x-2 py-1.5">
                      <span className="text-xs font-bold px-3 py-1 bg-accent/25 text-accent border border-accent/20 rounded-lg">
                        Placar: {game.gols_pro} x {game.gols_contra}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-[10px] text-gray-400 pt-1">
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-accent" />
                      {formattedDate}
                    </span>
                    {game.local && (
                      <span className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-accent" />
                        {game.local}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-2 md:pl-0">
                  <button
                    onClick={() => openTacticalBoard(game)}
                    className="inline-flex items-center justify-center rounded-lg bg-primary/20 border border-primary-light/30 px-3.5 py-1.5 text-xs font-bold text-accent hover:bg-primary/45 transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Quadro Tático
                  </button>

                  {game.status === 'agendado' && isAdmin && (
                    <button
                      onClick={() => {
                        setActiveResultGame(game);
                        setScorePro(0);
                        setScoreContra(0);
                      }}
                      className="inline-flex items-center justify-center rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md"
                    >
                      <Trophy className="h-3.5 w-3.5 mr-1.5" />
                      Registrar Placar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
