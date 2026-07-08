'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Mail, Phone, Lock, Loader2, Award, Users, ArrowLeft, CheckCircle, KeyRound, AtSign } from 'lucide-react';

type View = 'login' | 'forgot' | 'forgot-success';

// Detect if input looks like a phone number
function isPhoneInput(value: string): boolean {
  const cleaned = value.replace(/[\s\-().+]/g, '');
  return /^\d{8,15}$/.test(cleaned);
}

// Normalize phone to digits only for DB lookup
function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { globalAuthError, clearGlobalAuthError } = useAuth();

  const cadastrado = searchParams?.get('cadastrado') === 'true';

  // Single credential field (email or phone)
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    if (globalAuthError) {
      setError(globalAuthError);
      clearGlobalAuthError();
    }
  }, [globalAuthError, clearGlobalAuthError]);

  // Detect input type live
  const inputIsPhone = isPhoneInput(credential);
  const InputIcon = credential === '' ? AtSign : inputIsPhone ? Phone : Mail;

  async function resolveEmail(raw: string): Promise<string> {
    if (!isPhoneInput(raw)) return raw.trim();

    // Lookup by phone in perfis_usuarios
    const digits = normalizePhone(raw);
    // Try both formatted and digits versions
    const { data, error } = await supabase
      .from('perfis_usuarios')
      .select('email')
      .or(`telefone.eq.${raw.trim()},telefone.eq.${digits},telefone.ilike.%${digits}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data?.email) {
      throw new Error('Nenhuma conta encontrada com este telefone. Verifique o número ou use o e-mail.');
    }
    return data.email;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const emailToUse = await resolveEmail(credential);

      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (loginError) throw loginError;

      if (authData.user) {
        const userEmail = authData.user.email;
        if (userEmail) {
          await supabase
            .from('perfis_usuarios')
            .update({ email: userEmail })
            .eq('id', authData.user.id);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Signout was triggered in AuthProvider because they are not approved.
        return;
      }

      router.push('/');
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail/telefone ou senha incorretos. Verifique e tente novamente.');
      } else {
        setError(msg || 'Erro ao realizar login.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setView('forgot-success');
    } catch (err) {
      setForgotError((err as Error).message || 'Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  }

  const autofillTestAccount = (role: 'admin' | 'aluno') => {
    if (role === 'admin') { setCredential('admin_test@athle.com'); setPassword('admin123'); }
    else { setCredential('aluno_test@athle.com'); setPassword('aluno123'); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-card p-8 border-t-4 border-t-accent shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        {/* ───── LOGIN ───── */}
        {view === 'login' && (
          <div className="space-y-6">
            {/* Logo */}
            <div className="text-center relative z-10">
              <div className="mx-auto w-20 h-20 flex items-center justify-center">
                <Image src="/logo.png" alt="Winner's Mindset Logo" width={80} height={80} className="rounded-2xl" priority />
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">WINNER&apos;S MINDSET</h2>
              <p className="mt-1 text-sm text-gray-400">Gestão Esportiva</p>
            </div>

            <form className="space-y-5 relative z-10" onSubmit={handleLogin}>
              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs text-center">{error}</div>
              )}

              {cadastrado && !error && (
                <div className="p-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs text-center font-semibold">
                  Solicitação de cadastro recebida! Aguarde a aprovação do administrador para fazer login.
                </div>
              )}

              <div className="space-y-4">
                {/* E-mail ou Telefone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    E-mail ou Telefone
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200"
                      style={{ color: inputIsPhone && credential !== '' ? '#60a5fa' : '#9ca3af' }}>
                      <InputIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      className="w-full pl-9 glass-input text-sm"
                      placeholder="Ex: professor@wm.com ou (21) 99999-8888"
                      autoComplete="username"
                      inputMode="email"
                    />
                    {/* Live badge */}
                    {credential !== '' && (
                      <span className={`absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold uppercase tracking-wider ${inputIsPhone ? 'text-blue-400' : 'text-accent'}`}>
                        {inputIsPhone ? 'Tel' : 'E-mail'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-600">
                    Digite seu e-mail ou número de telefone cadastrado.
                  </p>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 glass-input text-sm"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </div>

              {/* Esqueci senha */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setForgotEmail(credential.includes('@') ? credential : ''); setForgotError(null); }}
                  className="text-xs text-accent hover:text-accent/80 transition-colors font-semibold"
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar no Sistema'}
                </button>

                <div className="text-center text-xs text-gray-400">
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/cadastro')}
                    className="text-accent hover:underline font-semibold"
                  >
                    Criar conta de atleta
                  </button>
                </div>
              </div>
            </form>


          </div>
        )}

        {/* ───── FORGOT PASSWORD ───── */}
        {view === 'forgot' && (
          <div className="relative z-10 space-y-6">
            <button onClick={() => setView('login')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />Voltar ao login
            </button>
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <KeyRound className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mt-4 text-2xl font-black text-white">Recuperar Senha</h3>
              <p className="mt-2 text-sm text-gray-400">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs text-center">{forgotError}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">E-mail cadastrado</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none"><Mail className="h-4 w-4" /></span>
                  <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full pl-9 glass-input text-sm" placeholder="Ex: professor@wm.com" />
                </div>
              </div>
              <button type="submit" disabled={forgotLoading} className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 transition-colors disabled:opacity-50">
                {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar link de recuperação'}
              </button>
            </form>
          </div>
        )}

        {/* ───── FORGOT SUCCESS ───── */}
        {view === 'forgot-success' && (
          <div className="relative z-10 text-center space-y-6 py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">E-mail enviado!</h3>
              <p className="mt-2 text-sm text-gray-400">
                Enviamos um link de recuperação para <span className="text-white font-semibold">{forgotEmail}</span>.<br />
                Verifique sua caixa de entrada (e o spam).
              </p>
            </div>
            <button onClick={() => setView('login')} className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors font-semibold mx-auto">
              <ArrowLeft className="h-3.5 w-3.5" />Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
