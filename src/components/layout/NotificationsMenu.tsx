'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  CheckCheck, 
  X, 
  UserPlus, 
  Dumbbell, 
  AlertCircle, 
  CreditCard, 
  TrendingUp, 
  Video, 
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Loader2,
  Scale
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { checkQuadrimestralStatus } from '@/lib/imc';

export interface NotificationItem {
  id: string;
  type: 'solicitacao' | 'treino_feedback' | 'treino_hoje' | 'lesao' | 'financeiro' | 'avaliacao' | 'treino_personalizado' | 'sistema';
  title: string;
  description: string;
  date: string;
  link: string;
  iconType: 'user' | 'dumbbell' | 'alert' | 'card' | 'chart' | 'video' | 'sparkle' | 'scale';
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

export default function NotificationsMenu() {
  const router = useRouter();
  const { user, profile, isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const menuRef = useRef<HTMLDivElement>(null);

  // Load read notifications from localStorage
  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(`notifications_read_${user.id}`);
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Erro ao carregar notificações lidas:', e);
    }
  }, [user]);

  // Fetch notifications based on role
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const items: NotificationItem[] = [];

      if (isAdmin) {
        // 1. Pending student registrations (Solicitações)
        const { data: requests } = await supabase
          .from('solicitacoes_cadastro')
          .select('id, nome, email, created_at')
          .eq('status', 'pendente')
          .order('created_at', { ascending: false })
          .limit(5);

        if (requests && requests.length > 0) {
          requests.forEach((req) => {
            items.push({
              id: `req-${req.id}`,
              type: 'solicitacao',
              title: 'Nova Solicitação de Cadastro',
              description: `${req.nome} solicitou entrada no elenco do Winner's Mindset.`,
              date: req.created_at,
              link: '/admin/solicitacoes',
              iconType: 'user',
              badge: 'Aprovar',
              badgeColor: 'amber',
            });
          });
        }

        // 2. Recent workouts with student feedback (💚 💛 ❤️)
        const { data: workouts } = await supabase
          .from('treinos_semana_atleta')
          .select('id, atleta_id, dia_semana, titulo, feedback, concluido_em, updated_at, created_at')
          .not('feedback', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(6);

        if (workouts && workouts.length > 0) {
          // Get athlete names
          const athleteIds = Array.from(new Set(workouts.map(w => w.atleta_id)));
          const { data: athletesData } = await supabase
            .from('atletas')
            .select('id, nome')
            .in('id', athleteIds);

          const athleteNameMap = new Map((athletesData || []).map(a => [a.id, a.nome]));

          workouts.forEach((w) => {
            const athleteName = athleteNameMap.get(w.atleta_id) || 'Atleta';
            let title = 'Feedback de Treino';
            let badge = 'Executado';
            let badgeColor: 'emerald' | 'amber' | 'rose' = 'emerald';
            let emoji = '💚';

            if (w.feedback === 'dificuldade') {
              title = `${emoji} Treino com Dificuldade`;
              badge = 'Dificuldade';
              badgeColor = 'amber';
              emoji = '💛';
            } else if (w.feedback === 'nao_executado') {
              title = `${emoji} Treino Não Executado`;
              badge = 'Não executou';
              badgeColor = 'rose';
              emoji = '❤️';
            } else {
              title = `${emoji} Treino Concluído`;
            }

            items.push({
              id: `workout-feedback-${w.id}-${w.feedback}`,
              type: 'treino_feedback',
              title,
              description: `${athleteName} marcou "${w.titulo}" (${w.dia_semana}) como ${badge.toLowerCase()}.`,
              date: w.concluido_em || w.updated_at || w.created_at || new Date().toISOString(),
              link: `/atletas/${w.atleta_id}`,
              iconType: 'dumbbell',
              badge,
              badgeColor,
            });
          });
        }

        // 3. Injured athletes in medical department
        const { data: injuredAthletes } = await supabase
          .from('atletas')
          .select('id, nome, created_at')
          .eq('status', 'lesionado')
          .limit(3);

        if (injuredAthletes && injuredAthletes.length > 0) {
          injuredAthletes.forEach((athlete) => {
            items.push({
              id: `injured-${athlete.id}`,
              type: 'lesao',
              title: 'Atleta no Departamento Médico',
              description: `${athlete.nome} está marcado como lesionado no elenco.`,
              date: athlete.created_at || new Date().toISOString(),
              link: `/atletas/${athlete.id}`,
              iconType: 'alert',
              badge: 'DM',
              badgeColor: 'rose',
            });
          });
        }

        // 4. Overdue or pending payments
        const { data: pendingPayments } = await supabase
          .from('pagamentos')
          .select('id, atleta_id, valor, vencimento, status')
          .in('status', ['atrasado', 'pendente'])
          .order('vencimento', { ascending: true })
          .limit(3);

        if (pendingPayments && pendingPayments.length > 0) {
          const overdueCount = pendingPayments.filter(p => p.status === 'atrasado').length;
          items.push({
            id: `payments-summary-${pendingPayments[0].id}`,
            type: 'financeiro',
            title: overdueCount > 0 ? 'Mensalidades em Atraso' : 'Mensalidades Pendentes',
            description: `Existem ${pendingPayments.length} pagamento(s) aguardando confirmação ou em atraso.`,
            date: pendingPayments[0].vencimento || new Date().toISOString(),
            link: '/pagamentos',
            iconType: 'card',
            badge: overdueCount > 0 ? `${overdueCount} em atraso` : 'Pendentes',
            badgeColor: overdueCount > 0 ? 'rose' : 'amber',
          });
        }

        // 5. Quadrimestral Physical Re-evaluation Alert (+4 meses)
        const { data: athletesForReval } = await supabase
          .from('atletas')
          .select('id, nome, data_ultima_pesagem, created_at')
          .eq('status', 'ativo')
          .limit(20);

        if (athletesForReval && athletesForReval.length > 0) {
          const dueAthletes = athletesForReval.filter(a => {
            const check = checkQuadrimestralStatus(a.data_ultima_pesagem);
            return check.isDue;
          });

          if (dueAthletes.length > 0) {
            dueAthletes.slice(0, 3).forEach(ath => {
              items.push({
                id: `quadrimestral-due-${ath.id}`,
                type: 'avaliacao',
                title: '⚠️ Reavaliação Quadrimestral (+4 meses)',
                description: `${ath.nome} completou o ciclo de 4 meses sem nova pesagem. É hora de recalcular o IMC e adaptar o treino!`,
                date: ath.data_ultima_pesagem || ath.created_at || new Date().toISOString(),
                link: `/atletas/${ath.id}`,
                iconType: 'scale',
                badge: 'Reavaliar',
                badgeColor: 'amber',
              });
            });
          }
        }

      } else {
        // STUDENT / ATHLETE NOTIFICATIONS
        const { data: athlete } = await supabase
          .from('atletas')
          .select('id, nome, data_ultima_pesagem')
          .eq('usuario_id', user.id)
          .maybeSingle();

        if (athlete) {
          // 1. Today's daily flexible workout
          const daysMap: Record<number, string> = {
            0: 'domingo',
            1: 'segunda',
            2: 'terca',
            3: 'quarta',
            4: 'quinta',
            5: 'sexta',
            6: 'sabado',
          };
          const todayKey = daysMap[new Date().getDay()];

          const { data: todayWorkouts } = await supabase
            .from('treinos_semana_atleta')
            .select('id, dia_semana, titulo, conteudo, feedback, created_at')
            .eq('atleta_id', athlete.id)
            .eq('dia_semana', todayKey);

          if (todayWorkouts && todayWorkouts.length > 0) {
            todayWorkouts.forEach((tw) => {
              items.push({
                id: `student-workout-today-${tw.id}`,
                type: 'treino_hoje',
                title: tw.feedback ? 'Treino de Hoje Avaliado' : 'Treino de Hoje Disponível!',
                description: tw.feedback 
                  ? `Você já enviou o feedback para "${tw.titulo}". Bom trabalho!`
                  : `Seu treino "${tw.titulo}" está pronto. Acesse para dar seu feedback (💚/💛/❤️)!`,
                date: tw.created_at || new Date().toISOString(),
                link: '/',
                iconType: 'dumbbell',
                badge: tw.feedback ? 'Avaliado' : 'Hoje',
                badgeColor: tw.feedback ? 'emerald' : 'amber',
              });
            });
          }

          // 2. Latest technical evaluations
          const { data: latestEvals } = await supabase
            .from('avaliacoes')
            .select('id, data_avaliacao, created_at, nota_tecnica, nota_fisica')
            .eq('atleta_id', athlete.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (latestEvals && latestEvals.length > 0) {
            const ev = latestEvals[0];
            items.push({
              id: `student-eval-${ev.id}`,
              type: 'avaliacao',
              title: 'Avaliação de Desempenho',
              description: 'O professor registrou sua evolução técnica, física e tática no radar.',
              date: ev.created_at || ev.data_avaliacao,
              link: '/',
              iconType: 'chart',
              badge: 'Evolução',
              badgeColor: 'blue',
            });
          }

          // 3. Personalized trainings
          const { data: personalTrainings } = await supabase
            .from('treinos')
            .select('id, titulo, foco, data_hora, created_at')
            .eq('atleta_id', athlete.id)
            .eq('status', 'agendado')
            .order('data_hora', { ascending: true })
            .limit(1);

          if (personalTrainings && personalTrainings.length > 0) {
            const pt = personalTrainings[0];
            items.push({
              id: `student-pt-${pt.id}`,
              type: 'treino_personalizado',
              title: 'Treino Personalizado Agendado',
              description: `Treino individualizado: "${pt.titulo}" com foco em ${pt.foco}.`,
              date: pt.created_at || pt.data_hora,
              link: '/',
              iconType: 'video',
              badge: pt.foco,
              badgeColor: 'purple',
            });
          }

          // 4. Payment status
          const { data: payments } = await supabase
            .from('pagamentos')
            .select('id, status, vencimento')
            .eq('atleta_id', athlete.id)
            .in('status', ['pendente', 'atrasado'])
            .order('vencimento', { ascending: true })
            .limit(1);

          if (payments && payments.length > 0) {
            const p = payments[0];
            items.push({
              id: `student-payment-${p.id}`,
              type: 'financeiro',
              title: p.status === 'atrasado' ? 'Mensalidade em Atraso' : 'Mensalidade Pendente',
              description: 'Lembrete financeiro: confira os dados de pagamento da sua matrícula.',
              date: p.vencimento || new Date().toISOString(),
              link: '/pagamentos',
              iconType: 'card',
              badge: p.status === 'atrasado' ? 'Atrasado' : 'Pendente',
              badgeColor: p.status === 'atrasado' ? 'rose' : 'amber',
            });
          }

          // 5. Student Quadrimestral Re-evaluation Alert
          if (athlete.data_ultima_pesagem !== undefined) {
            const check = checkQuadrimestralStatus(athlete.data_ultima_pesagem);
            if (check.isDue) {
              items.push({
                id: `student-quadrimestral-due-${athlete.id}`,
                type: 'avaliacao',
                title: '⚖️ Reavaliação Física Quadrimestral',
                description: 'Completou 4 meses desde sua última pesagem! Procure o professor para atualizar suas medidas e calibrar seus treinos.',
                date: athlete.data_ultima_pesagem || new Date().toISOString(),
                link: `/atletas/${athlete.id}`,
                iconType: 'scale',
                badge: '4 Meses',
                badgeColor: 'purple',
              });
            }
          }
        }
      }

      // Default welcome notification if empty
      if (items.length === 0) {
        items.push({
          id: 'welcome-system-info',
          type: 'sistema',
          title: "Bem-vindo ao Winner's Mindset!",
          description: isAdmin 
            ? 'Monitore os treinos, avalie seus atletas e acompanhe os feedbacks diários em tempo real.'
            : 'Acesse seus treinos diários da semana e envie seu feedback com os corações!',
          date: new Date().toISOString(),
          link: '/',
          iconType: 'sparkle',
          badge: 'Novidade',
          badgeColor: 'emerald',
        });
      }

      setNotifications(items);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markAllAsRead = () => {
    if (!user) return;
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem(`notifications_read_${user.id}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar notificações lidas:', e);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (user && !readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      try {
        localStorage.setItem(`notifications_read_${user.id}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Erro ao salvar notificação lida:', e);
      }
    }
    setIsOpen(false);
    router.push(item.link);
  };

  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'unread') {
      return !readIds.includes(item.id);
    }
    return true;
  });

  const renderIcon = (type: NotificationItem['iconType'], badgeColor?: NotificationItem['badgeColor']) => {
    const colorClasses = {
      emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    const cls = `p-2 rounded-xl border flex-shrink-0 ${colorClasses[badgeColor || 'emerald']}`;

    switch (type) {
      case 'user':
        return <div className={cls}><UserPlus className="h-4 w-4" /></div>;
      case 'dumbbell':
        return <div className={cls}><Dumbbell className="h-4 w-4" /></div>;
      case 'alert':
        return <div className={cls}><AlertCircle className="h-4 w-4" /></div>;
      case 'card':
        return <div className={cls}><CreditCard className="h-4 w-4" /></div>;
      case 'chart':
        return <div className={cls}><TrendingUp className="h-4 w-4" /></div>;
      case 'video':
        return <div className={cls}><Video className="h-4 w-4" /></div>;
      case 'scale':
        return <div className={cls}><Scale className="h-4 w-4" /></div>;
      default:
        return <div className={cls}><Sparkles className="h-4 w-4" /></div>;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Button Trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Notificações do sistema"
        aria-label="Abrir notificações"
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
            : 'text-gray-400 hover:text-white hover:bg-white/5 active:scale-95'
        }`}
      >
        <Bell className="h-5 w-5" />

        {/* Pulsing indicator & Count badge when unread notifications exist */}
        {unreadCount > 0 ? (
          <>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-accent rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-black text-neutral-dark shadow-md shadow-accent/25">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-white/20" />
        )}
      </button>

      {/* Flyout Popover */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div 
            className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl border border-white/10 bg-neutral-dark/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-accent/15 text-accent">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Notificações
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-accent/20 text-accent border border-accent/30 text-[10px] font-black font-mono">
                        {unreadCount} nova{unreadCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    title="Marcar todas como lidas"
                    className="p-1.5 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors text-[11px] flex items-center gap-1 font-semibold"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lidas</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center px-3 pt-2.5 pb-1 gap-2 border-b border-white/5 bg-black/20 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  activeTab === 'all'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Todas ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                  activeTab === 'unread'
                    ? 'bg-accent/20 text-accent'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Não lidas
                {unreadCount > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 p-1.5 space-y-1">
              {loading && notifications.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <span>Carregando notificações...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-2">
                  <div className="p-3 w-12 h-12 rounded-full bg-accent/10 border border-accent/20 text-accent mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-white">Tudo limpo por aqui!</p>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                    {activeTab === 'unread'
                      ? 'Você não possui notificações pendentes de leitura.'
                      : 'Nenhuma notificação encontrada no momento.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isRead = readIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start gap-3 group ${
                        isRead
                          ? 'opacity-70 hover:opacity-100 hover:bg-white/5'
                          : 'bg-accent/5 border border-accent/20 hover:bg-accent/10'
                      }`}
                    >
                      {renderIcon(item.iconType, item.badgeColor)}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-accent transition-colors">
                            {item.title}
                          </h4>
                          {!isRead && (
                            <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0 animate-pulse" />
                          )}
                        </div>

                        <p className="text-[11px] text-gray-300 leading-snug line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between pt-0.5 text-[10px] text-gray-400 font-mono">
                          <span>{formatRelativeTime(item.date)}</span>
                          <span className="text-accent flex items-center gap-0.5 text-[10px] font-sans font-bold group-hover:underline">
                            Ver detalhes <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/10 bg-black/40 text-center">
              <span className="text-[10px] text-gray-400 font-semibold">
                Winner&apos;s Mindset • Atualizado em tempo real
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
