'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, Check, X, ShieldAlert, ArrowLeft, Loader2, 
  Phone, Calendar, Clipboard, MapPin, User, FileText, CheckCircle 
} from 'lucide-react';

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
  const [posicao, setPosicao] = useState('Meia');
  const [categoria, setCategoria] = useState('Sub-15');
  const [submitting, setSubmitting] = useState(false);

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
      // 1. Create the athlete record in `atletas`
      const { error: athleteError } = await supabase
        .from('atletas')
        .insert({
          nome: selectedReq.nome,
          data_nascimento: selectedReq.data_nascimento,
          categoria,
          posicao,
          status: 'ativo',
          telefone: selectedReq.telefone,
          endereco: selectedReq.endereco,
          usuario_id: selectedReq.usuario_id,
          cpf: selectedReq.cpf,
          rg: selectedReq.rg,
          nome_pai: selectedReq.nome_pai,
          nome_mae: selectedReq.nome_mae
        });

      if (athleteError) throw athleteError;

      // 2. Create/upsert the profile in `perfis_usuarios`
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

      // 3. Update the request status
      const { error: reqError } = await supabase
        .from('solicitacoes_cadastro')
        .update({
          status: 'aprovado',
          posicao,
          categoria
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

      // Also clean up Auth user if desired, but updating status is sufficient to block them.
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
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-3" />
        <span className="text-xs font-semibold">Buscando cadastros pendentes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <button onClick={() => router.push('/')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="h-3.5 w-3.5" />Voltar ao início
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Solicitações de Cadastro
          </h2>
          <p className="text-xs text-gray-400 mt-1">Valide e atribua categorias e posições para novos atletas.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold text-accent">
          {solicitacoes.length} pendentes
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs text-center">{error}</div>
      )}

      {/* Requests List */}
      {solicitacoes.length === 0 ? (
        <div className="glass-card py-12 text-center text-xs text-gray-500 space-y-2">
          <CheckCircle className="h-8 w-8 text-accent mx-auto" />
          <p>Tudo em dia! Nenhuma solicitação pendente no momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {solicitacoes.map((req) => (
            <div key={req.id} className="glass-card p-5 border-l-4 border-l-accent space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{req.nome}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{req.email}</p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 bg-neutral-dark border border-white/5 rounded-full text-gray-500 font-semibold">
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <hr className="border-white/5" />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Calendar className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    <span>Nasc: {new Date(req.data_nascimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Phone className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    <span>Tel: {req.telefone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Clipboard className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    <span>CPF: {req.cpf}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Clipboard className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    <span>RG: {req.rg}</span>
                  </div>
                  {req.nome_mae && (
                    <div className="col-span-2 flex items-center gap-1.5 text-gray-300">
                      <User className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <span className="truncate">Mãe: {req.nome_mae}</span>
                    </div>
                  )}
                  {req.nome_pai && (
                    <div className="col-span-2 flex items-center gap-1.5 text-gray-300">
                      <User className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                      <span className="truncate">Pai: {req.nome_pai}</span>
                    </div>
                  )}
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
                  onClick={() => { setSelectedReq(req); setPosicao('Meia'); setCategoria('Sub-15'); }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />Aprovar Atleta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APPROVAL MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 border-l-4 border-l-accent space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Configurar e Aprovar Atleta</h3>
              <p className="text-xs text-gray-400 mt-1">Defina a posição e a categoria de base para <strong className="text-white">{selectedReq.nome}</strong>.</p>
            </div>

            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Posição do Jogador</label>
                <select 
                  value={posicao} 
                  onChange={(e) => setPosicao(e.target.value)} 
                  className="w-full glass-input text-sm p-2 bg-neutral-dark text-white rounded-lg border border-white/10"
                >
                  <option value="Goleiro">Goleiro</option>
                  <option value="Zagueiro">Zagueiro</option>
                  <option value="Lateral Direito">Lateral Direito</option>
                  <option value="Lateral Esquerdo">Lateral Esquerdo</option>
                  <option value="Volante">Volante</option>
                  <option value="Meia">Meia</option>
                  <option value="Ponta Direita">Ponta Direita</option>
                  <option value="Ponta Esquerda">Ponta Esquerda</option>
                  <option value="Centroavante">Centroavante</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria de Base</label>
                <select 
                  value={categoria} 
                  onChange={(e) => setCategoria(e.target.value)} 
                  className="w-full glass-input text-sm p-2 bg-neutral-dark text-white rounded-lg border border-white/10"
                >
                  <option value="Sub-9">Sub-9</option>
                  <option value="Sub-11">Sub-11</option>
                  <option value="Sub-13">Sub-13</option>
                  <option value="Sub-15">Sub-15</option>
                  <option value="Sub-17">Sub-17</option>
                  <option value="Sub-20">Sub-20</option>
                  <option value="Profissional">Profissional</option>
                </select>
              </div>
            </div>

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
                className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-sm p-6 border-l-4 border-l-red-500 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Confirmar Rejeição
              </h3>
              <p className="text-xs text-gray-400 mt-2">Deseja realmente rejeitar a solicitação de <strong className="text-white">{rejectingReq.nome}</strong>? Ele não conseguirá acessar o sistema.</p>
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
