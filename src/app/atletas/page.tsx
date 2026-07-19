'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, UserPlus, Filter, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

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



export default function AthletesPage() {
  const { isAdmin } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [loading, setLoading] = useState(true);

  // Form states for creating athlete
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAthlete, setNewAthlete] = useState({
    nome: '',
    data_nascimento: '',
    categoria: 'Sub-15',
    posicao: 'Meia',
    peso: '',
    altura: '',
    telefone: '',
    endereco: '',
    telefone_responsavel: '',
    historico_medico: '',
    foto_url: '',
  });

  const categories = ['Todos', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Profissional'];
  const statuses = ['Todos', 'ativo', 'lesionado', 'inativo'];

  async function fetchAthletes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('atletas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      if (data) {
        setAthletes(data as Athlete[]);
      } else {
        setAthletes([]);
      }
    } catch (err) {
      console.warn('Erro ao buscar atletas do Supabase:', err);
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAthletes();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthlete.nome || !newAthlete.data_nascimento) return;

    const defaultFoto = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80';
    const athleteData = {
      nome: newAthlete.nome,
      data_nascimento: newAthlete.data_nascimento,
      categoria: newAthlete.categoria,
      posicao: newAthlete.posicao,
      peso: newAthlete.peso ? parseFloat(newAthlete.peso) : null,
      altura: newAthlete.altura ? parseFloat(newAthlete.altura) : null,
      status: 'ativo' as const,
      foto_url: newAthlete.foto_url.trim() || defaultFoto,
      telefone: newAthlete.telefone.trim() || null,
      endereco: newAthlete.endereco.trim() || null,
      telefone_responsavel: newAthlete.telefone_responsavel.trim() || null,
      historico_medico: newAthlete.historico_medico.trim() || null,
    };

    try {
      const { error } = await supabase
        .from('atletas')
        .insert([athleteData]);

      if (error) throw error;
      
      // Reset and reload
      setNewAthlete({
        nome: '',
        data_nascimento: '',
        categoria: 'Sub-15',
        posicao: 'Meia',
        peso: '',
        altura: '',
        telefone: '',
        endereco: '',
        telefone_responsavel: '',
        historico_medico: '',
        foto_url: '',
      });
      setShowAddForm(false);
      fetchAthletes();
    } catch (err) {
      console.error('Erro ao adicionar atleta no Supabase. Adicionando localmente:', err);
      
      // Fallback local addition
      const localNewAthlete: Athlete = {
        id: Math.random().toString(),
        ...athleteData,
      };
      setAthletes(prev => [...prev, localNewAthlete]);
      setShowAddForm(false);
    }
  };

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch = athlete.nome.toLowerCase().includes(search.toLowerCase()) || 
                          athlete.posicao.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || athlete.categoria === categoryFilter;
    const matchesStatus = statusFilter === 'Todos' || athlete.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Gestão de Elenco</h2>
          <p className="text-sm text-gray-400">Total de atletas registrados: {filteredAthletes.length}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-neutral-dark hover:bg-accent/90 transition-colors shadow-md"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Atleta
          </button>
        )}
      </div>

      {/* Add Athlete Modal/Form */}
      {isAdmin && showAddForm && (
        <div className="glass-card p-6 border-l-4 border-l-accent relative">
          <h3 className="text-lg font-bold text-white mb-4">Adicionar Novo Atleta</h3>
          <form onSubmit={handleAddAthlete} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                className="w-full glass-input"
                placeholder="Ex: Pedro Silva"
                value={newAthlete.nome}
                onChange={(e) => setNewAthlete({ ...newAthlete, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Data de Nascimento</label>
              <input
                type="date"
                required
                className="w-full glass-input"
                value={newAthlete.data_nascimento}
                onChange={(e) => setNewAthlete({ ...newAthlete, data_nascimento: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Categoria</label>
              <select
                className="w-full glass-input bg-neutral-dark/80"
                value={newAthlete.categoria}
                onChange={(e) => setNewAthlete({ ...newAthlete, categoria: e.target.value })}
              >
                {categories.filter(c => c !== 'Todos').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Posição</label>
              <select
                className="w-full glass-input bg-neutral-dark/80"
                value={newAthlete.posicao}
                onChange={(e) => setNewAthlete({ ...newAthlete, posicao: e.target.value })}
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
                placeholder="Ex: 60.5"
                value={newAthlete.peso}
                onChange={(e) => setNewAthlete({ ...newAthlete, peso: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Altura (m)</label>
              <input
                type="number"
                step="0.01"
                className="w-full glass-input"
                placeholder="Ex: 1.70"
                value={newAthlete.altura}
                onChange={(e) => setNewAthlete({ ...newAthlete, altura: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Telefone Celular</label>
              <input
                type="text"
                className="w-full glass-input"
                placeholder="Ex: (21) 99999-9999"
                value={newAthlete.telefone}
                onChange={(e) => setNewAthlete({ ...newAthlete, telefone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Telefone do Responsável</label>
              <input
                type="text"
                className="w-full glass-input"
                placeholder="Ex: (21) 98888-8888"
                value={newAthlete.telefone_responsavel}
                onChange={(e) => setNewAthlete({ ...newAthlete, telefone_responsavel: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Endereço Residencial</label>
              <input
                type="text"
                className="w-full glass-input"
                placeholder="Ex: Av. Atlântica, 100 - Copacabana"
                value={newAthlete.endereco}
                onChange={(e) => setNewAthlete({ ...newAthlete, endereco: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Link da Foto de Perfil (URL)</label>
              <input
                type="text"
                className="w-full glass-input"
                placeholder="Ex: https://images.unsplash.com/... (ou deixe em branco para foto padrão)"
                value={newAthlete.foto_url}
                onChange={(e) => setNewAthlete({ ...newAthlete, foto_url: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Histórico Médico / Alergias / Observações Clínicas</label>
              <textarea
                rows={2}
                className="w-full glass-input"
                placeholder="Ex: Alérgico a penicilina. Asma na infância controlada. Cartão vacinal em dia."
                value={newAthlete.historico_medico}
                onChange={(e) => setNewAthlete({ ...newAthlete, historico_medico: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-accent text-neutral-dark rounded-lg hover:bg-accent/90 transition-colors"
              >
                Salvar Atleta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 glass-input text-sm"
            placeholder="Buscar por nome ou posição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-accent/80" />
            <span className="text-xs text-gray-400 font-semibold">Filtros:</span>
          </div>

          {/* Category Selector */}
          <select
            className="glass-input text-xs py-1.5 bg-neutral-dark/80"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'Todos' ? 'Categorias (Todas)' : c}</option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            className="glass-input text-xs py-1.5 bg-neutral-dark/80"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'Todos' ? 'Status (Todos)' : s.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Athletes Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando elenco...</div>
      ) : filteredAthletes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum atleta encontrado com estes filtros.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAthletes.map((athlete) => (
            <Link
              key={athlete.id}
              href={`/atletas/${athlete.id}`}
              className="group glass-card overflow-hidden relative flex flex-col justify-between"
            >
              {/* Card top half */}
              <div>
                <div className="relative h-44 w-full bg-neutral-dark/50 overflow-hidden">
                  {athlete.status === 'lesionado' && (
                    <div className="absolute top-2 left-2 z-10 bg-red-500/95 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center shadow-md">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      DM
                    </div>
                  )}
                  <div className="absolute top-2 right-2 z-10 bg-primary/95 text-accent text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                    {athlete.categoria}
                  </div>
                  {athlete.foto_url ? (
                    <img
                      src={athlete.foto_url}
                      alt={athlete.nome}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary-dark/30 text-gray-500">
                      Sem Foto
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark via-transparent to-transparent opacity-90" />
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-white group-hover:text-accent transition-colors flex items-center justify-between">
                    {athlete.nome}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all text-accent" />
                  </h3>
                  <p className="text-xs font-semibold text-accent">{athlete.posicao}</p>
                </div>
              </div>

              {/* Card bottom details */}
              <div className="p-4 pt-0 border-t border-white/5 mt-2 flex justify-between items-center text-[10px] text-gray-400">
                <div>
                  <span className="font-semibold text-gray-300">Altura:</span>{' '}
                  {athlete.altura ? `${athlete.altura.toFixed(2)}m` : '-'}
                </div>
                <div>
                  <span className="font-semibold text-gray-300">Peso:</span>{' '}
                  {athlete.peso ? `${athlete.peso.toFixed(1)}kg` : '-'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
