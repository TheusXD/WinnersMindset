'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  User, Mail, Lock, Phone, Calendar, Clipboard, 
  MapPin, Users, ArrowLeft, ArrowRight, Loader2, CheckCircle 
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4; // Step 4 is success screen

export default function CadastroPage() {
  const router = useRouter();
  
  // Step control
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Personal info
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [telefone, setTelefone] = useState('');

  // Step 3: Family & Address
  const [nomePai, setNomePai] = useState('');
  const [nomeMae, setNomeMae] = useState('');
  const [endereco, setEndereco] = useState('');

  // Validations
  const validateStep1 = () => {
    if (!email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return false;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!nome.trim()) {
      setError('O nome é obrigatório.');
      return false;
    }
    if (!dataNascimento) {
      setError('A data de nascimento é obrigatória.');
      return false;
    }
    if (!cpf.trim()) {
      setError('O CPF é obrigatório.');
      return false;
    }
    if (!rg.trim()) {
      setError('O RG é obrigatório.');
      return false;
    }
    if (!telefone.trim()) {
      setError('O telefone é obrigatório.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handlePrevStep = () => {
    setError(null);
    if (step > 1) setStep((step - 1) as Step);
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!nomePai.trim() && !nomeMae.trim()) {
      setError('Por favor, preencha o nome de pelo menos um dos responsáveis (Pai ou Mãe).');
      return;
    }
    if (!endereco.trim()) {
      setError('O endereço é obrigatório.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erro ao criar conta de usuário. Tente novamente.');
      }

      // 2. Insert into solicitacoes_cadastro
      const { error: dbError } = await supabase
        .from('solicitacoes_cadastro')
        .insert({
          usuario_id: authData.user.id,
          email,
          nome,
          telefone,
          data_nascimento: dataNascimento,
          cpf,
          rg,
          nome_pai: nomePai || null,
          nome_mae: nomeMae || null,
          endereco,
          status: 'pendente'
        });

      if (dbError) throw dbError;

      // Redirect directly to login with parameter
      router.push('/login?cadastrado=true');
    } catch (err) {
      console.error('Registration error:', err);
      const msg = (err as Error).message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('Este e-mail já está cadastrado no sistema. Tente fazer login ou use outro e-mail.');
      } else {
        setError(msg || 'Ocorreu um erro ao enviar seu cadastro.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full glass-card p-8 border-t-4 border-t-accent shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        {/* Form header (only if not success page) */}
        {step < 4 && (
          <div className="text-center mb-8 relative z-10">
            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4">
              <Image src="/logo.png" alt="Winner's Mindset Logo" width={64} height={64} className="rounded-xl" priority />
            </div>
            <h2 className="text-2xl font-black text-white">Criar Conta de Atleta</h2>
            <p className="text-xs text-gray-400 mt-1">Preencha seus dados para solicitar acesso.</p>
            
            {/* Step indicators */}
            <div className="flex items-center justify-center mt-6 gap-2">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-accent' : 'w-2 bg-white/10'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-accent' : 'w-2 bg-white/10'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-accent' : 'w-2 bg-white/10'}`} />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs text-center mb-4 relative z-10">
            {error}
          </div>
        )}

        {/* STEP 1: CREDENTIALS */}
        {step === 1 && (
          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">E-mail</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Mail className="h-4 w-4" /></span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Ex: atleta@wm.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Lock className="h-4 w-4" /></span>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Confirmar Senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Lock className="h-4 w-4" /></span>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Repita a senha" />
              </div>
            </div>
            <div className="pt-4 flex justify-between gap-3">
              <button type="button" onClick={() => router.push('/login')} className="flex items-center gap-1 px-4 py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />Voltar ao login
              </button>
              <button type="button" onClick={handleNextStep} className="flex-1 flex justify-center items-center gap-1.5 py-3 px-4 rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 transition-colors">
                Próximo<ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL INFO */}
        {step === 2 && (
          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Nome Completo do Atleta</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><User className="h-4 w-4" /></span>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Nome completo" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Data de Nascimento</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Calendar className="h-4 w-4" /></span>
                <input type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="w-full pl-9 glass-input text-sm text-gray-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">CPF</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Clipboard className="h-4 w-4" /></span>
                  <input type="text" required value={cpf} onChange={(e) => setCpf(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="000.000.000-00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">RG</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Clipboard className="h-4 w-4" /></span>
                  <input type="text" required value={rg} onChange={(e) => setRg(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="RG" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Celular / Telefone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Phone className="h-4 w-4" /></span>
                <input type="tel" required value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Ex: (21) 99999-8888" />
              </div>
            </div>
            <div className="pt-4 flex justify-between gap-3">
              <button type="button" onClick={handlePrevStep} className="flex items-center gap-1 px-4 py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                Anterior
              </button>
              <button type="button" onClick={handleNextStep} className="flex-1 flex justify-center items-center gap-1.5 py-3 px-4 rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 transition-colors">
                Próximo<ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FAMILY & ADDRESS */}
        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Nome do Pai</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Users className="h-4 w-4" /></span>
                <input type="text" value={nomePai} onChange={(e) => setNomePai(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Nome do pai (opcional)" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Nome da Mãe</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Users className="h-4 w-4" /></span>
                <input type="text" value={nomeMae} onChange={(e) => setNomeMae(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Nome da mãe" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Endereço Completo</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><MapPin className="h-4 w-4" /></span>
                <input type="text" required value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Rua, número, bairro, cidade" />
              </div>
            </div>
            <div className="pt-4 flex justify-between gap-3">
              <button type="button" onClick={handlePrevStep} className="flex items-center gap-1 px-4 py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors" disabled={loading}>
                Anterior
              </button>
              <button type="submit" disabled={loading} className="flex-1 flex justify-center items-center gap-1.5 py-3 px-4 rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS VIEW */}
        {step === 4 && (
          <div className="relative z-10 text-center space-y-6 py-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-accent animate-bounce" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Solicitação Enviada!</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Seu cadastro de atleta foi recebido com sucesso.
                <br />
                <span className="text-accent font-semibold">Aguarde a validação do administrador</span> para conseguir realizar o login no sistema.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 transition-colors"
            >
              Ir para a tela de Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
