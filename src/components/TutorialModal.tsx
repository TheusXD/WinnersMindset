'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  X, FileText, Clock, KeyRound, Shirt, Activity, Users, Shield, Trophy,
  CalendarDays, PlayCircle, LogOut, ShieldCheck, UserPlus, Edit2, Trash2,
  Star, CalendarPlus, ClipboardCheck, Send, Flag, CreditCard, type LucideIcon,
} from 'lucide-react';

interface TutorialStep {
  icon: LucideIcon;
  title: string;
  text: string;
  tip?: string;
}

interface TutorialSection {
  label: string;
  heading: string;
  steps: TutorialStep[];
}

const ALUNO_SECTIONS: TutorialSection[] = [
  {
    label: 'Parte 1',
    heading: 'Entrando no time',
    steps: [
      {
        icon: FileText,
        title: 'Faça o seu cadastro',
        text: 'Na tela de entrada, clique em "Criar conta de atleta" e preencha seus dados em 3 passinhos: e-mail e senha, depois nome e data de nascimento, e por último os dados da família.',
        tip: 'Peça ajuda de um adulto pra preencher o CPF, o RG e o telefone.',
      },
      {
        icon: Clock,
        title: 'Espere a aprovação',
        text: 'Depois do cadastro, é igual pedir pra entrar num time novo: o professor precisa dizer "pode entrar!" antes de você jogar. Assim que ele aprovar, você já pode fazer login.',
      },
      {
        icon: KeyRound,
        title: 'Entre com e-mail (ou telefone) e senha',
        text: 'Na tela de login, digite o e-mail ou o telefone do seu cadastro, mais sua senha. Esqueceu a senha? Clique em "Esqueci minha senha".',
      },
    ],
  },
  {
    label: 'Parte 2',
    heading: 'Sua área no time',
    steps: [
      {
        icon: Activity,
        title: 'Conheça o seu painel',
        text: 'É a primeira tela depois do login: sua foto, posição, categoria, e um gráfico mostrando suas notas de Técnica, Tática, Física e Comportamento.',
      },
      {
        icon: Shirt,
        title: 'Veja seu perfil completo',
        text: 'Clique na sua foto ou no seu nome. Lá tem sua altura, peso, o histórico de avaliações e as estatísticas dos jogos que você jogou.',
      },
      {
        icon: Users,
        title: 'Veja o resto do time',
        text: 'No menu "Atletas" você encontra todos os seus colegas: nome, foto, posição e categoria de cada um.',
      },
    ],
  },
  {
    label: 'Parte 3',
    heading: 'Jogos e treinos',
    steps: [
      {
        icon: Trophy,
        title: 'Confira os jogos marcados',
        text: 'No menu "Jogos" você vê os próximos confrontos e os placares dos jogos que já rolaram. Clique em "Quadro Tático" pra ver se você foi escalado.',
      },
      {
        icon: CalendarDays,
        title: 'Siga o plano de treino da semana',
        text: 'No seu painel aparece um exercício pra cada dia (segunda a sexta). Depois de treinar, marque a caixinha de concluído.',
      },
      {
        icon: PlayCircle,
        title: 'Assista o seu treino especial',
        text: 'Às vezes o professor manda um treino só pra você, com vídeo e instruções, direto no seu perfil. Não esqueça de assistir antes do treino!',
      },
    ],
  },
  {
    label: 'Parte 4',
    heading: 'Cuidando da sua conta',
    steps: [
      {
        icon: LogOut,
        title: 'Saindo do sistema',
        text: 'Clique no ícone de saída, no topo da tela, ao lado do seu nome, quando terminar de usar.',
      },
    ],
  },
];

const PROFESSOR_SECTIONS: TutorialSection[] = [
  {
    label: 'Parte 1',
    heading: 'Recebendo novos alunos',
    steps: [
      {
        icon: ShieldCheck,
        title: 'Aprove (ou recuse) os pedidos de cadastro',
        text: 'No menu "Solicitações" ficam os pedidos de quem quer entrar no time. Confira os dados e clique em Confirmar ou Rejeitar. Posição e categoria você define depois, com calma, no perfil do atleta.',
      },
    ],
  },
  {
    label: 'Parte 2',
    heading: 'Cuidando do elenco',
    steps: [
      {
        icon: UserPlus,
        title: 'Cadastre um atleta na mão',
        text: 'No menu "Atletas", clique em "Novo Atleta" pra registrar alguém direto, sem passar pelo pedido de cadastro.',
      },
      {
        icon: Edit2,
        title: 'Edite os dados de um atleta',
        text: 'No perfil dele, clique em "Editar Perfil": posição, categoria, peso, altura, contato e anotações de saúde.',
      },
      {
        icon: Trash2,
        title: 'Remova um atleta do time',
        text: 'Ainda no perfil, o botão "Remover Atleta" tira ele do sistema de vez, junto com avaliações, treinos e presenças.',
        tip: 'Essa ação não tem volta — o sistema sempre pede confirmação antes.',
      },
    ],
  },
  {
    label: 'Parte 3',
    heading: 'Avaliando o time',
    steps: [
      {
        icon: Star,
        title: 'Dê notas pra um atleta',
        text: 'No menu "Avaliar", escolha o atleta e dê uma nota de 1 a 10 em Técnica, Tática, Física e Comportamento. O sistema já monta um relatório pronto pra enviar aos pais.',
      },
    ],
  },
  {
    label: 'Parte 4',
    heading: 'Organizando os treinos',
    steps: [
      {
        icon: CalendarPlus,
        title: 'Marque um novo treino',
        text: 'No menu "Treinos", clique em "Agendar Treino": título, data e hora, local, categoria e o foco do dia.',
      },
      {
        icon: ClipboardCheck,
        title: 'Faça a chamada',
        text: 'Clique em "Chamada" num treino agendado. Marque presente ou ausente pra cada atleta e salve.',
      },
      {
        icon: CalendarDays,
        title: 'Monte o plano de treino da semana',
        text: 'No perfil do atleta, clique em "Criar Plano de Treino" e escreva um exercício pra cada dia, de segunda a sexta.',
      },
      {
        icon: Send,
        title: 'Envie um treino especial',
        text: 'Ainda no perfil do atleta, monte um treino só pra ele: título, um vídeo do YouTube e instruções escritas com carinho.',
      },
    ],
  },
  {
    label: 'Parte 5',
    heading: 'Cuidando dos jogos',
    steps: [
      {
        icon: Flag,
        title: 'Marque um confronto',
        text: 'No menu "Jogos", clique em "Agendar Confronto": adversário, data, local, categoria e esquema tático.',
      },
      {
        icon: Shield,
        title: 'Monte a escalação no quadro tático',
        text: 'Abra o "Quadro Tático" do jogo, clique numa posição do campinho e escolha o atleta daquela categoria.',
      },
      {
        icon: Trophy,
        title: 'Registre o placar',
        text: 'Depois do jogo, clique em "Registrar Placar" e digite o resultado. O jogo passa a aparecer como concluído.',
      },
    ],
  },
  {
    label: 'Parte 6',
    heading: 'Cuidando das mensalidades',
    steps: [
      {
        icon: CreditCard,
        title: 'Controle os pagamentos',
        text: 'No menu "Pagamentos", clique em "Registrar Plano" pra lançar a mensalidade de um atleta. Marque como Pago assim que a família pagar.',
      },
    ],
  },
];

export default function TutorialModal({ onClose }: { onClose: () => void }) {
  const { isAdmin } = useAuth();
  const sections = isAdmin ? PROFESSOR_SECTIONS : ALUNO_SECTIONS;
  const roleLabel = isAdmin ? 'Professor(a) / Admin' : 'Aluno(a)';

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-2xl border-l-4 border-l-accent relative max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4 border-b border-white/5 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-accent/15 text-accent rounded-full uppercase tracking-wider">
              Tutorial — {roleLabel}
            </span>
            <h3 className="text-lg font-bold text-white mt-2">Como usar o Winner&apos;s Mindset</h3>
            <p className="text-xs text-gray-400 mt-1">Um guia rapidinho, passo a passo, pra você não se perder.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white flex-shrink-0"
            aria-label="Fechar tutorial"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-7 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.heading}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-bold px-2 py-0.5 bg-primary/25 text-accent rounded-full uppercase tracking-wider">
                  {section.label}
                </span>
                <h4 className="text-sm font-bold text-white">{section.heading}</h4>
              </div>
              <div className="space-y-4">
                {section.steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent/15 border border-accent/20 text-accent flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <h5 className="text-xs font-bold text-white">{step.title}</h5>
                        <p className="text-xs text-gray-400 leading-relaxed">{step.text}</p>
                        {step.tip && (
                          <p className="text-[11px] text-accent/90 bg-accent/10 border border-accent/20 rounded-lg px-2.5 py-1.5 mt-1.5">
                            💡 {step.tip}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 pt-4 border-t border-white/5 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold bg-accent text-neutral-dark rounded-xl hover:bg-accent/90 transition-colors"
          >
            Entendi, vamos lá!
          </button>
        </div>
      </div>
    </div>
  );
}
