'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, MapPin, Users, CheckCircle, XCircle, AlertCircle, Save, TrendingUp, Video, Edit } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Training {
  id: string;
  titulo: string;
  data_hora: string;
  local: string | null;
  categoria: string;
  foco: 'Físico' | 'Tático' | 'Técnico' | 'Coletivo';
  status: 'agendado' | 'concluido' | 'cancelado';
  descricao: string | null;
  youtube_url?: string | null;
}

interface Athlete {
  id: string;
  nome: string;
  categoria: string;
  posicao: string;
}

interface AttendanceState {
  atleta_id: string;
  nome: string;
  presente: boolean;
  justificativa: string;
}



export default function TrainingsPage() {
  const { isAdmin } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  // New Training Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTraining, setNewTraining] = useState<{
    titulo: string;
    data_hora: string;
    local: string;
    categoria: string;
    foco: 'Físico' | 'Tático' | 'Técnico' | 'Coletivo';
    descricao: string;
    youtube_url: string;
  }>({
    titulo: '',
    data_hora: '',
    local: '',
    categoria: 'Sub-15',
    foco: 'Tático',
    descricao: '',
    youtube_url: '',
  });

  // Roll-call State
  const [activeRollCallTraining, setActiveRollCallTraining] = useState<Training | null>(null);
  const [attendance, setAttendance] = useState<AttendanceState[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  async function fetchTrainingsAndAthletes() {
    try {
      setLoading(true);
      const { data: trainingData, error: trainingError } = await supabase
        .from('treinos')
        .select('*')
        .order('data_hora', { ascending: false });

      const { data: athleteData, error: athleteError } = await supabase
        .from('atletas')
        .select('id, nome, categoria, posicao');

      if (trainingError || athleteError) throw trainingError || athleteError;

      if (trainingData) {
        setTrainings(trainingData as Training[]);
      } else {
        setTrainings([]);
      }

      if (athleteData) {
        setAthletes(athleteData as Athlete[]);
      } else {
        setAthletes([]);
      }
    } catch (err) {
      console.warn('Erro ao buscar dados do Supabase para treinos:', err);
      setTrainings([]);
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrainingsAndAthletes();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraining.titulo || !newTraining.data_hora) return;

    const trainingData = {
      titulo: newTraining.titulo,
      data_hora: newTraining.data_hora,
      local: newTraining.local,
      categoria: newTraining.categoria,
      foco: newTraining.foco,
      status: 'agendado' as const,
      descricao: newTraining.descricao,
      youtube_url: newTraining.youtube_url.trim() || null,
    };

    try {
      const { error } = await supabase.from('treinos').insert([trainingData]);
      if (error) throw error;

      setShowAddForm(false);
      setNewTraining({
        titulo: '',
        data_hora: '',
        local: '',
        categoria: 'Sub-15',
        foco: 'Tático',
        descricao: '',
        youtube_url: '',
      });
      fetchTrainingsAndAthletes();
    } catch (err) {
      console.error('Erro ao adicionar treino no Supabase. Inserindo localmente:', err);
      const localNewTraining: Training = {
        id: Math.random().toString(),
        ...trainingData,
      };
      setTrainings(prev => [localNewTraining, ...prev]);
      setShowAddForm(false);
    }
  };

  // Evolution update states
  const [activeEvolutionAthlete, setActiveEvolutionAthlete] = useState<{ id: string; nome: string } | null>(null);
  const [evolutionData, setEvolutionData] = useState({
    peso: '',
    altura: '',
    notaFisica: 7.0,
    notaTatica: 7.0,
    observacoes: '',
  });

  const handleOpenEvolution = async (atletaId: string, nome: string) => {
    try {
      const { data, error } = await supabase
        .from('atletas')
        .select('peso, altura')
        .eq('id', atletaId)
        .single();
      
      if (!error && data) {
        setEvolutionData({
          peso: data.peso ? data.peso.toString() : '',
          altura: data.altura ? data.altura.toString() : '',
          notaFisica: 7.0,
          notaTatica: 7.0,
          observacoes: '',
        });
      } else {
        setEvolutionData({ peso: '', altura: '', notaFisica: 7.0, notaTatica: 7.0, observacoes: '' });
      }
    } catch {
      setEvolutionData({ peso: '', altura: '', notaFisica: 7.0, notaTatica: 7.0, observacoes: '' });
    }
    setActiveEvolutionAthlete({ id: atletaId, nome });
  };

  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvolutionAthlete) return;

    try {
      // 1. Update weight & height
      const { error: athleteError } = await supabase
        .from('atletas')
        .update({
          peso: evolutionData.peso ? parseFloat(evolutionData.peso) : null,
          altura: evolutionData.altura ? parseFloat(evolutionData.altura) : null,
        })
        .eq('id', activeEvolutionAthlete.id);

      if (athleteError) throw athleteError;

      // 2. Insert evaluation record
      const { error: evalError } = await supabase.from('avaliacoes').insert([{
        atleta_id: activeEvolutionAthlete.id,
        nota_tecnica: 7.0,
        nota_tatica: Number(evolutionData.notaTatica),
        nota_fisica: Number(evolutionData.notaFisica),
        nota_comportamental: 7.0,
        observacoes: evolutionData.observacoes || null,
        data_avaliacao: new Date().toISOString().split('T')[0],
      }]);

      if (evalError) throw evalError;

      setActiveEvolutionAthlete(null);
      fetchTrainingsAndAthletes();
    } catch (err) {
      console.error('Erro ao registrar evolução no Supabase. Efetuando localmente:', err);
      // Fallback local
      setAthletes(prev =>
        prev.map(a =>
          a.id === activeEvolutionAthlete.id
            ? { 
                ...a, 
                peso: evolutionData.peso ? parseFloat(evolutionData.peso) : null, 
                altura: evolutionData.altura ? parseFloat(evolutionData.altura) : null 
              }
            : a
        )
      );
      setActiveEvolutionAthlete(null);
    }
  };

  const startRollCall = async (training: Training) => {
    setActiveRollCallTraining(training);
    setSavingAttendance(false);

    try {
      // 1. Get filtered athletes for the category
      const categoryAthletes = athletes.filter(a => a.categoria === training.categoria);

      // 2. Fetch existing attendance records for this training
      const { data: existingAttendance, error } = await supabase
        .from('presencas')
        .select('*')
        .eq('treino_id', training.id);

      if (error) throw error;

      // 3. Map to attendance state
      const initialAttendance = categoryAthletes.map((athlete) => {
        const record = existingAttendance?.find(r => r.atleta_id === athlete.id);
        return {
          atleta_id: athlete.id,
          nome: athlete.nome,
          presente: record ? record.presente : true,
          justificativa: record?.justificativa || '',
        };
      });

      setAttendance(initialAttendance);
    } catch (err) {
      console.warn('Erro ao buscar presenças do Supabase, inicializando localmente:', err);
      
      // Fallback: create default roster with true presence
      const categoryAthletes = athletes.filter(a => a.categoria === training.categoria);
      const initialAttendance = categoryAthletes.map((athlete) => ({
        atleta_id: athlete.id,
        nome: athlete.nome,
        presente: true,
        justificativa: '',
      }));
      setAttendance(initialAttendance);
    }
  };

  const handleTogglePresence = (atletaId: string) => {
    setAttendance(prev =>
      prev.map(item =>
        item.atleta_id === atletaId ? { ...item, presente: !item.presente, justificativa: !item.presente ? '' : item.justificativa } : item
      )
    );
  };

  const handleJustificationChange = (atletaId: string, text: string) => {
    setAttendance(prev =>
      prev.map(item =>
        item.atleta_id === atletaId ? { ...item, justificativa: text } : item
      )
    );
  };

  const handleSaveAttendance = async () => {
    if (!activeRollCallTraining) return;
    setSavingAttendance(true);

    try {
      // Upsert attendance records to Supabase
      const records = attendance.map((item) => ({
        treino_id: activeRollCallTraining.id,
        atleta_id: item.atleta_id,
        presente: item.presente,
        justificativa: item.presente ? null : item.justificativa,
      }));

      // Delete existing to rewrite, or upsert. Upsert is safer.
      const { error } = await supabase
        .from('presencas')
        .upsert(records, { onConflict: 'treino_id,atleta_id' });

      if (error) throw error;

      // Update training status to "concluido" once call is saved
      const { error: updateError } = await supabase
        .from('treinos')
        .update({ status: 'concluido' })
        .eq('id', activeRollCallTraining.id);

      if (updateError) throw updateError;

      // Refresh list
      setActiveRollCallTraining(null);
      fetchTrainingsAndAthletes();
    } catch (err) {
      console.error('Erro ao salvar chamada no Supabase. Efetuando localmente:', err);
      
      // Local updates fallback
      setTrainings(prev =>
        prev.map(t =>
          t.id === activeRollCallTraining.id ? { ...t, status: 'concluido' } : t
        )
      );
      setActiveRollCallTraining(null);
    } finally {
      setSavingAttendance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Cronograma de Treinos</h2>
          <p className="text-sm text-gray-400">Organize treinos por categoria e controle presenças.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agendar Treino
          </button>
        )}
      </div>

      {/* Add Training Accordion/Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-l-4 border-l-accent">
          <h3 className="text-lg font-bold text-white mb-4">Agendar Nova Sessão</h3>
          <form onSubmit={handleAddTraining} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Título do Treino</label>
              <input
                type="text"
                required
                className="w-full glass-input"
                placeholder="Ex: Treino Físico Integrado"
                value={newTraining.titulo}
                onChange={(e) => setNewTraining({ ...newTraining, titulo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Data e Hora</label>
              <input
                type="datetime-local"
                required
                className="w-full glass-input"
                value={newTraining.data_hora}
                onChange={(e) => setNewTraining({ ...newTraining, data_hora: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Local da Atividade</label>
              <input
                type="text"
                className="w-full glass-input"
                placeholder="Ex: Campo Auxiliar 2"
                value={newTraining.local}
                onChange={(e) => setNewTraining({ ...newTraining, local: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria Alvo</label>
              <select
                className="w-full glass-input bg-neutral-dark/80"
                value={newTraining.categoria}
                onChange={(e) => setNewTraining({ ...newTraining, categoria: e.target.value })}
              >
                {['Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Profissional'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Foco Principal</label>
              <select
                className="w-full glass-input bg-neutral-dark/80"
                value={newTraining.foco}
                onChange={(e) => setNewTraining({ ...newTraining, foco: e.target.value as 'Físico' | 'Tático' | 'Técnico' | 'Coletivo' })}
              >
                {['Tático', 'Técnico', 'Físico', 'Coletivo'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Link de Vídeo do YouTube (URL)</label>
              <input
                type="text"
                className="w-full glass-input"
                placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={newTraining.youtube_url}
                onChange={(e) => setNewTraining({ ...newTraining, youtube_url: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Descrição / Planejamento</label>
              <textarea
                rows={2}
                className="w-full glass-input"
                placeholder="Detalhes dos exercícios, objetivos específicos..."
                value={newTraining.descricao}
                onChange={(e) => setNewTraining({ ...newTraining, descricao: e.target.value })}
              />
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
                Agendar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roster Call Interface */}
      {activeRollCallTraining && (
        <div className="glass-card p-6 border-l-4 border-l-yellow-500 bg-neutral-dark/50">
          <div className="flex items-start justify-between border-b border-white/5 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full uppercase">
                Chamada e Presença
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">{activeRollCallTraining.titulo}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Categoria: {activeRollCallTraining.categoria} | Local: {activeRollCallTraining.local}
              </p>
            </div>
            <button
              onClick={() => setActiveRollCallTraining(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Fechar
            </button>
          </div>

          {attendance.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">
              Nenhum atleta cadastrado nesta categoria ({activeRollCallTraining.categoria}) para fazer a chamada.
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map((item) => (
                <div
                  key={item.atleta_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-dark/80 rounded-xl border border-white/5 gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleTogglePresence(item.atleta_id)}
                      disabled={!isAdmin}
                      className={`p-1 rounded-full transition-colors ${
                        item.presente ? 'text-accent hover:bg-accent/5' : 'text-red-500 hover:bg-red-500/5'
                      } ${!isAdmin ? 'opacity-80 cursor-default' : ''}`}
                    >
                      {item.presente ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <XCircle className="h-6 w-6" />
                      )}
                    </button>
                    <div>
                      <span className="text-sm font-semibold text-white">{item.nome}</span>
                      <span className={`block text-[9px] font-semibold ${item.presente ? 'text-accent' : 'text-red-400'}`}>
                        {item.presente ? 'Presente' : 'Ausente'}
                      </span>
                    </div>
                  </div>

                  {isAdmin && item.presente && (
                    <button
                      onClick={() => handleOpenEvolution(item.atleta_id, item.nome)}
                      className="inline-flex items-center justify-center rounded-lg bg-accent/10 border border-accent/20 px-2.5 py-1.5 text-[10px] font-bold text-accent hover:bg-accent/20 transition-colors"
                    >
                      <TrendingUp className="h-3.5 w-3.5 mr-1" />
                      Registrar Evolução
                    </button>
                  )}

                  {!item.presente && (
                    <div className="flex-1 max-w-sm sm:ml-4">
                      <input
                        type="text"
                        disabled={!isAdmin}
                        className="w-full glass-input text-xs py-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                        placeholder="Justificativa da ausência (Ex: DM, Gripe...)"
                        value={item.justificativa}
                        onChange={(e) => handleJustificationChange(item.atleta_id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveRollCallTraining(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white"
                >
                  {isAdmin ? 'Descartar' : 'Fechar'}
                </button>
                {isAdmin && (
                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance}
                    className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingAttendance ? 'Salvando...' : 'Salvar Chamada'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trainings List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando cronograma...</div>
      ) : (
        <div className="space-y-4">
          {trainings.map((training) => {
            const trainingDate = new Date(training.data_hora);
            const formattedDate = trainingDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={training.id}
                className="glass-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
              >
                {/* Visual Accent for focus */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

                <div className="pl-2 space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-primary text-accent rounded-full">
                      {training.categoria}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      training.status === 'agendado'
                        ? 'bg-blue-500/15 text-blue-400'
                        : training.status === 'concluido'
                        ? 'bg-accent/15 text-accent'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      {training.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">
                      Foco: {training.foco}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{training.titulo}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                    {training.descricao}
                  </p>
                  <div className="flex items-center space-x-4 text-[10px] text-gray-400 pt-1">
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-accent" />
                      {formattedDate}
                    </span>
                    {training.local && (
                      <span className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-accent" />
                        {training.local}
                      </span>
                    )}
                  </div>

                  {training.youtube_url && (
                    <div className="mt-3 aspect-video max-w-md w-full rounded-xl overflow-hidden border border-white/10 shadow-md">
                      <iframe
                        className="w-full h-full"
                        src={training.youtube_url.includes('watch?v=') 
                          ? `https://www.youtube.com/embed/${training.youtube_url.split('v=')[1]?.split('&')[0]}` 
                          : training.youtube_url}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pl-2 md:pl-0">
                  {training.status === 'agendado' && (
                    <button
                      onClick={() => startRollCall(training)}
                      className="inline-flex items-center justify-center rounded-lg bg-primary/20 border border-primary-light/30 px-3.5 py-1.5 text-xs font-bold text-accent hover:bg-primary/45 transition-colors"
                    >
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      {isAdmin ? 'Chamada' : 'Ver Lista'}
                    </button>
                  )}
                  {training.status === 'concluido' && (
                    <button
                      onClick={() => startRollCall(training)}
                      className="inline-flex items-center justify-center rounded-lg bg-accent/10 border border-accent/20 px-3.5 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Chamada Realizada
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evolution Quick Update Modal */}
      {activeEvolutionAthlete && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 border-l-4 border-l-accent relative">
            <h3 className="text-lg font-bold text-white mb-2">Registrar Evolução</h3>
            <p className="text-xs text-gray-400 mb-4">
              Defina os atributos físicos e notas de evolução para <strong className="text-white">{activeEvolutionAthlete.nome}</strong>.
            </p>

            <form onSubmit={handleSaveEvolution} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full glass-input text-sm"
                    placeholder="Ex: 62.5"
                    value={evolutionData.peso}
                    onChange={(e) => setEvolutionData({ ...evolutionData, peso: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full glass-input text-sm"
                    placeholder="Ex: 1.73"
                    value={evolutionData.altura}
                    onChange={(e) => setEvolutionData({ ...evolutionData, altura: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1 p-2 bg-neutral-dark/45 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white">Capacidade Física</span>
                    <span className="text-xs font-bold text-accent">{evolutionData.notaFisica.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    className="w-full h-1 bg-primary/30 rounded-lg appearance-none cursor-pointer accent-accent"
                    value={evolutionData.notaFisica}
                    onChange={(e) => setEvolutionData({ ...evolutionData, notaFisica: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="flex flex-col gap-1 p-2 bg-neutral-dark/45 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white">Capacidade Tática</span>
                    <span className="text-xs font-bold text-accent">{evolutionData.notaTatica.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    className="w-full h-1 bg-primary/30 rounded-lg appearance-none cursor-pointer accent-accent"
                    value={evolutionData.notaTatica}
                    onChange={(e) => setEvolutionData({ ...evolutionData, notaTatica: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Observações de Evolução</label>
                <textarea
                  rows={2}
                  className="w-full glass-input text-xs"
                  placeholder="Descreva a evolução do atleta neste treino (ex: melhora no posicionamento, velocidade de transição...)"
                  value={evolutionData.observacoes}
                  onChange={(e) => setEvolutionData({ ...evolutionData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveEvolutionAthlete(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Salvar Evolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
