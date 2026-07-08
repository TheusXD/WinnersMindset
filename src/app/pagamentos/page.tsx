'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  CreditCard, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  Plus, 
  Save, 
  Calendar,
  DollarSign,
  UserCheck
} from 'lucide-react';

interface Athlete {
  id: string;
  nome: string;
  categoria: string;
}

interface Payment {
  id: string;
  atleta_id: string;
  tipo_plano: 'mensal' | 'anual';
  status: 'pago' | 'pendente' | 'atrasado';
  vencimento: string;
  valor: number | null;
  data_pagamento: string | null;
  atleta_nome?: string;
  atleta_categoria?: string;
}

const MOCK_ATHLETES: Athlete[] = [
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', nome: 'Lucas Silva', categoria: 'Sub-15' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', nome: 'Enzo Gabriel', categoria: 'Sub-15' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', nome: 'Gabriel Santos', categoria: 'Sub-15' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', nome: 'Matheus Oliveira', categoria: 'Sub-15' },
  { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', nome: 'Pedro Henrique', categoria: 'Sub-15' },
];

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', atleta_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', tipo_plano: 'mensal', status: 'pendente', vencimento: '2026-07-05', valor: 150.00, data_pagamento: null, atleta_nome: 'Lucas Silva', atleta_categoria: 'Sub-15' },
  { id: '2', atleta_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', tipo_plano: 'mensal', status: 'pago', vencimento: '2026-06-10', valor: 150.00, data_pagamento: '2026-06-08', atleta_nome: 'Enzo Gabriel', atleta_categoria: 'Sub-15' },
  { id: '3', atleta_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', tipo_plano: 'anual', status: 'pago', vencimento: '2026-12-15', valor: 1200.00, data_pagamento: '2025-12-14', atleta_nome: 'Gabriel Santos', atleta_categoria: 'Sub-15' },
  { id: '4', atleta_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', tipo_plano: 'mensal', status: 'atrasado', vencimento: '2026-06-05', valor: 150.00, data_pagamento: null, atleta_nome: 'Matheus Oliveira', atleta_categoria: 'Sub-15' },
  { id: '5', atleta_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', tipo_plano: 'mensal', status: 'pago', vencimento: '2026-06-20', valor: 150.00, data_pagamento: '2026-06-19', atleta_nome: 'Pedro Henrique', atleta_categoria: 'Sub-15' },
];

export default function PaymentsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modal / Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    atleta_id: '',
    tipo_plano: 'mensal' as 'mensal' | 'anual',
    status: 'pendente' as 'pago' | 'pendente' | 'atrasado',
    vencimento: '',
    valor: '150.00',
    data_pagamento: '',
  });

  async function fetchPaymentsAndAthletes() {
    try {
      setLoading(true);
      
      const { data: athletesData, error: athletesError } = await supabase
        .from('atletas')
        .select('id, nome, categoria')
        .order('nome', { ascending: true });

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('pagamentos')
        .select(`
          id,
          atleta_id,
          tipo_plano,
          status,
          vencimento,
          valor,
          data_pagamento,
          atletas (
            nome,
            categoria
          )
        `)
        .order('vencimento', { ascending: false });

      if (athletesError || paymentsError) throw athletesError || paymentsError;

      if (athletesData) {
        setAthletes(athletesData as Athlete[]);
      } else {
        setAthletes([]);
      }

      if (paymentsData && paymentsData.length > 0) {
        const formatted = (paymentsData as unknown as {
          id: string;
          atleta_id: string;
          tipo_plano: 'mensal' | 'anual';
          status: 'pago' | 'pendente' | 'atrasado';
          vencimento: string;
          valor: number | null;
          data_pagamento: string | null;
          atletas: { nome: string; categoria: string; } | null;
        }[]).map((p) => ({
          id: p.id,
          atleta_id: p.atleta_id,
          tipo_plano: p.tipo_plano,
          status: p.status,
          vencimento: p.vencimento,
          valor: p.valor,
          data_pagamento: p.data_pagamento,
          atleta_nome: p.atletas?.nome || 'Atleta Desconhecido',
          atleta_categoria: p.atletas?.categoria || 'N/A',
        }));
        setPayments(formatted);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.warn('Erro ao buscar dados de pagamentos no Supabase:', err);
      setPayments([]);
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => {
        fetchPaymentsAndAthletes();
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
          Apenas treinadores e gestores autorizados podem gerenciar a seção de pagamentos dos atletas.
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

  const handleOpenAdd = () => {
    setFormData({
      atleta_id: athletes[0]?.id || '',
      tipo_plano: 'mensal',
      status: 'pendente',
      vencimento: new Date().toISOString().split('T')[0],
      valor: '150.00',
      data_pagamento: '',
    });
    setEditingPayment(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      atleta_id: payment.atleta_id,
      tipo_plano: payment.tipo_plano,
      status: payment.status,
      vencimento: payment.vencimento,
      valor: payment.valor ? payment.valor.toString() : '0.00',
      data_pagamento: payment.data_pagamento || '',
    });
    setShowAddModal(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.atleta_id || !formData.vencimento) return;

    setSubmitting(true);
    const selectedAthlete = athletes.find(a => a.id === formData.atleta_id);

    const paymentData = {
      atleta_id: formData.atleta_id,
      tipo_plano: formData.tipo_plano,
      status: formData.status,
      vencimento: formData.vencimento,
      valor: formData.valor ? parseFloat(formData.valor) : null,
      data_pagamento: formData.status === 'pago' ? (formData.data_pagamento || new Date().toISOString().split('T')[0]) : null,
    };

    try {
      if (editingPayment) {
        // Edit existing
        const { error } = await supabase
          .from('pagamentos')
          .update(paymentData)
          .eq('id', editingPayment.id);
        
        if (error) throw error;
      } else {
        // Add new
        const { error } = await supabase
          .from('pagamentos')
          .insert([paymentData]);

        if (error) throw error;
      }

      setShowAddModal(false);
      fetchPaymentsAndAthletes();
    } catch (err) {
      console.error('Erro ao salvar pagamento no Supabase. Atualizando localmente:', err);
      
      // Local fallback
      if (editingPayment) {
        setPayments(prev =>
          prev.map(p =>
            p.id === editingPayment.id
              ? { 
                  ...p, 
                  ...paymentData, 
                  atleta_nome: selectedAthlete?.nome || p.atleta_nome,
                  atleta_categoria: selectedAthlete?.categoria || p.atleta_categoria
                }
              : p
          )
        );
      } else {
        const newRecord: Payment = {
          id: Math.random().toString(),
          ...paymentData,
          atleta_nome: selectedAthlete?.nome || 'Atleta',
          atleta_categoria: selectedAthlete?.categoria || 'N/A',
        };
        setPayments(prev => [newRecord, ...prev]);
      }
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Deseja realmente remover este registro de pagamento?')) return;
    try {
      const { error } = await supabase.from('pagamentos').delete().eq('id', id);
      if (error) throw error;
      fetchPaymentsAndAthletes();
    } catch {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'pago':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/25">
            <CheckCircle className="h-3 w-3 mr-1" />
            PAGO
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
            <Clock className="h-3 w-3 mr-1" />
            PENDENTE
          </span>
        );
      case 'atrasado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
            <AlertCircle className="h-3 w-3 mr-1" />
            ATRASADO
          </span>
        );
    }
  };

  // Metrics calculations
  const totalReceived = payments.filter(p => p.status === 'pago').reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pendente').length;
  const overdueCount = payments.filter(p => p.status === 'atrasado').length;

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.atleta_nome?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <CreditCard className="h-6 w-6 text-accent mr-2" />
            Gerenciamento de Pagamentos
          </h2>
          <p className="text-sm text-gray-400">Controle mensalidades e planos anuais do elenco.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Plano / Parcela
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-accent flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold block">Total Recebido</span>
            <span className="text-2xl font-bold text-white mt-1 block">
              R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-accent/15 border border-accent/20 rounded-xl text-accent">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-yellow-500 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold block">Aguardando Pagamento</span>
            <span className="text-2xl font-bold text-yellow-400 mt-1 block">{pendingCount} parcelas</span>
          </div>
          <div className="p-3 bg-yellow-500/15 border border-yellow-500/20 rounded-xl text-yellow-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold block">Mensalidades em Atraso</span>
            <span className="text-2xl font-bold text-red-400 mt-1 block">{overdueCount} atrasos</span>
          </div>
          <div className="p-3 bg-red-500/15 border border-red-500/20 rounded-xl text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 glass-input text-sm"
            placeholder="Buscar atleta por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-accent" />
            <span className="text-xs text-gray-400 font-semibold">Status:</span>
          </div>
          <select
            className="glass-input text-xs py-1.5 bg-neutral-dark"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {['Todos', 'pago', 'pendente', 'atrasado'].map((s) => (
              <option key={s} value={s}>{s === 'Todos' ? 'Todos os Status' : s.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span>Carregando dados financeiros...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-400">
          Nenhum registro de pagamento encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/10 border-b border-white/5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="p-4">Atleta / Categoria</th>
                  <th className="p-4">Plano</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Pagamento</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{p.atleta_nome}</div>
                      <div className="text-[10px] text-accent mt-0.5 font-semibold">{p.atleta_categoria}</div>
                    </td>
                    <td className="p-4 capitalize">{p.tipo_plano}</td>
                    <td className="p-4 font-semibold text-white">
                      R$ {p.valor ? p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-4">
                      <span className="flex items-center font-mono">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {new Date(p.vencimento + 'T00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-4">
                      {p.data_pagamento ? (
                        <span className="flex items-center font-mono text-accent">
                          <UserCheck className="h-3.5 w-3.5 mr-1.5 text-accent/70" />
                          {new Date(p.data_pagamento + 'T00:00').toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-gray-500 font-mono">-</span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(p.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-accent hover:text-accent transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-red-500 hover:text-red-400 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 border-l-4 border-l-accent relative">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingPayment ? 'Editar Lançamento' : 'Registrar Novo Lançamento'}
            </h3>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Selecione o Atleta</label>
                <select
                  disabled={!!editingPayment}
                  className="w-full glass-input bg-neutral-dark/95 text-sm disabled:opacity-75"
                  value={formData.atleta_id}
                  onChange={(e) => setFormData({ ...formData, atleta_id: e.target.value })}
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome} ({a.categoria})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Tipo de Plano</label>
                  <select
                    className="w-full glass-input bg-neutral-dark/95 text-sm"
                    value={formData.tipo_plano}
                    onChange={(e) => setFormData({ ...formData, tipo_plano: e.target.value as 'mensal' | 'anual' })}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full glass-input text-sm"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Vencimento</label>
                  <input
                    type="date"
                    required
                    className="w-full glass-input text-sm"
                    value={formData.vencimento}
                    onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Status</label>
                  <select
                    className="w-full glass-input bg-neutral-dark/95 text-sm"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pago' | 'pendente' | 'atrasado' })}
                  >
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>
              </div>

              {formData.status === 'pago' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Data do Pagamento</label>
                  <input
                    type="date"
                    className="w-full glass-input text-sm"
                    value={formData.data_pagamento}
                    onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center"
                >
                  {submitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
