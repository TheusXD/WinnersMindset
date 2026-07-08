'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ClipboardCheck, Users, Calendar, AlertCircle, FileText, CheckCircle2, Copy, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Athlete {
  id: string;
  nome: string;
  categoria: string;
  posicao: string;
}

const MOCK_ATHLETES: Athlete[] = [
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', nome: 'Lucas Silva', categoria: 'Sub-15', posicao: 'Centroavante' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', nome: 'Enzo Gabriel', categoria: 'Sub-15', posicao: 'Meia' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', nome: 'Gabriel Santos', categoria: 'Sub-15', posicao: 'Zagueiro' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', nome: 'Matheus Oliveira', categoria: 'Sub-15', posicao: 'Goleiro' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', nome: 'Pedro Henrique', categoria: 'Sub-15', posicao: 'Ponta Direita' },
];

export default function EvaluationsPage() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>(MOCK_ATHLETES);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Evaluation form attributes
  const [notaTecnica, setNotaTecnica] = useState(7.0);
  const [notaTatica, setNotaTatica] = useState(7.0);
  const [notaFisica, setNotaFisica] = useState(7.0);
  const [notaComportamental, setNotaComportamental] = useState(7.0);
  const [observacoes, setObservacoes] = useState('');

  // Submission/Report states
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState(false);

  async function fetchAthletes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('atletas')
        .select('id, nome, categoria, posicao')
        .order('nome', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setAthletes(data as Athlete[]);
        setSelectedAthleteId(data[0].id);
      } else {
        setAthletes(MOCK_ATHLETES);
        setSelectedAthleteId(MOCK_ATHLETES[0].id);
      }
    } catch (err) {
      console.warn('Erro ao buscar atletas do Supabase, usando locais:', err);
      setAthletes(MOCK_ATHLETES);
      setSelectedAthleteId(MOCK_ATHLETES[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => {
        fetchAthletes();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-white">Acesso Restrito</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Apenas treinadores e auxiliares têm permissão para acessar a ficha de avaliação e lançar relatórios técnicos.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-2 px-5 py-2.5 bg-primary border border-primary-light text-white text-xs font-bold rounded-xl hover:bg-primary/80 transition-colors"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  const saveLocalEvaluation = (evalData: {
    atleta_id: string;
    treinador_id: string | null;
    data_avaliacao: string;
    nota_tecnica: number;
    nota_tatica: number;
    nota_fisica: number;
    nota_comportamental: number;
    observacoes: string | null;
  }) => {
    try {
      const existing = localStorage.getItem('local_avaliacoes');
      const list = existing ? JSON.parse(existing) : [];
      const newEval = {
        id: Math.random().toString(),
        ...evalData,
      };
      list.push(newEval);
      localStorage.setItem('local_avaliacoes', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId) return;

    setSubmitting(true);
    const athlete = athletes.find(a => a.id === selectedAthleteId);

    const evaluationData = {
      atleta_id: selectedAthleteId,
      treinador_id: user?.id ?? null,
      data_avaliacao: new Date().toISOString().split('T')[0],
      nota_tecnica: Number(notaTecnica),
      nota_tatica: Number(notaTatica),
      nota_fisica: Number(notaFisica),
      nota_comportamental: Number(notaComportamental),
      observacoes: observacoes || null,
    };

    try {
      const { error } = await supabase.from('avaliacoes').insert([evaluationData]);
      if (error) throw error;

      setSaveError(false);
      saveLocalEvaluation(evaluationData);
      generateReportText(athlete, evaluationData);
    } catch (err) {
      console.error('Erro ao salvar avaliação no Supabase. Salvando localmente:', err);
      setSaveError(true);
      // Fallback: still show the report to the user even on local fallback!
      saveLocalEvaluation(evaluationData);
      generateReportText(athlete, evaluationData);
    } finally {
      setSubmitting(false);
    }
  };

  const generateReportText = (
    athlete: Athlete | undefined,
    data: {
      nota_tecnica: number;
      nota_tatica: number;
      nota_fisica: number;
      nota_comportamental: number;
      data_avaliacao: string;
      observacoes?: string | null;
    }
  ) => {
    const media = ((data.nota_tecnica + data.nota_tatica + data.nota_fisica + data.nota_comportamental) / 4).toFixed(1);
    const textReport = `===========================================
RELATÓRIO DE AVALIAÇÃO TÉCNICA - WINNER'S MINDSET
===========================================
Atleta: ${athlete?.nome || 'Atleta não especificado'}
Categoria: ${athlete?.categoria || 'N/A'} | Posição: ${athlete?.posicao || 'N/A'}
Data da Avaliação: ${new Date(data.data_avaliacao).toLocaleDateString('pt-BR')}
-------------------------------------------
NOTAS (Escala 1 a 10):
- Nota Técnica: ${data.nota_tecnica.toFixed(1)}
- Nota Tática: ${data.nota_tatica.toFixed(1)}
- Nota Física: ${data.nota_fisica.toFixed(1)}
- Nota Comportamental: ${data.nota_comportamental.toFixed(1)}
-------------------------------------------
MÉDIA GERAL: ${media} / 10.0
-------------------------------------------
OBSERVAÇÕES DO TREINADOR:
${data.observacoes || 'Nenhuma observação inserida.'}
===========================================`;

    setReport(textReport);
  };

  const copyToClipboard = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setReport(null);
    setNotaTecnica(7.0);
    setNotaTatica(7.0);
    setNotaFisica(7.0);
    setNotaComportamental(7.0);
    setObservacoes('');
    setSaveError(false);
  };

  const getScoreColor = (val: number) => {
    if (val < 5.0) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (val < 7.0) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-accent bg-accent/15 border-accent/20';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Ficha de Avaliação de Desempenho</h2>
        <p className="text-sm text-gray-400">Avalie os atletas e gere relatórios técnicos instantaneamente.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando elenco de atletas...</div>
      ) : report ? (
        /* Formatted Report View */
        <div className="glass-card p-6 border-l-4 border-l-accent space-y-6">
          <div className="flex items-center space-x-2 text-accent">
            {saveError ? (
              <>
                <AlertCircle className="h-6 w-6 text-amber-500" />
                <h3 className="text-lg font-bold text-white">Avaliação Salva Apenas Localmente</h3>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="text-lg font-bold text-white">Avaliação Salva com Sucesso!</h3>
              </>
            )}
          </div>
          {saveError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs">
              ⚠️ Não foi possível salvar os dados no servidor do banco de dados (Supabase). A avaliação foi gravada apenas no cache local deste navegador e poderá ser perdida se você limpar o histórico de navegação.
            </div>
          )}

          <div className="relative">
            <pre className="p-4 bg-neutral-dark/80 rounded-xl border border-white/5 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {report}
            </pre>
            <button
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-2 bg-primary/80 border border-primary-light/30 text-accent rounded-lg hover:bg-primary transition-colors flex items-center justify-center text-xs font-semibold"
              title="Copiar Relatório"
            >
              <Copy className="h-4 w-4 mr-1.5" />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 text-xs font-bold bg-accent text-neutral-dark rounded-xl hover:bg-accent/90 transition-colors shadow-md"
            >
              Nova Avaliação
            </button>
          </div>
        </div>
      ) : (
        /* Evaluation Input Form */
        <form onSubmit={handleSaveEvaluation} className="glass-card p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center">
                <Users className="h-4 w-4 text-accent mr-1.5" />
                Selecione o Atleta
              </label>
              <select
                className="w-full glass-input bg-neutral-dark/80 text-sm font-semibold"
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
              >
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.categoria} - {a.posicao})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center">
                <Calendar className="h-4 w-4 text-accent mr-1.5" />
                Data de Lançamento
              </label>
              <input
                type="text"
                disabled
                className="w-full glass-input bg-neutral-dark/30 text-gray-500 cursor-not-allowed text-sm"
                value={new Date().toLocaleDateString('pt-BR')}
              />
            </div>
          </div>

          {/* Metric sliders */}
          <div className="space-y-5 border-t border-b border-white/5 py-6">
            {[
              {
                label: 'Capacidade Técnica',
                desc: 'Controle de bola, passe, chute, cabeceio, drible e passe de primeira.',
                val: notaTecnica,
                setVal: setNotaTecnica,
              },
              {
                label: 'Capacidade Tática',
                desc: 'Leitura de jogo, posicionamento defensivo/ofensivo, transição e cobertura.',
                val: notaTatica,
                setVal: setNotaTatica,
              },
              {
                label: 'Capacidade Física',
                desc: 'Velocidade, aceleração, força de explosão, resistência aeróbica e agilidade.',
                val: notaFisica,
                setVal: setNotaFisica,
              },
              {
                label: 'Aspecto Comportamental',
                desc: 'Disciplina, liderança, espírito de equipe, foco e resiliência pós-erro.',
                val: notaComportamental,
                setVal: setNotaComportamental,
              },
            ].map((metric, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-neutral-dark/45 rounded-xl border border-white/5">
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-white text-sm">{metric.label}</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed max-w-md">{metric.desc}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    className="w-40 h-1 bg-primary/30 rounded-lg appearance-none cursor-pointer accent-accent"
                    value={metric.val}
                    onChange={(e) => metric.setVal(parseFloat(e.target.value))}
                  />
                  <span className={`w-12 py-1 text-center font-bold text-xs rounded border ${getScoreColor(metric.val)}`}>
                    {metric.val.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Qualitative Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center">
              <FileText className="h-4 w-4 text-accent mr-1.5" />
              Observações Gerais (Qualitativo)
            </label>
            <textarea
              rows={4}
              className="w-full glass-input"
              placeholder="Digite pontos fortes, fraquezas identificadas, e plano de treino especial para o atleta..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Salvando...' : 'Salvar e Gerar Relatório'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
