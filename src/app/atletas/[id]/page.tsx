'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  Award,
  FileText,
  Activity,
  Phone,
  MapPin,
  Heart,
  Edit2,
  Video,
  Loader2,
  PlusCircle,
  Save,
  ClipboardCheck,
  Upload,
  X,
  File,
  FileImage,
  AlertCircle
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface Athlete {
  id: string;
  nome: string;
  data_nascimento: string;
  categoria: string;
  posicao: string;
  peso: number | null;
  altura: number | null;
  status: 'ativo' | 'lesionado' | 'inativo';
  foto_url: string | null;
  telefone?: string | null;
  endereco?: string | null;
  telefone_responsavel?: string | null;
  historico_medico?: string | null;
  usuario_id?: string | null;
}

interface Evaluation {
  id: string;
  nota_tecnica: number;
  nota_tatica: number;
  nota_fisica: number;
  nota_comportamental: number;
  observacoes: string | null;
  data_avaliacao: string;
}

interface GameStat {
  adversario: string;
  data_hora: string;
  gols: number;
  assistencias: number;
  minutos_jogados: number;
}

interface PersonalizedTraining {
  id?: string;
  titulo: string;
  youtube_url: string | null;
  descricao: string | null;
  atleta_id: string;
  categoria: string;
  foco: 'Físico' | 'Tático' | 'Técnico' | 'Coletivo';
  status: 'agendado' | 'concluido' | 'cancelado';
  data_hora: string;
  arquivo_url?: string | null;
  arquivo_tipo?: string | null;
}

const DEFAULT_ATHLETE: Athlete = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  nome: 'Lucas Silva',
  data_nascimento: '2011-04-12',
  categoria: 'Sub-15',
  posicao: 'Centroavante',
  peso: 62.5,
  altura: 1.72,
  status: 'ativo',
  foto_url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=150&auto=format&fit=crop&q=80',
  telefone: '(21) 99999-8888',
  endereco: 'Rua das Laranjeiras, 123 - Rio de Janeiro',
  telefone_responsavel: '(21) 98888-7777',
  historico_medico: 'Sem alergias. Histórico de asma na infância controlada. Cartão de vacina em dia.'
};

const DEFAULT_EVALUATIONS: Evaluation[] = [
  {
    id: '1',
    nota_tecnica: 8.5,
    nota_tatica: 7.0,
    nota_fisica: 9.0,
    nota_comportamental: 8.0,
    observacoes: 'Excelente força física e explosão, boa finalização de perna direita. Precisa melhorar posicionamento em impedimentos.',
    data_avaliacao: '2026-05-27',
  },
  {
    id: '2',
    nota_tecnica: 9.0,
    nota_tatica: 7.5,
    nota_fisica: 9.0,
    nota_comportamental: 8.5,
    observacoes: 'Evolução tática visível nos treinos de movimentação em pivô.',
    data_avaliacao: '2026-06-06',
  }
];

const DEFAULT_GAME_STATS: GameStat[] = [
  {
    adversario: 'Bangu Esporte Clube Sub-15',
    data_hora: '2026-06-03',
    gols: 2,
    assistencias: 1,
    minutos_jogados: 80,
  }
];

export default function AthleteDetailPage() {
  const { isAdmin, user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Personalized Training States
  const [personalizedTraining, setPersonalizedTraining] = useState<PersonalizedTraining | null>(null);
  const [isEditingTraining, setIsEditingTraining] = useState(false);
  const [editTrainingData, setEditTrainingData] = useState({
    titulo: '',
    youtube_url: '',
    descricao: '',
    arquivo_url: '' as string,
    arquivo_tipo: '' as string,
  });
  const [savingTraining, setSavingTraining] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- Evaluation Modal States ---
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [savingEval, setSavingEval] = useState(false);
  const [evalNotaTecnica, setEvalNotaTecnica] = useState(7.0);
  const [evalNotaTatica, setEvalNotaTatica] = useState(7.0);
  const [evalNotaFisica, setEvalNotaFisica] = useState(7.0);
  const [evalNotaComportamental, setEvalNotaComportamental] = useState(7.0);
  const [evalObservacoes, setEvalObservacoes] = useState('');
  const [evalSuccess, setEvalSuccess] = useState(false);
  const [evalSaveError, setEvalSaveError] = useState(false);

  const handleOpenEvalModal = () => {
    setEvalNotaTecnica(7.0);
    setEvalNotaTatica(7.0);
    setEvalNotaFisica(7.0);
    setEvalNotaComportamental(7.0);
    setEvalObservacoes('');
    setEvalSuccess(false);
    setEvalSaveError(false);
    setIsEvaluating(true);
  };

  const handleSaveNewEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete) return;
    setSavingEval(true);

    const today = new Date().toISOString().split('T')[0];
    const evalPayload = {
      atleta_id: athlete.id,
      treinador_id: user?.id ?? null,
      data_avaliacao: today,
      nota_tecnica: Number(evalNotaTecnica),
      nota_tatica: Number(evalNotaTatica),
      nota_fisica: Number(evalNotaFisica),
      nota_comportamental: Number(evalNotaComportamental),
      observacoes: evalObservacoes || null,
    };

    // Optimistically add to the evaluations state list right away
    const tempId = 'local-' + Date.now();
    const newEvalEntry: Evaluation = { id: tempId, ...evalPayload };
    setEvaluations(prev => [newEvalEntry, ...prev]);

    // Save to localStorage as a reliable fallback
    try {
      const existing = localStorage.getItem('local_avaliacoes');
      const list = existing ? JSON.parse(existing) : [];
      list.push({ id: tempId, ...evalPayload });
      localStorage.setItem('local_avaliacoes', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    // Try to persist to Supabase
    try {
      const { data: inserted, error } = await supabase
        .from('avaliacoes')
        .insert([evalPayload])
        .select('id')
        .single();
      if (error) throw error;

      if (inserted?.id) {
        setEvalSaveError(false);
        // Replace temp entry with real DB id
        setEvaluations(prev =>
          prev.map(ev => ev.id === tempId ? { ...ev, id: inserted.id } : ev)
        );
        // Also update the localStorage entry with the real id
        try {
          const existing = localStorage.getItem('local_avaliacoes');
          if (existing) {
            const list = JSON.parse(existing).map((e: Evaluation) =>
              e.id === tempId ? { ...e, id: inserted.id } : e
            );
            localStorage.setItem('local_avaliacoes', JSON.stringify(list));
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Supabase insert failed, evaluation saved locally only:', err);
      setEvalSaveError(true);
    } finally {
      setSavingEval(false);
      setEvalSuccess(true);
    }
  };

  const getScoreColor = (val: number) => {
    if (val < 5.0) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (val < 7.0) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-accent bg-accent/15 border-accent/20';
  };

  const handleStartEditTraining = () => {
    setEditTrainingData({
      titulo: personalizedTraining?.titulo || 'Treino Direcionado',
      youtube_url: personalizedTraining?.youtube_url || '',
      descricao: personalizedTraining?.descricao || '',
      arquivo_url: personalizedTraining?.arquivo_url || '',
      arquivo_tipo: personalizedTraining?.arquivo_tipo || '',
    });
    setSelectedFile(null);
    setIsEditingTraining(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Apenas arquivos JPG, PNG ou PDF são permitidos.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 10MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete) return;
    setSavingTraining(true);

    let arquivoUrl = editTrainingData.arquivo_url || null;
    let arquivoTipo = editTrainingData.arquivo_tipo || null;

    // Upload file if selected
    if (selectedFile) {
      setUploadingFile(true);
      try {
        const ext = selectedFile.name.split('.').pop();
        const path = `treinos/${athlete.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('treino-arquivos')
          .upload(path, selectedFile, { upsert: true, contentType: selectedFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('treino-arquivos')
          .getPublicUrl(path);
        arquivoUrl = urlData.publicUrl;
        arquivoTipo = selectedFile.type;
      } catch (err) {
        console.error('Erro no upload do arquivo:', err);
      } finally {
        setUploadingFile(false);
      }
    }

    const payload = {
      titulo: editTrainingData.titulo,
      youtube_url: editTrainingData.youtube_url || null,
      descricao: editTrainingData.descricao || null,
      arquivo_url: arquivoUrl,
      arquivo_tipo: arquivoTipo,
      atleta_id: athlete.id,
      categoria: athlete.categoria,
      foco: 'Técnico' as const,
      status: 'agendado' as const,
      data_hora: new Date(Date.now() + 86400000).toISOString(),
    };

    try {
      let result;
      if (personalizedTraining?.id) {
        result = await supabase
          .from('treinos')
          .update(payload)
          .eq('id', personalizedTraining.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('treinos')
          .insert([payload])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      setPersonalizedTraining(result.data);
      setIsEditingTraining(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Erro ao salvar treino personalizado no Supabase:', err);
      const newTraining = {
        id: personalizedTraining?.id || Math.random().toString(),
        ...payload,
      };
      setPersonalizedTraining(newTraining);
      setIsEditingTraining(false);
      setSelectedFile(null);
    } finally {
      setSavingTraining(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editAthlete, setEditAthlete] = useState({
    nome: '',
    data_nascimento: '',
    categoria: '',
    posicao: '',
    peso: '',
    altura: '',
    status: 'ativo',
    foto_url: '',
    telefone: '',
    endereco: '',
    telefone_responsavel: '',
    historico_medico: '',
  });

  const handleStartEdit = () => {
    if (!athlete) return;
    setEditAthlete({
      nome: athlete.nome || '',
      data_nascimento: athlete.data_nascimento || '',
      categoria: athlete.categoria || '',
      posicao: athlete.posicao || '',
      peso: athlete.peso ? athlete.peso.toString() : '',
      altura: athlete.altura ? athlete.altura.toString() : '',
      status: athlete.status || 'ativo',
      foto_url: athlete.foto_url || '',
      telefone: athlete.telefone || '',
      endereco: athlete.endereco || '',
      telefone_responsavel: athlete.telefone_responsavel || '',
      historico_medico: athlete.historico_medico || '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete) return;

    const updatedData = {
      nome: editAthlete.nome,
      data_nascimento: editAthlete.data_nascimento,
      categoria: editAthlete.categoria,
      posicao: editAthlete.posicao,
      peso: editAthlete.peso ? parseFloat(editAthlete.peso) : null,
      altura: editAthlete.altura ? parseFloat(editAthlete.altura) : null,
      status: editAthlete.status as 'ativo' | 'lesionado' | 'inativo',
      foto_url: editAthlete.foto_url || null,
      telefone: editAthlete.telefone || null,
      endereco: editAthlete.endereco || null,
      telefone_responsavel: editAthlete.telefone_responsavel || null,
      historico_medico: editAthlete.historico_medico || null,
    };

    try {
      const { error } = await supabase
        .from('atletas')
        .update(updatedData)
        .eq('id', athlete.id);

      if (error) throw error;

      setAthlete({ ...athlete, ...updatedData });
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao atualizar atleta no Supabase. Atualizando localmente:', err);
      setAthlete({ ...athlete, ...updatedData });
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch athlete details
        const { data: athleteData, error: athleteError } = await supabase
          .from('atletas')
          .select('*')
          .eq('id', id)
          .single();

        if (athleteError) throw athleteError;
        setAthlete(athleteData as Athlete);

        // Fetch evaluations
        const { data: evalData, error: evalError } = await supabase
          .from('avaliacoes')
          .select('id, nota_tecnica, nota_tatica, nota_fisica, nota_comportamental, observacoes, data_avaliacao')
          .eq('atleta_id', id)
          .order('data_avaliacao', { ascending: false });

        let loadedEvals: Evaluation[] = [];
        if (!evalError && evalData) {
          loadedEvals = evalData as Evaluation[];
        }

        try {
          const localStr = localStorage.getItem('local_avaliacoes');
          if (localStr) {
            const locals = JSON.parse(localStr);
            const filteredLocals = locals.filter((l: any) => l.atleta_id === id);
            loadedEvals = [...filteredLocals, ...loadedEvals];
          }
        } catch (e) {
          console.error('Failed to merge local evaluations', e);
        }
        setEvaluations(loadedEvals);

        // Fetch game statistics
        const { data: statData, error: statError } = await supabase
          .from('estatisticas_jogos')
          .select(`
            minutos_jogados,
            gols,
            assistencias,
            jogos (
              adversario,
              data_hora
            )
          `)
          .eq('atleta_id', id);

        if (!statError && statData) {
          const formattedStats = (statData as unknown as {
            minutos_jogados: number;
            gols: number;
            assistencias: number;
            jogos: { adversario: string; data_hora: string; } | null;
          }[]).map((s) => ({
            minutos_jogados: s.minutos_jogados,
            gols: s.gols,
            assistencias: s.assistencias,
            adversario: s.jogos?.adversario || 'Adversário',
            data_hora: s.jogos?.data_hora || '',
          }));
          setGameStats(formattedStats);
        }

        // Fetch personalized training
        const { data: trainingData, error: trainingError } = await supabase
          .from('treinos')
          .select('*')
          .eq('atleta_id', id)
          .maybeSingle();

        if (!trainingError && trainingData) {
          setPersonalizedTraining(trainingData);
        } else {
          setPersonalizedTraining(null);
        }
      } catch (err) {
        console.warn('Erro ao buscar detalhes do atleta, usando dados locais:', err);
        // Fallback to local default data matching the ID, otherwise use Lucas Silva
        setAthlete(DEFAULT_ATHLETE);
        let finalEvals = [...DEFAULT_EVALUATIONS];
        try {
          const localStr = localStorage.getItem('local_avaliacoes');
          if (localStr) {
            const locals = JSON.parse(localStr);
            const filteredLocals = locals.filter((l: any) => l.atleta_id === id);
            finalEvals = [...filteredLocals, ...finalEvals];
          }
        } catch (e) {
          console.error(e);
        }
        setEvaluations(finalEvals);
        setGameStats(DEFAULT_GAME_STATS);

        if (id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
          setPersonalizedTraining({
            id: 'mock-pt1',
            titulo: 'Aprimoramento de Pivô e Finalização',
            youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            descricao: 'Lucas, seu foco neste treino individual é trabalhar a recepção de bola de costas para a marcação (pivô), fazendo o giro rápido sobre o zagueiro e finalizando com firmeza de perna direita. Assista ao vídeo de exemplo e preste atenção no movimento do corpo antes do chute.',
            atleta_id: id,
            categoria: 'Sub-15',
            foco: 'Técnico',
            status: 'agendado',
            data_hora: new Date(Date.now() + 86400000).toISOString(),
          });
        } else {
          setPersonalizedTraining(null);
        }
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Carregando dados do atleta...</div>;
  }

  if (!athlete) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Atleta não encontrado.</p>
        <Link href="/atletas" className="text-accent hover:underline flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para elenco
        </Link>
      </div>
    );
  }

  // Calculate age
  const birthDate = new Date(athlete.data_nascimento);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
     today.getDate() >= birthDate.getDate());
  if (!hasBirthdayPassed) age--;

  // Radar chart data based on latest evaluation
  const latestEval = evaluations[0] || {
    nota_tecnica: 7.0,
    nota_tatica: 7.0,
    nota_fisica: 7.0,
    nota_comportamental: 7.0,
  };

  const radarData = [
    { subject: 'Técnica', A: Number(latestEval.nota_tecnica), fullMark: 10 },
    { subject: 'Tática', A: Number(latestEval.nota_tatica), fullMark: 10 },
    { subject: 'Física', A: Number(latestEval.nota_fisica), fullMark: 10 },
    { subject: 'Comport.', A: Number(latestEval.nota_comportamental), fullMark: 10 },
  ];

  // Goals and assists for bar chart
  const matchesData = gameStats.map((stat) => ({
    name: stat.adversario.split(' ')[0],
    Gols: stat.gols,
    Assist: stat.assistencias,
  }));

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div>
        <Link href="/atletas" className="inline-flex items-center text-xs font-bold text-accent hover:text-accent/80 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Voltar para Elenco
        </Link>
      </div>

      {/* Main Profile Info */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative h-36 w-36 rounded-full overflow-hidden border-2 border-accent bg-neutral-dark flex-shrink-0">
          {athlete.foto_url ? (
            <img src={athlete.foto_url} alt={athlete.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-500">Sem Foto</div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-bold text-white">{athlete.nome}</h2>
              <span className="text-[10px] px-2 py-0.5 bg-primary text-accent rounded-full font-bold">
                {athlete.categoria}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
                athlete.status === 'ativo' ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'
              }`}>
                {athlete.status}
              </span>
            </div>
            <p className="text-sm text-accent font-semibold mt-1">{athlete.posicao}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-b border-white/5 py-4 max-w-lg">
            <div className="text-center md:text-left">
              <span className="block text-[10px] text-gray-400">Idade</span>
              <span className="text-sm font-bold text-white">{age} anos</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-[10px] text-gray-400">Altura</span>
              <span className="text-sm font-bold text-white">{athlete.altura ? `${athlete.altura.toFixed(2)} m` : '-'}</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-[10px] text-gray-400">Peso</span>
              <span className="text-sm font-bold text-white">{athlete.peso ? `${athlete.peso.toFixed(1)} kg` : '-'}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex-shrink-0 flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={handleStartEdit}
              className="inline-flex items-center justify-center rounded-xl bg-primary border border-primary-light px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/80 transition-colors shadow-md text-center"
            >
              Editar Perfil
            </button>
            <button
              onClick={handleOpenEvalModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md text-center"
            >
              <PlusCircle className="h-4 w-4" />
              Nova Avaliação
            </button>
          </div>
        )}
      </div>

      {/* Ficha Cadastral card */}
      <div className="glass-card p-6 grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center border-b border-white/5 pb-2">
            <Phone className="h-5 w-5 text-accent mr-2" />
            Informações de Contato
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] text-gray-400">Telefone Celular</span>
              <span className="text-sm font-bold text-white">{athlete.telefone || 'Não informado'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400">Telefone do Responsável</span>
              <span className="text-sm font-bold text-white">{athlete.telefone_responsavel || 'Não informado'}</span>
            </div>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400">Endereço Residencial</span>
            <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-accent/60" />
              {athlete.endereco || 'Não informado'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center border-b border-white/5 pb-2">
            <Heart className="h-5 w-5 text-accent mr-2" />
            Histórico Médico / Clínico
          </h3>
          <div>
            <span className="block text-[10px] text-gray-400">Observações Clínicas e Alergias</span>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
              {athlete.historico_medico || 'Nenhum histórico médico registrado.'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Athlete Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card w-full max-w-2xl p-6 border-l-4 border-l-accent relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Editar Cadastro do Atleta</h3>
            <form onSubmit={handleSaveEdit} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="w-full glass-input"
                  value={editAthlete.nome}
                  onChange={(e) => setEditAthlete({ ...editAthlete, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  required
                  className="w-full glass-input"
                  value={editAthlete.data_nascimento}
                  onChange={(e) => setEditAthlete({ ...editAthlete, data_nascimento: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria</label>
                <select
                  className="w-full glass-input bg-neutral-dark/80"
                  value={editAthlete.categoria}
                  onChange={(e) => setEditAthlete({ ...editAthlete, categoria: e.target.value })}
                >
                  {['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Posição</label>
                <select
                  className="w-full glass-input bg-neutral-dark/80"
                  value={editAthlete.posicao}
                  onChange={(e) => setEditAthlete({ ...editAthlete, posicao: e.target.value })}
                >
                  {['Goleiro', 'Zagueiro', 'Lateral Esquerdo', 'Lateral Direito', 'Volante', 'Meia', 'Ponta Esquerda', 'Ponta Direita', 'Centroavante'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full glass-input"
                  value={editAthlete.peso}
                  onChange={(e) => setEditAthlete({ ...editAthlete, peso: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Altura (m)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full glass-input"
                  value={editAthlete.altura}
                  onChange={(e) => setEditAthlete({ ...editAthlete, altura: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Status</label>
                <select
                  className="w-full glass-input bg-neutral-dark/80"
                  value={editAthlete.status}
                  onChange={(e) => setEditAthlete({ ...editAthlete, status: e.target.value as 'ativo' | 'lesionado' | 'inativo' })}
                >
                  {['ativo', 'lesionado', 'inativo'].map(s => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Telefone Celular</label>
                <input
                  type="text"
                  className="w-full glass-input"
                  value={editAthlete.telefone}
                  onChange={(e) => setEditAthlete({ ...editAthlete, telefone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Telefone do Responsável</label>
                <input
                  type="text"
                  className="w-full glass-input"
                  value={editAthlete.telefone_responsavel}
                  onChange={(e) => setEditAthlete({ ...editAthlete, telefone_responsavel: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Endereço Residencial</label>
                <input
                  type="text"
                  className="w-full glass-input"
                  value={editAthlete.endereco}
                  onChange={(e) => setEditAthlete({ ...editAthlete, endereco: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1">URL da Foto de Perfil</label>
                <input
                  type="text"
                  className="w-full glass-input"
                  value={editAthlete.foto_url}
                  onChange={(e) => setEditAthlete({ ...editAthlete, foto_url: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Histórico Médico</label>
                <textarea
                  rows={2}
                  className="w-full glass-input"
                  value={editAthlete.historico_medico}
                  onChange={(e) => setEditAthlete({ ...editAthlete, historico_medico: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 flex justify-end space-x-2 pt-2 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Treinamento Personalizado Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-base font-bold text-white flex items-center">
            <Video className="h-5 w-5 text-accent mr-2" />
            Treinamento Personalizado / Direcionado
          </h3>
          {isAdmin && (
            <button
              onClick={handleStartEditTraining}
              className="inline-flex items-center justify-center rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Configurar Treino
            </button>
          )}
        </div>

        {personalizedTraining ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">{personalizedTraining.titulo}</h4>
              <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                {personalizedTraining.descricao || 'Nenhuma instrução descrita.'}
              </p>
            </div>
            
            {personalizedTraining.youtube_url && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-accent flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  Vídeo de Referência (YouTube)
                </span>
                <div className="aspect-video max-w-lg w-full rounded-xl overflow-hidden border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src={personalizedTraining.youtube_url.includes('watch?v=') 
                      ? `https://www.youtube.com/embed/${personalizedTraining.youtube_url.split('v=')[1]?.split('&')[0]}` 
                      : personalizedTraining.youtube_url}
                    title="Vídeo de Treinamento"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {personalizedTraining.arquivo_url && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-accent flex items-center gap-1">
                  {personalizedTraining.arquivo_tipo === 'application/pdf'
                    ? <File className="h-3.5 w-3.5" />
                    : <FileImage className="h-3.5 w-3.5" />}
                  Arquivo Anexado
                </span>
                {personalizedTraining.arquivo_tipo === 'application/pdf' ? (
                  <a
                    href={personalizedTraining.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/20 transition-colors w-fit"
                  >
                    <File className="h-4 w-4" />
                    Abrir PDF
                  </a>
                ) : (
                  <a
                    href={personalizedTraining.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-lg rounded-xl overflow-hidden border border-white/10 shadow-md hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={personalizedTraining.arquivo_url}
                      alt="Arquivo do treino"
                      className="w-full object-contain max-h-72"
                    />
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-500">
            {isAdmin 
              ? 'Nenhum treino personalizado cadastrado para este atleta. Clique em "Configurar Treino" para cadastrar.'
              : 'Nenhum treino personalizado cadastrado para você ainda.'}
          </div>
        )}
      </div>

      {/* Edit Personalized Training Modal Overlay */}
      {isEditingTraining && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 border-l-4 border-l-accent relative">
            <h3 className="text-lg font-bold text-white mb-2">Editar Treino Direcionado</h3>
            <p className="text-xs text-gray-400 mb-4">
              Defina o foco e exercícios específicos para <strong className="text-white">{athlete.nome}</strong>.
            </p>

            <form onSubmit={handleSaveTraining} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Título do Treino</label>
                <input
                  type="text"
                  required
                  className="w-full glass-input text-sm"
                  placeholder="Ex: Aprimoramento de Chute e Giro"
                  value={editTrainingData.titulo}
                  onChange={(e) => setEditTrainingData({ ...editTrainingData, titulo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Link do Vídeo do YouTube (URL)</label>
                <input
                  type="text"
                  className="w-full glass-input text-sm"
                  placeholder="Ex: https://www.youtube.com/watch?v=..."
                  value={editTrainingData.youtube_url}
                  onChange={(e) => setEditTrainingData({ ...editTrainingData, youtube_url: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Instruções / O que o aluno deve fazer</label>
                <textarea
                  rows={4}
                  required
                  className="w-full glass-input text-xs"
                  placeholder="Instruções detalhadas sobre o treino..."
                  value={editTrainingData.descricao}
                  onChange={(e) => setEditTrainingData({ ...editTrainingData, descricao: e.target.value })}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Anexar Arquivo (JPG, PNG ou PDF &mdash; máx. 10MB)</label>
                <div className="relative">
                  <label
                    htmlFor="treino-file-upload"
                    className="flex items-center gap-2 w-full glass-input text-xs cursor-pointer hover:border-accent/50 transition-colors px-3 py-2.5"
                  >
                    {selectedFile ? (
                      <>
                        {selectedFile.type === 'application/pdf'
                          ? <File className="h-4 w-4 text-red-400 flex-shrink-0" />
                          : <FileImage className="h-4 w-4 text-blue-400 flex-shrink-0" />}
                        <span className="text-white truncate">{selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                          className="ml-auto text-gray-500 hover:text-red-400 flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : editTrainingData.arquivo_url ? (
                      <>
                        {editTrainingData.arquivo_tipo === 'application/pdf'
                          ? <File className="h-4 w-4 text-red-400 flex-shrink-0" />
                          : <FileImage className="h-4 w-4 text-blue-400 flex-shrink-0" />}
                        <span className="text-gray-300 truncate">Arquivo já anexado (clique para substituir)</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setEditTrainingData({ ...editTrainingData, arquivo_url: '', arquivo_tipo: '' }); }}
                          className="ml-auto text-gray-500 hover:text-red-400 flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">Clique para selecionar um arquivo...</span>
                      </>
                    )}
                  </label>
                  <input
                    id="treino-file-upload"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditingTraining(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTraining || uploadingFile}
                  className="px-5 py-2 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors flex items-center disabled:opacity-60"
                >
                  {(savingTraining || uploadingFile) && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                  {uploadingFile ? 'Enviando arquivo...' : savingTraining ? 'Salvando...' : 'Salvar Treino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics and Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart (Attributes) */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center">
            <Award className="h-4 w-4 text-accent mr-2" />
            Atributos de Desempenho (Última Avaliação)
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: '600' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#4b5563', fontSize: 9 }} />
                  <Radar name={athlete.nome} dataKey="A" stroke="#20c997" fill="#20c997" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-xs">Carregando gráfico...</div>
            )}
          </div>
        </div>

        {/* Goals and Assists Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center">
            <Activity className="h-4 w-4 text-accent mr-2" />
            Estatísticas em Jogos Recentes
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {!mounted || loading ? (
              <div className="text-gray-500 text-xs">Carregando gráfico...</div>
            ) : gameStats.length === 0 ? (
              <div className="text-gray-500 text-xs flex flex-col items-center justify-center h-full">
                <span>Nenhuma estatística de partida cadastrada para este atleta.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={matchesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#161c18', border: '1px solid rgba(32, 201, 151, 0.15)' }} />
                  <Legend verticalAlign="top" height={36} iconSize={8} />
                  <Bar dataKey="Gols" fill="#20c997" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Assist" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      {isEvaluating && athlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card w-full max-w-xl p-6 border-l-4 border-l-accent relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-bold text-white">Nova Avaliação de Desempenho</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Avaliando: <strong className="text-white">{athlete.nome}</strong> — {athlete.posicao} ({athlete.categoria})
            </p>

            {evalSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
                {evalSaveError ? (
                  <>
                    <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    <h4 className="font-bold text-white text-base">Salvo Apenas Localmente</h4>
                    <p className="text-xs text-amber-400 max-w-md bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl leading-relaxed">
                      ⚠️ Não foi possível salvar no banco de dados (Supabase). As informações foram salvas localmente neste navegador, mas podem ser perdidas.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-accent/10 rounded-full text-accent">
                      <ClipboardCheck className="h-8 w-8" />
                    </div>
                    <h4 className="font-bold text-white text-base">Avaliação Registrada!</h4>
                    <p className="text-xs text-gray-400">A avaliação de <strong className="text-white">{athlete.nome}</strong> foi salva e já aparece no histórico abaixo.</p>
                  </>
                )}
                <button
                  onClick={() => setIsEvaluating(false)}
                  className="mt-2 px-5 py-2.5 text-xs font-bold bg-accent text-neutral-dark rounded-xl hover:bg-accent/90 transition-colors"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveNewEvaluation} className="space-y-5">
                {[
                  { label: 'Capacidade Técnica', desc: 'Controle de bola, passe, chute e drible.', val: evalNotaTecnica, setVal: setEvalNotaTecnica },
                  { label: 'Capacidade Tática', desc: 'Leitura de jogo, posicionamento e cobertura.', val: evalNotaTatica, setVal: setEvalNotaTatica },
                  { label: 'Capacidade Física', desc: 'Velocidade, força, resistência e agilidade.', val: evalNotaFisica, setVal: setEvalNotaFisica },
                  { label: 'Aspecto Comportamental', desc: 'Disciplina, liderança e espírito de equipe.', val: evalNotaComportamental, setVal: setEvalNotaComportamental },
                ].map((metric, i) => (
                  <div key={i} className="p-3 bg-neutral-dark/45 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{metric.label}</h4>
                        <p className="text-[10px] text-gray-400">{metric.desc}</p>
                      </div>
                      <span className={`w-12 py-1 text-center font-bold text-xs rounded border ${getScoreColor(metric.val)}`}>
                        {metric.val.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range" min="1.0" max="10.0" step="0.1"
                      className="w-full h-1 bg-primary/30 rounded-lg appearance-none cursor-pointer accent-accent"
                      value={metric.val}
                      onChange={(e) => metric.setVal(parseFloat(e.target.value))}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Observações Gerais (Qualitativo)</label>
                  <textarea
                    rows={3}
                    className="w-full glass-input text-xs"
                    placeholder="Pontos fortes, pontos a melhorar, evolução observada..."
                    value={evalObservacoes}
                    onChange={(e) => setEvalObservacoes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsEvaluating(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEval}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-accent text-neutral-dark rounded-xl hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50"
                  >
                    {savingEval ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {savingEval ? 'Salvando...' : 'Salvar Avaliação'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Evaluations History List */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center">
          <FileText className="h-4 w-4 text-accent mr-2" />
          Histórico de Avaliações
        </h3>
        {evaluations.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">Nenhuma avaliação realizada ainda.</p>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evalItem, index) => (
              <div key={evalItem.id} className="p-4 bg-neutral-dark/40 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-accent font-semibold">
                    Avaliação #{evaluations.length - index}
                  </span>
                  <span className="text-[10px] text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(evalItem.data_avaliacao + 'T00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-center bg-primary/10 rounded-lg p-2.5">
                  {[
                    { label: 'Téc.', val: evalItem.nota_tecnica },
                    { label: 'Tát.', val: evalItem.nota_tatica },
                    { label: 'Fís.', val: evalItem.nota_fisica },
                    { label: 'Comp.', val: evalItem.nota_comportamental },
                  ].map((metric, i) => (
                    <div key={i}>
                      <span className="block text-[9px] text-gray-400">{metric.label}</span>
                      <span className="text-sm font-bold text-accent">{Number(metric.val).toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                {evalItem.observacoes && (
                  <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-2.5 rounded border border-white/5">
                    <strong className="text-white">Observações:</strong> {evalItem.observacoes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
