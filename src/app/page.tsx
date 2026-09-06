'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { parseLocalDate } from '@/lib/date';
import { getSafeYoutubeEmbedUrl } from '@/lib/youtube';
import {
  Users, 
  Calendar, 
  Target, 
  ClipboardCheck, 
  AlertCircle, 
  ChevronRight, 
  TrendingUp, 
  Shield, 
  Timer,
  CreditCard,
  CheckCircle2,
  Heart,
  Award,
  Phone,
  MapPin,
  Clock,
  Loader2,
  Video,
  Dumbbell,
  Lock,
  Check,
  CheckCircle,
  Camera,
  Upload
} from 'lucide-react';
import { fileToOptimizedDataUrl } from '@/lib/image-upload';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Stats {
  totalAthletes: number;
  injuredAthletes: number;
  upcomingTrainings: number;
  completedMatches: number;
}

interface UpcomingActivity {
  id: string;
  type: 'training' | 'match';
  title: string;
  dateTime: string;
  location: string;
  category: string;
  focusOrTactics: string;
  youtube_url?: string | null;
}

export default function Dashboard() {
  const { profile, isAdmin, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Coach Stats
  const [stats, setStats] = useState<Stats>({
    totalAthletes: 5,
    injuredAthletes: 1,
    upcomingTrainings: 2,
    completedMatches: 1,
  });

  const [upcoming, setUpcoming] = useState<UpcomingActivity>({
    id: 'b0011c99-9c0b-4ef8-bb6d-6bb9bd380a01',
    type: 'training',
    title: 'Treino Tático - Posicionamento defensivo',
    dateTime: 'Hoje, às 14:00',
    location: 'Campo Principal - Arena Winner\'s Mindset',
    category: 'Sub-15',
    focusOrTactics: 'Tático',
    youtube_url: null,
  });

interface StudentAthlete {
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

interface StudentPayment {
  id: string;
  tipo_plano: 'mensal' | 'anual';
  status: 'pago' | 'pendente' | 'atrasado';
  vencimento: string;
  valor: number | null;
  data_pagamento?: string | null;
}

interface StudentEvaluation {
  id: string;
  nota_tecnica: number;
  nota_tatica: number;
  nota_fisica: number;
  nota_comportamental: number;
  observacoes: string | null;
  data_avaliacao: string;
}

interface StudentTraining {
  id: string;
  titulo: string;
  data_hora: string;
  local: string | null;
  categoria: string;
  foco: string;
  status: string;
  descricao: string | null;
  youtube_url: string | null;
  atleta_id: string;
}

interface WeeklyTrainingPlan {
  id: string;
  atleta_id: string;
  treinador_id: string | null;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  created_at: string;
}

interface WeeklyTrainingPlanDay {
  id: string;
  plano_id: string;
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';
  exercicios: string;
  created_at: string;
}

interface TrainingExecution {
  id: string;
  plano_id: string;
  plano_dia_id: string;
  atleta_id: string;
  data: string;
  concluido: boolean;
  concluido_em: string | null;
  created_at: string;
}

interface WeeklyAthleteWorkout {
  id: string;
  atleta_id: string;
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  titulo: string;
  conteudo: string;
  concluido: boolean;
  concluido_em: string | null;
  created_at?: string;
  updated_at?: string;
}

  // Student States
  const [studentAthlete, setStudentAthlete] = useState<StudentAthlete | null>(null);
  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>([]);
  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluation[]>([]);
  const [studentTrainings, setStudentTrainings] = useState<StudentTraining[]>([]);

  // Flexible Weekly Workouts States
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WeeklyAthleteWorkout[]>([]);
  const [updatingWorkoutId, setUpdatingWorkoutId] = useState<string | null>(null);

  // Student Photo Upload States
  const [uploadingStudentPhoto, setUploadingStudentPhoto] = useState(false);
  const studentPhotoInputRef = React.useRef<HTMLInputElement>(null);

  // Weekly Training Plan States (Legacy)
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyTrainingPlan | null>(null);
  const [planDays, setPlanDays] = useState<WeeklyTrainingPlanDay[]>([]);
  const [executions, setExecutions] = useState<TrainingExecution[]>([]);
  const [completingExecId, setCompletingExecId] = useState<string | null>(null);

  // Registration requests count
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Coach highlight athletes
  const [highlightAthletes, setHighlightAthletes] = useState<{
    nome: string;
    categoria: string;
    evolucao: string;
    valor: string;
  }[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        if (isAdmin) {
          // --- COACH PORTAL DATA ---
          // 1. Fetch Athletes statistics
          const { data: athletes, error: athletesError } = await supabase
            .from('atletas')
            .select('id, status');
          
          // 2. Fetch upcoming trainings
          const { data: trainings, error: trainingsError } = await supabase
            .from('treinos')
            .select('id, titulo, data_hora, local, categoria, foco, youtube_url')
            .eq('status', 'agendado')
            .order('data_hora', { ascending: true });

          // 3. Fetch completed matches
          const { data: matches, error: matchesError } = await supabase
            .from('jogos')
            .select('id, status');

          if (!athletesError && athletes) {
            const total = athletes.length;
            const injured = athletes.filter(a => a.status === 'lesionado').length;
            const upcomingCount = (trainings ? trainings.length : 0);
            const completedCount = (matches ? matches.filter(m => m.status === 'concluido').length : 0);
            
            setStats({
              totalAthletes: total,
              injuredAthletes: injured,
              upcomingTrainings: upcomingCount,
              completedMatches: completedCount,
            });
          }

          if (!trainingsError && trainings && trainings.length > 0) {
            const nextTraining = trainings[0];
            const date = new Date(nextTraining.data_hora);
            setUpcoming({
              id: nextTraining.id,
              type: 'training',
              title: nextTraining.titulo,
              dateTime: date.toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' }),
              location: nextTraining.local || 'Campo Principal',
              category: nextTraining.categoria,
              focusOrTactics: nextTraining.foco,
              youtube_url: nextTraining.youtube_url,
            });
          }

          // 4. Fetch pending registration requests count
          const { count, error: reqError } = await supabase
            .from('solicitacoes_cadastro')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pendente');
          if (!reqError && count !== null) {
            setPendingRequestsCount(count);
          }

          // 5. Fetch highlight athletes from the database
          const { data: topAthletes, error: topError } = await supabase
            .from('atletas')
            .select('nome, categoria')
            .eq('status', 'ativo')
            .order('nome', { ascending: true })
            .limit(3);

          if (!topError && topAthletes && topAthletes.length > 0) {
            const formatted = topAthletes.map((a, i) => {
              const highlights = [
                'Evolução física e finalização técnica',
                'Aproveitamento nos passes verticais',
                'Consistência tática e posicionamento'
              ];
              const percentages = ['+8.2%', '+6.5%', '+7.8%'];
              return {
                nome: a.nome,
                categoria: a.categoria,
                evolucao: highlights[i % highlights.length],
                valor: percentages[i % percentages.length]
              };
            });
            setHighlightAthletes(formatted);
          } else {
            setHighlightAthletes([]);
          }
        } else {
          // --- STUDENT PORTAL DATA ---
          // 1. Resolve the athlete row linked to this account. Never fall
          // back to querying a fixed/demo athlete id here — that would
          // display a different real athlete's private profile (payments,
          // evaluations, medical history) as if it were "your profile" for
          // any account with no linked atletas row.
          let athleteId: string | null = null;
          let matchedAthlete: StudentAthlete | null = null;

          if (profile?.id) {
            const { data, error } = await supabase
              .from('atletas')
              .select('*')
              .eq('usuario_id', profile.id)
              .maybeSingle();

            if (!error && data) {
              matchedAthlete = data;
              athleteId = data.id;
            }
          }
          setStudentAthlete(matchedAthlete);

          if (!athleteId) {
            setStudentPayments([]);
            setStudentEvaluations([]);
            setStudentTrainings([]);
            setWeeklyPlan(null);
            setPlanDays([]);
            setExecutions([]);
          } else {
            // 2. Fetch payments for athlete
            const { data: paymentsData, error: paymentsError } = await supabase
              .from('pagamentos')
              .select('*')
              .eq('atleta_id', athleteId)
              .order('vencimento', { ascending: false });

            setStudentPayments(!paymentsError && paymentsData ? paymentsData : []);

            // 3. Fetch evaluations for athlete
            const { data: evaluationsData, error: evalsError } = await supabase
              .from('avaliacoes')
              .select('*')
              .eq('atleta_id', athleteId)
              .order('data_avaliacao', { ascending: false });

            let finalEvals: StudentEvaluation[] = (!evalsError && evaluationsData) ? evaluationsData as StudentEvaluation[] : [];

            try {
              const localStr = localStorage.getItem('local_avaliacoes');
              if (localStr) {
                const locals = JSON.parse(localStr);
                const filteredLocals = locals.filter((l: any) => l.atleta_id === athleteId);
                finalEvals = [...filteredLocals, ...finalEvals];
              }
            } catch (e) {
              console.error(e);
            }
            setStudentEvaluations(finalEvals);

            // 4. Fetch personalized training for this athlete specifically
            const { data: trainingsData, error: trainingsError } = await supabase
              .from('treinos')
              .select('*')
              .eq('atleta_id', athleteId)
              .eq('status', 'agendado')
              .order('data_hora', { ascending: true });

            setStudentTrainings(!trainingsError && trainingsData ? trainingsData : []);

            // Fetch weekly training plan
            const { data: planData, error: planError } = await supabase
              .from('planos_treino')
              .select('*')
              .eq('atleta_id', athleteId)
              .eq('ativo', true)
              .maybeSingle();

            if (!planError && planData) {
              setWeeklyPlan(planData);

              // Fetch template days
              const { data: daysData } = await supabase
                .from('plano_treino_dias')
                .select('*')
                .eq('plano_id', planData.id);
              setPlanDays(daysData || []);

              // Fetch executions
              const { data: execsData } = await supabase
                .from('treino_execucoes')
                .select('*')
                .eq('plano_id', planData.id)
                .order('data', { ascending: true });
              setExecutions(execsData || []);
            } else {
              setWeeklyPlan(null);
              setPlanDays([]);
              setExecutions([]);
            }

            // Fetch flexible weekly workouts
            const { data: weekWorkoutsData } = await supabase
              .from('treinos_semana_atleta')
              .select('*')
              .eq('atleta_id', athleteId)
              .order('created_at', { ascending: true });

            setWeeklyWorkouts(weekWorkoutsData || []);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [isAdmin, profile?.id]);

  const handleStudentPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !studentAthlete) return;

    try {
      setUploadingStudentPhoto(true);
      const optimizedDataUrl = await fileToOptimizedDataUrl(file, 600, 600, 0.85);

      const { error } = await supabase
        .from('atletas')
        .update({ foto_url: optimizedDataUrl })
        .eq('id', studentAthlete.id);

      if (error) throw error;

      if (user?.id) {
        await supabase
          .from('perfis_usuarios')
          .update({ foto_url: optimizedDataUrl })
          .eq('id', user.id);
      }

      setStudentAthlete(prev => prev ? { ...prev, foto_url: optimizedDataUrl } : null);
    } catch (err: any) {
      console.error('Erro ao atualizar foto:', err);
      alert('Erro ao atualizar foto: ' + (err?.message || ''));
    } finally {
      setUploadingStudentPhoto(false);
      if (studentPhotoInputRef.current) studentPhotoInputRef.current.value = '';
    }
  };

  const handleToggleWeeklyWorkout = async (workoutId: string, currentStatus: boolean) => {
    try {
      setUpdatingWorkoutId(workoutId);
      const nextStatus = !currentStatus;
      const { error } = await supabase
        .from('treinos_semana_atleta')
        .update({
          concluido: nextStatus,
          concluido_em: nextStatus ? new Date().toISOString() : null,
        })
        .eq('id', workoutId);

      if (error) throw error;

      setWeeklyWorkouts(prev => prev.map(w => w.id === workoutId ? {
        ...w,
        concluido: nextStatus,
        concluido_em: nextStatus ? new Date().toISOString() : null
      } : w));
    } catch (err: any) {
      console.error('Erro ao marcar treino da semana:', err);
      alert('Erro ao marcar treino.');
    } finally {
      setUpdatingWorkoutId(null);
    }
  };

  const handleToggleExecution = async (execId: string, currentStatus: boolean) => {
    const exec = executions.find(e => e.id === execId);
    if (!exec) return;

    const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
    if (exec.data > todayStr) {
      alert('Não é possível marcar treinos de datas futuras!');
      return;
    }

    setCompletingExecId(execId);
    try {
      const nextStatus = !currentStatus;
      const { error } = await supabase
        .from('treino_execucoes')
        .update({
          concluido: nextStatus,
          concluido_em: nextStatus ? new Date().toISOString() : null,
        })
        .eq('id', execId);

      if (error) throw error;

      setExecutions(prev => prev.map(e => e.id === execId ? { 
        ...e, 
        concluido: nextStatus, 
        concluido_em: nextStatus ? new Date().toISOString() : null 
      } : e));
    } catch (err) {
      console.error('Erro ao atualizar check de treino:', err);
      alert('Erro ao marcar treino concluído.');
    } finally {
      setCompletingExecId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400 flex flex-col items-center justify-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span>Carregando seu painel esportivo...</span>
      </div>
    );
  }

  // A non-admin with no atletas row linked to their account (data load
  // failed, or their profile genuinely has no linked athlete yet). Never
  // fall through to the club-wide coach dashboard below with placeholder
  // numbers, and never substitute a different real athlete's profile here.
  if (!isAdmin && !studentAthlete) {
    return (
      <div className="text-center py-20 text-gray-400 flex flex-col items-center justify-center space-y-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm">Não foi possível carregar os seus dados agora. Tente novamente em instantes.</p>
      </div>
    );
  }

  // --- STUDENT VIEW PORTAL RENDER ---
  if (!isAdmin && studentAthlete) {
    const todayLocal = new Date();
    const todayStr = todayLocal.getFullYear() + '-' + String(todayLocal.getMonth() + 1).padStart(2, '0') + '-' + String(todayLocal.getDate()).padStart(2, '0');
    const isActivePlan = weeklyPlan && weeklyPlan.ativo && todayStr >= weeklyPlan.data_inicio && todayStr <= weeklyPlan.data_fim;
    const weekdayNum = todayLocal.getDay();
    const isWeekend = weekdayNum === 0 || weekdayNum === 6;
    
    const weekdayMapping: Record<number, 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta'> = {
      1: 'segunda',
      2: 'terca',
      3: 'quarta',
      4: 'quinta',
      5: 'sexta'
    };
    const todayWeekdayName = weekdayMapping[weekdayNum];
    
    const todayExercises = isActivePlan && todayWeekdayName
      ? planDays.find(d => d.dia_semana === todayWeekdayName)?.exercicios
      : null;
      
    const todayExecution = isActivePlan 
      ? executions.find(e => e.data === todayStr)
      : null;
      
    const totalExecs = executions.length;
    const completedExecs = executions.filter(e => e.concluido).length;
    const progressPercent = totalExecs > 0 ? Math.round((completedExecs / totalExecs) * 100) : 0;

    const getWeekdayName = (dateStr: string): 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' => {
      const day = new Date(dateStr + 'T00:00:00').getDay();
      const mapping: Record<number, 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta'> = {
        1: 'segunda',
        2: 'terca',
        3: 'quarta',
        4: 'quinta',
        5: 'sexta',
      };
      return mapping[day] || 'segunda';
    };

    const WEEKDAY_KEYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const;
    const WEEKDAY_LABELS: Record<string, string> = {
      segunda: 'Segunda-feira',
      terca: 'Terça-feira',
      quarta: 'Quarta-feira',
      quinta: 'Quinta-feira',
      sexta: 'Sexta-feira',
      sabado: 'Sábado',
      domingo: 'Domingo',
    };

    const currentDayNum = new Date().getDay();
    const currentDayKeyMap: Record<number, 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'> = {
      0: 'domingo',
      1: 'segunda',
      2: 'terca',
      3: 'quarta',
      4: 'quinta',
      5: 'sexta',
      6: 'sabado',
    };
    const todayFlexibleWeekdayKey = currentDayKeyMap[currentDayNum];
    const todayFlexibleWorkout = weeklyWorkouts.find(w => w.dia_semana === todayFlexibleWeekdayKey);
    const totalWeeklyWorkouts = weeklyWorkouts.length;
    const completedWeeklyWorkouts = weeklyWorkouts.filter(w => w.concluido).length;
    const weeklyWorkoutsProgress = totalWeeklyWorkouts > 0 ? Math.round((completedWeeklyWorkouts / totalWeeklyWorkouts) * 100) : 0;

    const nextPayment = studentPayments[0] || {
      tipo_plano: 'mensal',
      status: 'pendente',
      vencimento: '2026-07-05',
      valor: 150.00
    };

    const latestEval = studentEvaluations[0] || {
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

    // Calculate age
    const birthDate = parseLocalDate(studentAthlete.data_nascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return (
      <div className="space-y-6">
        {/* Welcome Athlete Banner */}
        <div className="glass-card p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden bg-gradient-to-r from-primary-dark/80 to-primary/30">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative group h-28 w-28 rounded-full overflow-hidden border-2 border-accent bg-neutral-dark shadow-md">
              {studentAthlete.foto_url ? (
                <img src={studentAthlete.foto_url} alt={studentAthlete.nome} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs">Sem Foto</div>
              )}
              <label
                htmlFor="student-avatar-file-input"
                className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-center p-1"
                title="Escolher foto do computador"
              >
                {uploadingStudentPhoto ? (
                  <Loader2 className="h-5 w-5 text-accent animate-spin" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-accent mb-0.5" />
                    <span className="text-[9px] font-bold">Alterar Foto</span>
                  </>
                )}
              </label>
            </div>
            <input
              id="student-avatar-file-input"
              ref={studentPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleStudentPhotoChange}
              disabled={uploadingStudentPhoto}
            />
            <button
              type="button"
              onClick={() => studentPhotoInputRef.current?.click()}
              disabled={uploadingStudentPhoto}
              className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 font-semibold transition-colors"
            >
              {uploadingStudentPhoto ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3" />
                  Escolher Foto
                </>
              )}
            </button>
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <span className="inline-flex items-center rounded-md bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent ring-1 ring-inset ring-accent/30">
              ATLETA PORTAL
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Olá, {studentAthlete.nome}!
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs text-gray-300">
              <span className="font-semibold text-accent">{studentAthlete.posicao}</span>
              <span className="text-gray-500">|</span>
              <span>Categoria {studentAthlete.categoria}</span>
              <span className="text-gray-500">|</span>
              <span>{age} anos</span>
            </div>
          </div>
        </div>

        {/* Payments Alert Container */}
        <div>
          {nextPayment.status === 'pago' ? (
            <div className="glass-card p-5 border-l-4 border-l-accent flex items-start gap-4">
              <div className="p-2 bg-accent/10 rounded-xl text-accent">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Plano em Dia!</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Seu plano <strong className="text-white capitalize">{nextPayment.tipo_plano}</strong> está pago e regularizado. 
                  Próximo vencimento programado para: <strong className="text-white">{new Date(nextPayment.vencimento + 'T00:00').toLocaleDateString('pt-BR')}</strong>. Obrigado por fazer parte da nossa academia!
                </p>
              </div>
            </div>
          ) : (
            <div className={`glass-card p-5 border-l-4 ${nextPayment.status === 'atrasado' ? 'border-l-red-500' : 'border-l-yellow-500'} flex items-start gap-4 bg-red-500/5`}>
              <div className={`p-2 rounded-xl ${nextPayment.status === 'atrasado' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  Aviso de Pagamento: Plano {nextPayment.tipo_plano.toUpperCase()} {nextPayment.status === 'atrasado' ? 'ATRASADO' : 'PENDENTE'}
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Constatamos que a mensalidade/fatura no valor de{' '}
                  <strong className="text-white">
                    R$ {nextPayment.valor ? nextPayment.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '150,00'}
                  </strong>{' '}
                  {nextPayment.status === 'atrasado' ? 'venceu' : 'vencerá'} em{' '}
                  <strong className="text-white font-mono">
                    {new Date(nextPayment.vencimento + 'T00:00').toLocaleDateString('pt-BR')}
                  </strong>.
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5 italic">
                  *Por favor, realize o pagamento com o seu responsável ou regularize na secretaria da Arena Winner's Mindset.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* --- SISTEMA DE TREINAMENTO DA SEMANA (ALUNO) --- */}
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Meu Treino de Hoje */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-base font-bold text-white flex items-center">
                  <Dumbbell className="h-5 w-5 text-accent mr-2" />
                  Meu Treino de Hoje
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-accent/20 text-accent font-bold uppercase tracking-wider">
                  {WEEKDAY_LABELS[todayFlexibleWeekdayKey]}
                </span>
              </div>

              {todayFlexibleWorkout ? (
                <div className="space-y-4">
                  <div className="p-4 bg-neutral-dark/50 rounded-xl border border-white/5 space-y-2.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {todayFlexibleWorkout.titulo}
                    </h4>
                    <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {todayFlexibleWorkout.conteudo}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleWeeklyWorkout(todayFlexibleWorkout.id, todayFlexibleWorkout.concluido)}
                    disabled={updatingWorkoutId === todayFlexibleWorkout.id}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                      todayFlexibleWorkout.concluido
                        ? 'bg-accent text-neutral-dark hover:bg-accent/90'
                        : 'bg-neutral-dark border border-accent/30 text-accent hover:bg-accent/10'
                    }`}
                  >
                    {updatingWorkoutId === todayFlexibleWorkout.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : todayFlexibleWorkout.concluido ? (
                      <>
                        <Check className="h-4 w-4 stroke-[3px]" />
                        TREINO CONCLUÍDO! (Clique para desmarcar)
                      </>
                    ) : (
                      <>
                        <span className="block h-2 w-2 rounded-full bg-accent animate-ping" />
                        MARQUEI QUE TREINEI HOJE!
                      </>
                    )}
                  </button>
                </div>
              ) : weeklyWorkouts.length > 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 bg-neutral-dark/25 rounded-xl border border-white/5 space-y-2">
                  <Clock className="h-7 w-7 text-accent mx-auto animate-pulse" />
                  <p className="font-bold text-white">Sem treino específico para hoje ({WEEKDAY_LABELS[todayFlexibleWeekdayKey]})</p>
                  <p className="text-[11px] text-gray-500">
                    Aproveite para descansar ou confira a programação dos outros dias da semana abaixo!
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-500 bg-neutral-dark/20 rounded-xl border border-dashed border-white/10">
                  Nenhum treino adicionado pelo seu professor para esta semana ainda. Aguarde as orientações!
                </div>
              )}
            </div>

            {/* Resumo da Semana */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center border-b border-white/5 pb-2">
                <TrendingUp className="h-5 w-5 text-accent mr-2" />
                Progresso Semanal
              </h3>

              {totalWeeklyWorkouts > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-neutral-dark/20 p-4 rounded-xl border border-white/5">
                    {/* Doughnut */}
                    <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Concluídos', value: completedWeeklyWorkouts },
                              { name: 'Pendentes', value: totalWeeklyWorkouts - completedWeeklyWorkouts }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={50}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill="#20c997" />
                            <Cell fill="rgba(255, 255, 255, 0.08)" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-black text-white leading-none">{weeklyWorkoutsProgress}%</span>
                        <span className="text-[8px] text-accent font-bold uppercase tracking-wider mt-0.5">Concluído</span>
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Resumo Semanal</span>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Total de Treinos:</span>
                          <span className="font-bold text-white">{totalWeeklyWorkouts} {totalWeeklyWorkouts === 1 ? 'dia' : 'dias'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Concluídos:</span>
                          <span className="font-bold text-accent">{completedWeeklyWorkouts} {completedWeeklyWorkouts === 1 ? 'dia' : 'dias'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Pendentes:</span>
                          <span className="font-bold text-gray-400">{totalWeeklyWorkouts - completedWeeklyWorkouts} {totalWeeklyWorkouts - completedWeeklyWorkouts === 1 ? 'dia' : 'dias'}</span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-neutral-dark/65 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-accent transition-all duration-500 rounded-full" 
                          style={{ width: `${weeklyWorkoutsProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-500 bg-neutral-dark/20 rounded-xl border border-dashed border-white/10">
                  Nenhum treino disponível para calcular progresso no momento.
                </div>
              )}
            </div>
          </div>

          {/* Programação Completa dos Dias da Semana */}
          {weeklyWorkouts.length > 0 && (
            <div className="glass-card p-6 space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Programação da Semana
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Veja todos os treinos que seu professor preparou para cada dia
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {WEEKDAY_KEYS.map((key) => {
                  const dayWorkouts = weeklyWorkouts.filter(w => w.dia_semana === key);
                  const isToday = key === todayFlexibleWeekdayKey;
                  return (
                    <div 
                      key={key} 
                      className={`p-4 rounded-xl border transition-all ${
                        isToday 
                          ? 'bg-primary/20 border-accent/40 shadow-lg' 
                          : 'bg-neutral-dark/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-accent' : 'text-gray-300'}`}>
                          {WEEKDAY_LABELS[key]}
                        </span>
                        {isToday && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent text-neutral-dark font-black">
                            HOJE
                          </span>
                        )}
                      </div>

                      {dayWorkouts.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-2">Descanso / Sem treino</p>
                      ) : (
                        <div className="space-y-3">
                          {dayWorkouts.map((workout) => (
                            <div key={workout.id} className="space-y-2 bg-black/20 p-3 rounded-lg border border-white/5">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-xs font-bold text-white">{workout.titulo}</h5>
                                <button
                                  type="button"
                                  onClick={() => handleToggleWeeklyWorkout(workout.id, workout.concluido)}
                                  disabled={updatingWorkoutId === workout.id}
                                  title={workout.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
                                  className={`p-1 rounded-md border text-[10px] font-bold transition-colors flex-shrink-0 ${
                                    workout.concluido
                                      ? 'bg-accent text-neutral-dark border-accent hover:bg-accent/80'
                                      : 'bg-neutral-dark text-gray-400 border-white/10 hover:text-white'
                                  }`}
                                >
                                  {updatingWorkoutId === workout.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <p className="text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {workout.conteudo}
                              </p>
                              <div className="pt-1 text-[9px] text-gray-500 font-mono">
                                {workout.concluido ? (
                                  <span className="text-accent font-bold">✓ Concluído</span>
                                ) : (
                                  <span>Pendente</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Training Schedule with YouTube embed */}
        <div>
          <h3 className="text-base font-bold text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 text-accent mr-2" />
            Meu Treinamento Direcionado / Personalizado
          </h3>
          {studentTrainings.length === 0 ? (
            <div className="glass-card p-6 text-center text-gray-400 text-xs">
              Nenhum treino personalizado cadastrado para você no momento. Aguarde o planejamento do seu professor!
            </div>
          ) : (
            <div className="space-y-4">
              {studentTrainings.map((training) => {
                const trDate = new Date(training.data_hora);
                const safeYoutubeUrl = getSafeYoutubeEmbedUrl(training.youtube_url);
                return (
                  <div key={training.id} className="glass-card p-5 space-y-3 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                    
                    <div className="pl-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-primary text-accent rounded-full">
                          {training.categoria}
                        </span>
                        <span className="text-xs text-gray-300 font-semibold">
                          Foco: {training.foco}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center font-mono">
                        <Clock className="h-3.5 w-3.5 mr-1 text-accent" />
                        {trDate.toLocaleDateString('pt-BR')} às {trDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="pl-2 space-y-2">
                      <h4 className="text-base font-bold text-white">{training.titulo}</h4>
                      <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                        <strong className="text-white block mb-1">Planejamento / Instruções do Treino:</strong>
                        {training.descricao || 'Detalhes e cronograma de exercícios a serem descritos pelo professor.'}
                      </p>
                      {training.local && (
                        <p className="text-[10px] text-gray-400 flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-accent/60" />
                          Local: {training.local}
                        </p>
                      )}
                    </div>

                    {safeYoutubeUrl && (
                      <div className="pl-2 pt-2">
                        <span className="text-xs font-bold text-accent flex items-center gap-1.5 mb-2">
                          <Video className="h-4 w-4" />
                          Vídeo Explicativo do Treino (Assista antes da atividade)
                        </span>
                        <div className="aspect-video max-w-lg w-full rounded-xl overflow-hidden border border-white/10 shadow-md">
                          <iframe
                            className="w-full h-full"
                            src={safeYoutubeUrl}
                            title="Treino YouTube"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Evolution section for Student */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Radar Chart (Attributes) */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center">
              <Award className="h-4 w-4 text-accent mr-2" />
              Meu Gráfico de Evolução (Última Avaliação)
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: '600' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#4b5563', fontSize: 9 }} />
                    <Radar name={studentAthlete.nome} dataKey="A" stroke="#20c997" fill="#20c997" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-500 text-xs">Carregando gráfico de radar...</div>
              )}
            </div>
          </div>

          {/* Physical Attributes & Medical Info */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Heart className="h-4 w-4 text-accent mr-2" />
              Dados Físicos & Clínicos
            </h3>

            <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
              <div className="bg-neutral-dark/40 p-3 rounded-lg border border-white/5 text-center">
                <span className="block text-[10px] text-gray-400">Altura</span>
                <span className="text-base font-bold text-white">{studentAthlete.altura ? `${studentAthlete.altura.toFixed(2)} m` : '-'}</span>
              </div>
              <div className="bg-neutral-dark/40 p-3 rounded-lg border border-white/5 text-center">
                <span className="block text-[10px] text-gray-400">Peso</span>
                <span className="text-base font-bold text-white">{studentAthlete.peso ? `${studentAthlete.peso.toFixed(1)} kg` : '-'}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-400 mb-1">Meu Histórico Médico</span>
              <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                {studentAthlete.historico_medico || 'Nenhum registro clínico cadastrado.'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 pt-1">
              <div>
                <span className="font-semibold text-gray-300">Meu Contato:</span> {studentAthlete.telefone || '-'}
              </div>
              <div>
                <span className="font-semibold text-gray-300">Responsável:</span> {studentAthlete.telefone_responsavel || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* History of Evaluations for Student */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-accent mr-2" />
            Minhas Avaliações e Evolução Tática
          </h3>
          {studentEvaluations.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">Nenhuma avaliação realizada ainda.</p>
          ) : (
            <div className="space-y-4">
              {studentEvaluations.map((evalItem, index) => (
                <div key={evalItem.id} className="p-4 bg-neutral-dark/40 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-accent font-semibold">
                      Avaliação #{studentEvaluations.length - index}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center font-mono">
                      📅 {new Date(evalItem.data_avaliacao + 'T00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center bg-primary/10 rounded-lg p-2.5">
                    {[
                      { label: 'Técnica', val: evalItem.nota_tecnica },
                      { label: 'Tática', val: evalItem.nota_tatica },
                      { label: 'Física', val: evalItem.nota_fisica },
                      { label: 'Comport.', val: evalItem.nota_comportamental },
                    ].map((metric, i) => (
                      <div key={i}>
                        <span className="block text-[9px] text-gray-400">{metric.label}</span>
                        <span className="text-sm font-bold text-accent">{Number(metric.val).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>

                  {evalItem.observacoes && (
                    <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                      <strong className="text-white">Evolução e Feedback do Professor:</strong> {evalItem.observacoes}
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

  // --- COACH VIEW PORTAL RENDER (ORIGINAL) ---
  const menuItems = [
    ...(isAdmin ? [{
      title: 'Ficha Avaliativa',
      desc: 'Avalie habilidades técnicas, táticas e comportamentais dos atletas.',
      icon: ClipboardCheck,
      href: '/avaliar',
      color: 'text-accent border-accent/20 bg-accent/5',
    }] : []),
    {
      title: 'Cronograma de Treinos',
      desc: isAdmin ? 'Gerencie sessões coletivas, lista de presenças e evolução.' : 'Consulte a programação de treinos e listas de presença.',
      icon: Calendar,
      href: '/treinos',
      color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
    },
    {
      title: 'Elenco de Atletas',
      desc: isAdmin ? 'Gerencie fichas físicas, posições e evolução técnica do grupo.' : 'Consulte posições, dados físicos e evolução do grupo.',
      icon: Users,
      href: '/atletas',
      color: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
    },
    {
      title: 'Controle de Jogos',
      desc: isAdmin ? 'Monitore jogos agendados, escalação tática e estatísticas.' : 'Confira os próximos confrontos, escalações e resultados.',
      icon: Target,
      href: '/jogos',
      color: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    },
    ...(isAdmin ? [{
      title: 'Gerenciamento Financeiro',
      desc: 'Monitore planos mensais/anuais, vencimentos e histórico de pagamentos.',
      icon: CreditCard,
      href: '/pagamentos',
      color: 'text-purple-400 border-purple-400/20 bg-purple-400/5',
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-dark via-primary to-primary-light p-6 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-accent/15 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-flex items-center rounded-md bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent ring-1 ring-inset ring-accent/30">
            Temporada 2026
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Olá, {profile?.nome || 'Membro'}!
          </h2>
          <p className="mt-2 text-sm text-gray-200 max-w-xl">
            {isAdmin 
              ? 'Pronto para lapidar as próximas estrelas do futebol? Monitore treinos, avalie desempenhos e organize suas táticas em um só lugar.'
              : 'Pronto para os treinos? Acompanhe seu cronograma, posições e evolução técnica do elenco da Winner\'s Mindset.'}
          </p>
        </div>
      </div>

      {/* Pending requests notification */}
      {isAdmin && pendingRequestsCount > 0 && (
        <div className="glass-card border-l-4 border-l-amber-500 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-500/5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Aprovação de Atletas</h4>
              <p className="text-xs text-gray-400 mt-0.5">Há {pendingRequestsCount} solicitação(ões) de cadastro aguardando sua validação.</p>
            </div>
          </div>
          <Link
            href="/admin/solicitacoes"
            className="inline-flex items-center justify-center py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-dark transition-colors self-start sm:self-center"
          >
            Ver Solicitações
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Atletas', value: stats.totalAthletes, icon: Users, desc: 'Atletas inscritos' },
          { 
            label: 'Departamento Médico', 
            value: stats.injuredAthletes, 
            icon: AlertCircle, 
            desc: 'Atletas lesionados', 
            valColor: stats.injuredAthletes > 0 ? 'text-red-400' : 'text-gray-400' 
          },
          { label: 'Treinos Agendados', value: stats.upcomingTrainings, icon: Calendar, desc: 'Próximas sessões' },
          { label: 'Jogos Concluídos', value: stats.completedMatches, icon: Target, desc: 'Nesta temporada' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
                <Icon className="h-4 w-4 text-accent/70" />
              </div>
              <div className="mt-2 flex items-baseline">
                <span className={`text-2xl font-bold tracking-tight ${stat.valColor || 'text-white'}`}>
                  {stats.totalAthletes === 0 && loading ? '...' : stat.value}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Activity Banner */}
      <div className="glass-card p-5 border-l-4 border-l-accent">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/30 p-2.5 rounded-xl text-accent mt-0.5">
              <Timer className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-accent/10 text-accent rounded-full uppercase">
                  Próxima Atividade
                </span>
                <span className="text-xs text-gray-400">
                  {upcoming.category}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {upcoming.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                📍 {upcoming.location} | 📅 {upcoming.dateTime}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs px-2 py-1 bg-white/5 text-gray-300 rounded border border-white/10 font-semibold">
              Foco: {upcoming.focusOrTactics}
            </span>
            <Link 
              href={upcoming.type === 'training' ? '/treinos' : '/jogos'}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md"
            >
              {isAdmin ? 'Gerenciar' : 'Visualizar'}
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Menu */}
      <div>
        <h3 className="text-base font-bold text-white mb-4 flex items-center">
          <Shield className="h-5 w-5 text-accent mr-2" />
          Acesso Rápido
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                href={item.href}
                className="group relative overflow-hidden glass-card p-5 hover:border-accent/40 flex items-start space-x-4"
              >
                <div className={`p-3 rounded-xl border transition-colors group-hover:bg-primary/20 ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white group-hover:text-accent transition-colors flex items-center">
                    {item.title}
                    <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Evolution Section */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center">
            <TrendingUp className="h-5 w-5 text-accent mr-2" />
            Destaques e Evolução do Elenco
          </h3>
          <span className="text-[10px] text-accent font-semibold px-2 py-0.5 bg-accent/10 rounded-full">
            Sub-15 & Sub-17
          </span>
        </div>
        <div className="space-y-3">
          {highlightAthletes.length > 0 ? (
            highlightAthletes.map((item, idx) => (
              <div key={idx} className="p-3 bg-neutral-dark/40 rounded-lg border border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="h-2 w-2 bg-accent rounded-full" />
                  <div>
                    <p className="text-xs font-semibold text-white">{item.nome} ({item.categoria})</p>
                    <p className="text-[10px] text-gray-400">{item.evolucao}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-accent text-xs font-bold bg-accent/10 px-2 py-0.5 rounded">
                  <span>{item.valor}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">Nenhum atleta ativo cadastrado no momento para exibir destaques.</p>
          )}
        </div>
      </div>
    </div>
  );
}
