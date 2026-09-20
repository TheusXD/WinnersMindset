'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, Check, X, ShieldAlert, ArrowLeft, Loader2, 
  Phone, Calendar, Clipboard, MapPin, User, FileText, CheckCircle,
  Scale, Activity, Sparkles, AlertCircle
} from 'lucide-react';
import { 
  calculateIMC, 
  getIMCCategory, 
  getNivelAtividadeInfo, 
  getWorkoutRecommendation 
} from '@/lib/imc';

interface Solicitacao {
  id: string;
  usuario_id: string;
  email: string;
  nome: string;
  telefone: string;
  data_nascimento: string;
  cpf: string;
  rg: string;
  nome_pai: string | null;
  nome_mae: string | null;
  endereco: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  peso?: number | null;
  altura?: number | null;
  nivel_atividade?: number | null;
  created_at: string;
}

export default function AdminSolicitacoesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval modal states
  const [selectedReq, setSelectedReq] = useState<Solicitacao | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Default seed values for required fields
  const DEFAULT_POSICAO = 'Meia';
  const DEFAULT_CATEGORIA = 'Sub-15';

  // Reject confirmation
  const [rejectingReq, setRejectingReq] = useState<Solicitacao | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  const fetchSolicitacoes = async () => {
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('solicitacoes_cadastro')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setSolicitacoes(data || []);
    } catch (err) {
      setError('Erro ao carregar solicitações.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSolicitacoes();
    }
  }, [isAdmin]);

  const handleApprove = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create/upsert the profile in `perfis_usuarios`
      const { error: profileError } = await supabase
        .from('perfis_usuarios')
        .upsert({
          id: selectedReq.usuario_id,
          nome: selectedReq.nome,
          cargo: 'atleta',
          telefone: selectedReq.telefone,
          email: selectedReq.email
        });

      if (profileError) throw profileError;

      // 2. Create the athlete record in `atletas`
      const { data: existingAthlete } = await supabase
        .from('atletas')
        .select('id')
        .eq('usuario_id', selectedReq.usuario_id)
        .maybeSingle();

      let athleteId = existingAthlete?.id;

      if (!existingAthlete) {
        const todayIso = new Date().toISOString().split('T')[0];
        const { data: createdAthlete, error: athleteError } = await supabase
          .from('atletas')
          .insert({
            nome: selectedReq.nome,
            data_nascimento: selectedReq.data_nascimento,
            categoria: DEFAULT_CATEGORIA,
            posicao: DEFAULT_POSICAO,
            status: 'ativo',
            telefone: selectedReq.telefone,
            endereco: selectedReq.endereco,
            usuario_id: selectedReq.usuario_id,
            cpf: selectedReq.cpf,
            rg: selectedReq.rg,
            nome_pai: selectedReq.nome_pai,
            nome_mae: selectedReq.nome_mae,
            peso: selectedReq.peso || null,
            altura: selectedReq.altura || null,
            nivel_atividade: selectedReq.nivel_atividade || 1,
            data_ultima_pesagem: todayIso,
          })
          .select('id')
          .single();

        if (athleteError) throw athleteError;
        athleteId = createdAthlete?.id;

        // 2.1 Salvar medição inicial no historico_corporal
        if (athleteId && selectedReq.peso && selectedReq.altura) {
          const imc = calculateIMC(selectedReq.peso, selectedReq.altura);
          await supabase
            .from('historico_corporal')
            .insert({
              atleta_id: athleteId,
              peso: selectedReq.peso,
              altura: selectedReq.altura,
              imc: imc || 0,
              nivel_atividade: selectedReq.nivel_atividade || 1,
              data_medicao: todayIso,
              observacoes: 'Medição inicial captada no cadastro do atleta',
            });
        }
      }

      // 3. Update request status
      const { error: reqError } = await supabase
        .from('solicitacoes_cadastro')
        .update({
          status: 'aprovado',
          posicao: DEFAULT_POSICAO,
          categoria: DEFAULT_CATEGORIA
        })
        .eq('id', selectedReq.id);

      if (reqError) throw reqError;

      // Clean state & reload
      setSelectedReq(null);
      await fetchSolicitacoes();
    } catch (err) {
      console.error('Approval error:', err);
      setError('Erro ao processar aprovação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingReq) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: reqError } = await supabase
        .from('solicitacoes_cadastro')
        .update({ status: 'rejeitado' })
        .eq('id', rejectingReq.id);

      if (reqError) throw reqError;

      setRejectingReq(null);
      await fetchSolicitacoes();
    } catch (err) {
      console.error('Rejection error:', err);
      setError('Erro ao processar rejeição.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-2" />
        Carregando solicitações de atletas...
      </div>
    );
  }

  // Selected request metrics
  const selectedIMC = selectedReq ? calculateIMC(selectedReq.peso, selectedReq.altura) : null;
  const selectedIMCCat = getIMCCategory(selectedIMC);
  const selectedNivelInfo = selectedReq ? getNivelAtividadeInfo(selectedReq.nivel_atividade) : null;
  const selectedWorkoutRec = selectedReq ? getWorkoutRecommendation(selectedIMC, selectedReq.nivel_atividade) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar ao Painel
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            Solicitações de Cadastro de Atletas
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Valide novos atletas, confira o IMC, nível de condicionamento físico e aprove o acesso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-accent/15 border border-accent/30 text-accent font-bold text-xs rounded-full">
            {solicitacoes.length} pendente{solicitacoes.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {solicitacoes.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-md mx-auto space-y-3">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto opacity-80" />
          <h3 className="text-lg font-bold text-white">Nenhuma solicitação pendente</h3>
          <p className="text-xs text-gray-400">
            Todos os cadastros foram analisados. Novos pedidos de acesso aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {solicitacoes.map((req) => {
            const imc = calculateIMC(req.peso, req.altura);
            const imcInfo = getIMCCategory(imc);
            const nivel = getNivelAtividadeInfo(req.nivel_atividade);

            return (
              <div key={req.id} className="glass-card p-5 space-y-4 flex flex-col justify-between border-l-4 border-l-accent hover:border-l-accent/80 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <User className="h-4 w-4 text-accent" />
                        {req.nome}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{req.email}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded">
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Physical metrics summary badge */}
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-accent" />
                      <span className="text-gray-300 font-semibold">
                        {req.peso ? `${req.peso} kg` : 'Sem peso'} | {req.altura ? `${req.altura} m` : 'Sem altura'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {imc && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${imcInfo.borderColor} ${imcInfo.color} ${imcInfo.bgColor}`}>
                          IMC: {imc} ({imcInfo.label})
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${nivel.badgeColor}`}>
                        {nivel.sublabel}: {nivel.label}
                      </span>
                    </div>
                  </div>

                  {/* Personal details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Calendar className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <span>{req.data_nascimento ? new Date(req.data_nascimento + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Phone className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{req.telefone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Clipboard className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <span>CPF: {req.cpf || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Clipboard className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <span>RG: {req.rg || '-'}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-gray-300">
                      <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <span className="truncate">End: {req.endereco}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end gap-2 border-t border-white/5">
                  <button
                    onClick={() => setRejectingReq(req)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />Rejeitar
                  </button>
                  <button
                    onClick={() => setSelectedReq(req)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />Analisar e Aprovar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVAL & DIAGNOSTIC MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card w-full max-w-xl p-6 border-l-4 border-l-accent space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Aprovação & Diagnóstico de Treino
                </h3>
                <span className="text-xs text-gray-400">Atleta: {selectedReq.nome}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Revise os dados físicos e a recomendação técnica antes de liberar o acesso.
              </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Peso</span>
                <span className="text-sm font-black text-white">{selectedReq.peso ? `${selectedReq.peso} kg` : 'Não informado'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Altura</span>
                <span className="text-sm font-black text-white">{selectedReq.altura ? `${selectedReq.altura} m` : 'Não informada'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-bold">IMC Estimado</span>
                <span className={`text-sm font-black ${selectedIMCCat.color}`}>
                  {selectedIMC ? `${selectedIMC}` : '-'}
                </span>
                <span className="block text-[10px] text-gray-300">({selectedIMCCat.label})</span>
              </div>
            </div>

            {/* Conditioning level badge */}
            <div className="p-3 rounded-xl bg-neutral-light/30 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block">Nível de Atividade Informado:</span>
                <span className="text-xs font-bold text-white">{selectedNivelInfo?.sublabel} - {selectedNivelInfo?.label}</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${selectedNivelInfo?.badgeColor}`}>
                {selectedNivelInfo?.label}
              </span>
            </div>

            {/* Coach Training Recommendation Box */}
            {selectedWorkoutRec && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-2.5">
                <div className="flex items-center gap-2 text-accent font-bold text-xs">
                  <Activity className="h-4 w-4" />
                  Sugestão de Treino Inicial para o Professor: {selectedWorkoutRec.titulo}
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed font-semibold">
                  Foco: {selectedWorkoutRec.focoPrincipal}
                </p>
                <div className="space-y-1 pt-1 border-t border-accent/15">
                  <span className="text-[10px] font-bold text-accent block uppercase">Diretrizes recomendadas:</span>
                  <ul className="text-[11px] text-gray-300 space-y-1 list-disc list-inside">
                    {selectedWorkoutRec.diretrizes.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
              <button 
                type="button" 
                onClick={() => setSelectedReq(null)} 
                className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleApprove}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-accent text-neutral-dark rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-md shadow-accent/10"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingReq && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card w-full max-w-sm p-6 border-l-4 border-l-red-500 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Confirmar Rejeição
              </h3>
              <p className="text-xs text-gray-400 mt-2">
                Deseja realmente rejeitar a solicitação de <strong className="text-white">{rejectingReq.nome}</strong>? Ele não conseguirá acessar o sistema.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
              <button 
                type="button" 
                onClick={() => setRejectingReq(null)} 
                className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleReject}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                Rejeitar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
