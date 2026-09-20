/**
 * Utilitário de Cálculo de IMC, Níveis de Atividade Física
 * e Prescrição de Treino para a Comissão Técnica (Winner's Mindset)
 */

export interface NivelAtividadeInfo {
  nivel: number;
  label: string;
  sublabel: string;
  descricao: string;
  badgeColor: string;
  titulo: string;
}

export const NIVEIS_ATIVIDADE: NivelAtividadeInfo[] = [
  {
    nivel: 1,
    label: 'Sedentário',
    titulo: 'Sedentário',
    sublabel: 'Nível 1',
    descricao: 'Pouca ou nenhuma atividade física regular no dia a dia.',
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  {
    nivel: 2,
    label: 'Meio sedentário',
    titulo: 'Meio sedentário',
    sublabel: 'Nível 2',
    descricao: 'Atividades físicas raras ou caminhadas leves ocasionais.',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    nivel: 3,
    label: 'Pouco sedentário',
    titulo: 'Pouco sedentário',
    sublabel: 'Nível 3',
    descricao: 'Pratica esportes ou exercícios 1 a 2 vezes por semana sem regularidade fixa.',
    badgeColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  {
    nivel: 4,
    label: 'Apto para exercícios físicos',
    titulo: 'Apto para exercícios físicos',
    sublabel: 'Nível 4',
    descricao: 'Pratica atividades regulares com bom condicionamento físico de base.',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  {
    nivel: 5,
    label: 'Exercícios físicos avançado',
    titulo: 'Exercícios físicos avançado',
    sublabel: 'Nível 5',
    descricao: 'Rotina intensa de treinos diários, alto rendimento físico e resistência atlética.',
    badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
];

export interface IMCCategoryInfo {
  label: string;
  categoriaKey: 'abaixo' | 'ideal' | 'sobrepeso' | 'obesidade1' | 'obesidade2';
  color: string;
  bgColor: string;
  borderColor: string;
  badge: string;
  bg: string;
  border: string;
  description: string;
}

/**
 * Calcula o IMC (Índice de Massa Corporal)
 * Peso em kg e Altura em metros (aceita também em cm se > 3)
 */
export function calculateIMC(pesoKg?: number | null, alturaM?: number | null): number | null {
  if (!pesoKg || !alturaM || pesoKg <= 0 || alturaM <= 0) return null;

  // Se a altura foi digitada em cm (ex: 175 em vez de 1.75), converte para metros
  const h = alturaM > 3 ? alturaM / 100 : alturaM;
  if (h <= 0) return null;

  const imc = pesoKg / (h * h);
  if (!isFinite(imc) || isNaN(imc)) return null;

  return Math.round(imc * 10) / 10;
}

/**
 * Retorna a classificação médica do IMC
 */
export function getIMCCategory(imc: number | null): IMCCategoryInfo {
  if (imc === null || imc <= 0) {
    return {
      label: 'Não informado',
      categoriaKey: 'ideal',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/20',
      badge: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
      description: 'Informe peso e altura para calcular.',
    };
  }

  if (imc < 18.5) {
    return {
      label: 'Abaixo do peso',
      categoriaKey: 'abaixo',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-blue-500/30',
      badge: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30',
      description: 'Abaixo da faixa ideal de massa corporal (IMC < 18.5).',
    };
  }

  if (imc < 25.0) {
    return {
      label: 'Peso ideal',
      categoriaKey: 'ideal',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
      borderColor: 'border-emerald-500/30',
      badge: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/30',
      description: 'Faixa saudável e recomendada pela OMS (IMC 18.5 - 24.9).',
    };
  }

  if (imc < 30.0) {
    return {
      label: 'Sobrepeso',
      categoriaKey: 'sobrepeso',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-500/30',
      badge: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      description: 'Levemente acima do peso ideal (IMC 25.0 - 29.9).',
    };
  }

  if (imc < 35.0) {
    return {
      label: 'Obesidade Grau I',
      categoriaKey: 'obesidade1',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/15',
      borderColor: 'border-orange-500/30',
      badge: 'text-orange-400',
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/30',
      description: 'Requer atenção cardiorrespiratória e articular (IMC 30.0 - 34.9).',
    };
  }

  return {
    label: 'Obesidade Grau II/III',
    categoriaKey: 'obesidade2',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30',
    badge: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    description: 'Acompanhamento de alta prioridade com baixo impacto articular (IMC >= 35.0).',
  };
}

/**
 * Retorna as informações do nível de atividade (1 a 5)
 */
export function getNivelAtividadeInfo(nivel?: number | null): NivelAtividadeInfo {
  const found = NIVEIS_ATIVIDADE.find((n) => n.nivel === Number(nivel));
  return found || NIVEIS_ATIVIDADE[0];
}

export interface WorkoutRecommendationResult {
  titulo: string;
  focoPrincipal: string;
  focus: string;
  diretrizes: string[];
  guidelines: string[];
  cuidados: string[];
  precautions: string;
}

/**
 * Gera recomendação personalizada de treino para o professor baseada no IMC e Nível de Atividade
 */
export function getWorkoutRecommendation(imc: number | null, nivelAtividade?: number | null): WorkoutRecommendationResult {
  const cat = getIMCCategory(imc);
  const nivel = Number(nivelAtividade) || 1;

  // Sedentário / Meio Sedentário com Sobrepeso ou Obesidade
  if ((cat.categoriaKey === 'sobrepeso' || cat.categoriaKey === 'obesidade1' || cat.categoriaKey === 'obesidade2') && nivel <= 2) {
    const diretrizes = [
      'Iniciar treinos com trotes leves intervalados com caminhada rápida (aeróbico contínuo).',
      'Priorizar trabalhos de mobilidade articular e fortalecimento do core e membros inferiores.',
      'Incluir circuitos técnicos com bola em ritmo moderado para manter o engajamento sem estafa precoce.',
      'Sessões de 30 a 45 minutos com pausas de hidratação mais frequentes.',
    ];
    const cuidados = [
      'Evitar saltos repetitivos em solo duro e freadas bruscas de alta intensidade.',
      'Monitorar frequência cardíaca e sintomas de fadiga excessiva.',
    ];
    return {
      titulo: 'Adaptação Cardiovascular e Baixo Impacto',
      focoPrincipal: 'Gasto calórico progressivo com proteção das articulações (joelhos e tornozelos).',
      focus: 'Gasto calórico progressivo com proteção das articulações (joelhos e tornozelos).',
      diretrizes,
      guidelines: diretrizes,
      cuidados,
      precautions: cuidados.join(' '),
    };
  }

  // Sedentário / Meio Sedentário com Peso Ideal ou Abaixo
  if (nivel <= 2) {
    const diretrizes = [
      'Fundamentos básicos com bola: passe, controle orientado e condução em zigue-zague.',
      'Trabalhos coordenativos em escada de agilidade com intensidade moderada.',
      'Pequenos jogos reduzidos (3x3 ou 4x4) com tempo controlado para ganhar ritmo de jogo.',
      'Fortalecimento muscular funcional (agachamentos livres, pranchas, elevações pélvicas).',
    ];
    const cuidados = [
      'Aumentar o volume de treino gradativamente ao longo das primeiras 4 a 6 semanas.',
    ];
    return {
      titulo: 'Condicionamento de Base e Coordenação Motora',
      focoPrincipal: 'Desenvolver resistência aeróbica inicial e memória muscular dos fundamentos.',
      focus: 'Desenvolver resistência aeróbica inicial e memória muscular dos fundamentos.',
      diretrizes,
      guidelines: diretrizes,
      cuidados,
      precautions: cuidados.join(' '),
    };
  }

  // Pouco Sedentário (Nível 3)
  if (nivel === 3) {
    const diretrizes = [
      'Treinos de velocidade com mudanças de direção e tomadas de decisão rápidas.',
      'Rondos e jogos de posse de bola sob pressão para trabalhar ritmo e cognição.',
      'Exercícios pliométricos leves para melhora de impulsão e arranque inicial.',
      cat.categoriaKey === 'sobrepeso' 
        ? 'Intercalar blocos intensos com estímulos de resistência cardiorrespiratória para suporte ao peso ideal.'
        : 'Treinos de potência de chute e aceleração em curta distância.',
    ];
    const cuidados = [
      'Atenção à recuperação muscular entre treinos seguidos.',
    ];
    return {
      titulo: 'Transição para Ritmo Competitivo',
      focoPrincipal: 'Elevação da intensidade, capacidade aeróbica intermitente e agilidade.',
      focus: 'Elevação da intensidade, capacidade aeróbica intermitente e agilidade.',
      diretrizes,
      guidelines: diretrizes,
      cuidados,
      precautions: cuidados.join(' '),
    };
  }

  // Apto (Nível 4) ou Avançado (Nível 5)
  const diretrizes = [
    'Sprints repetidos com bola e finalizações sob marcação e pressão de tempo.',
    'Treinos táticos setorizados da posição (ex: transição defensiva/ofensiva, infiltração ou marcação).',
    'Treinos de potência máxima, impulsão para bolas aéreas e duelos 1x1.',
    'Simulações de situações de jogo de alta intensidade com duração completa.',
  ];
  const cuidados = [
    'Garantir trabalho preventivo de flexibilidade e recuperação ativa para evitar lesões musculares.',
  ];
  return {
    titulo: 'Alta Performance e Especificidade Tática',
    focoPrincipal: 'Treinos em velocidade real de partida, potência anaeróbica e especificidade da posição.',
    focus: 'Treinos em velocidade real de partida, potência anaeróbica e especificidade da posição.',
    diretrizes,
    guidelines: diretrizes,
    cuidados,
    precautions: cuidados.join(' '),
  };
}

export interface QuadrimestralStatusResult {
  isDue: boolean;
  daysPassed: number;
  daysSince: number;
  daysRemaining: number;
  nextDueDateFormatted: string;
  formattedNextDate: string;
  lastDateFormatted: string;
  formattedLastDate: string;
}

/**
 * Verifica o ciclo quadrimestral (4 meses / 120 dias)
 */
export function checkQuadrimestralStatus(dataUltimaPesagem?: string | Date | null): QuadrimestralStatusResult {
  const INTERVAL_DAYS = 120; // 4 meses

  if (!dataUltimaPesagem) {
    return {
      isDue: true,
      daysPassed: 999,
      daysSince: 999,
      daysRemaining: 0,
      nextDueDateFormatted: 'Imediata (Sem registro)',
      formattedNextDate: 'Imediata (Sem registro)',
      lastDateFormatted: 'Nunca avaliado',
      formattedLastDate: 'Sem registro',
    };
  }

  const lastDate = new Date(dataUltimaPesagem);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - lastDate.getTime());
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, INTERVAL_DAYS - daysPassed);
  const isDue = daysPassed >= INTERVAL_DAYS;

  const nextDate = new Date(lastDate.getTime() + INTERVAL_DAYS * 24 * 60 * 60 * 1000);

  const formatDate = (d: Date) => {
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formattedNextDate = formatDate(nextDate);
  const formattedLastDate = formatDate(lastDate);

  return {
    isDue,
    daysPassed,
    daysSince: daysPassed,
    daysRemaining,
    nextDueDateFormatted: formattedNextDate,
    formattedNextDate,
    lastDateFormatted: formattedLastDate,
    formattedLastDate,
  };
}
