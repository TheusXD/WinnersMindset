'use client';

import React from 'react';
import { Sparkles, Info, Trophy, Activity } from 'lucide-react';

export interface PhysicalScores {
  resistencia: number;
  equilibrio: number;
  flexibilidade: number;
  coordenacao_motora: number;
  potencia: number;
}

export const PHYSICAL_ATTRIBUTES = [
  {
    key: 'resistencia' as const,
    label: 'Resistência',
    emoji: '🫁',
    desc: 'Capacidade cardiorrespiratória e manutenção de esforço prolongado.',
  },
  {
    key: 'equilibrio' as const,
    label: 'Equilíbrio',
    emoji: '⚖️',
    desc: 'Estabilidade postural, sustentação estática e dinâmica do corpo.',
  },
  {
    key: 'flexibilidade' as const,
    label: 'Flexibilidade',
    emoji: '🤸',
    desc: 'Amplitude de movimento das articulações e elasticidade muscular.',
  },
  {
    key: 'coordenacao_motora' as const,
    label: 'Coordenação motora',
    emoji: '🎯',
    desc: 'Sincronia neuromuscular, precisão de movimentos e agilidade motora.',
  },
  {
    key: 'potencia' as const,
    label: 'Potência',
    emoji: '🦵',
    desc: 'Velocidade de explosão muscular, impulsão e aceleração rápida.',
  },
] as const;

export const SCORE_LEVELS: Record<number, { label: string; desc: string }> = {
  1: { label: 'Sedentário', desc: 'Início recente ou sem ritmo atlético' },
  2: { label: 'Meio sedentário', desc: 'Atividade esporádica / em desenvolvimento' },
  3: { label: 'Pouco sedentário', desc: 'Ritmo moderado, em evolução física' },
  4: { label: 'Apto para exercícios', desc: 'Boa capacidade atlética e fôlego' },
  5: { label: 'Exercícios avançados', desc: 'Nível avançado / alto rendimento' },
};

export function getScoreButtonClass(score: number, isSelected: boolean): string {
  if (!isSelected) {
    return 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20 hover:scale-105';
  }

  switch (score) {
    case 1:
      return 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30 scale-105 ring-2 ring-rose-400/40';
    case 2:
      return 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/30 scale-105 ring-2 ring-orange-400/40';
    case 3:
      return 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-400/40';
    case 4:
      return 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400/40';
    case 5:
      return 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-600/30 scale-105 ring-2 ring-blue-400/40';
    default:
      return 'bg-accent text-neutral-dark border-accent scale-105';
  }
}

export function calculateTotalPoints(scores: PhysicalScores): number {
  return (
    (scores.resistencia || 0) +
    (scores.equilibrio || 0) +
    (scores.flexibilidade || 0) +
    (scores.coordenacao_motora || 0) +
    (scores.potencia || 0)
  );
}

export function getPointsCategory(totalPoints: number): {
  label: string;
  badgeClass: string;
  progressPercent: number;
} {
  const percent = Math.min(100, Math.max(0, ((totalPoints - 5) / 20) * 100));

  if (totalPoints >= 22) {
    return {
      label: 'Alto Rendimento (Avançado)',
      badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      progressPercent: percent,
    };
  }
  if (totalPoints >= 17) {
    return {
      label: 'Ótimo Condicionamento (Apto)',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      progressPercent: percent,
    };
  }
  if (totalPoints >= 12) {
    return {
      label: 'Desenvolvimento Regular',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      progressPercent: percent,
    };
  }
  return {
    label: 'Condicionamento Inicial (Atenção)',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    progressPercent: percent,
  };
}

interface PhysicalScoreCardsProps {
  scores: PhysicalScores;
  onChange?: (updated: PhysicalScores) => void;
  readOnly?: boolean;
  showPointsHeader?: boolean;
  compact?: boolean;
}

export default function PhysicalScoreCards({
  scores,
  onChange,
  readOnly = false,
  showPointsHeader = true,
  compact = false,
}: PhysicalScoreCardsProps) {
  const totalPoints = calculateTotalPoints(scores);
  const pointsCategory = getPointsCategory(totalPoints);

  const handleSelect = (key: keyof PhysicalScores, value: number) => {
    if (readOnly || !onChange) return;
    onChange({
      ...scores,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4 w-full">
      {/* Total points banner for the coach */}
      {showPointsHeader && (
        <div className="p-4 rounded-2xl bg-neutral-dark/80 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15 border border-accent/20 text-accent flex-shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400 block">
                  Pontuação Física do Atleta
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{totalPoints}</span>
                  <span className="text-xs font-semibold text-gray-400">/ 25 pontos totais</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${pointsCategory.badgeClass}`}
              >
                <Activity className="h-3.5 w-3.5" />
                {pointsCategory.label}
              </span>
              <span className="text-[10px] text-gray-400">
                Média: {(totalPoints / 5).toFixed(1)} / 5.0 por capacidade
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, (totalPoints / 25) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 5 Physical capabilities cards */}
      <div className="space-y-3">
        {PHYSICAL_ATTRIBUTES.map((attr) => {
          const currentVal = scores[attr.key] || 0;
          const levelInfo = SCORE_LEVELS[currentVal];

          return (
            <div
              key={attr.key}
              className={`rounded-2xl border transition-all ${
                compact ? 'p-3' : 'p-4'
              } bg-neutral-dark/60 border-white/10 hover:border-white/15 shadow-sm`}
            >
              {/* Card Header: Emoji + Title + Level badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg select-none" role="img" aria-label={attr.label}>
                    {attr.emoji}
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-none">{attr.label}</h4>
                    {!compact && (
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{attr.desc}</p>
                    )}
                  </div>
                </div>

                {levelInfo && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                      currentVal === 1
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : currentVal === 2
                        ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                        : currentVal === 3
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : currentVal === 4
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    {currentVal} • {levelInfo.label}
                  </span>
                )}
              </div>

              {/* 1 - 5 Buttons row (identical to user image reference) */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((btnVal) => {
                  const isSelected = currentVal === btnVal;
                  const btnClass = getScoreButtonClass(btnVal, isSelected);

                  return (
                    <button
                      key={btnVal}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleSelect(attr.key, btnVal)}
                      className={`h-11 sm:h-12 rounded-xl flex items-center justify-center font-black text-base sm:text-lg border transition-all select-none ${btnClass} ${
                        readOnly ? 'cursor-default' : 'cursor-pointer active:scale-95'
                      }`}
                      title={`${btnVal} - ${SCORE_LEVELS[btnVal]?.label || ''}`}
                    >
                      {btnVal}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend footnote */}
      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-gray-400 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-gray-300 font-semibold">
          <Info className="h-3.5 w-3.5 text-accent" /> Escala:
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" /> 1 Sedentário
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" /> 2 Meio sedentário
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> 3 Pouco sedentário
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> 4 Apto para exercícios
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" /> 5 Avançado
        </span>
      </div>
    </div>
  );
}
