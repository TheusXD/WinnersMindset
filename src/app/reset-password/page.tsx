'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Loader2, CheckCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';

type PageState = 'loading' | 'form' | 'success' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase redirects with tokens in the URL hash/query
    // The onAuthStateChange will fire with event PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('form');
      } else if (event === 'SIGNED_IN') {
        // Already handled
      }
    });

    // Fallback: check for hash tokens
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (accessToken && type === 'recovery') {
      setPageState('form');
    } else {
      // Give time for onAuthStateChange to fire
      setTimeout(() => {
        setPageState((prev) => prev === 'loading' ? 'invalid' : prev);
      }, 2000);
    }

    return () => subscription.unsubscribe();
  }, []);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPageState('success');
    } catch (err) {
      setError((err as Error).message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6) return { label: 'Fraca', color: 'bg-red-500', width: 'w-1/4' };
    if (pwd.length < 8) return { label: 'Média', color: 'bg-yellow-500', width: 'w-2/4' };
    if (pwd.length < 12) return { label: 'Boa', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Forte', color: 'bg-accent', width: 'w-full' };
  };
  const strength = passwordStrength(password);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-card p-8 border-t-4 border-t-accent shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        {/* LOADING */}
        {pageState === 'loading' && (
          <div className="relative z-10 text-center space-y-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
            <p className="text-sm text-gray-400">Validando link de recuperação...</p>
          </div>
        )}

        {/* INVALID LINK */}
        {pageState === 'invalid' && (
          <div className="relative z-10 text-center space-y-6 py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Link inválido</h3>
              <p className="mt-2 text-sm text-gray-400">
                Este link de recuperação expirou ou é inválido.<br />
                Solicite um novo link na tela de login.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 transition-colors"
            >
              Voltar ao login
            </button>
          </div>
        )}

        {/* RESET FORM */}
        {pageState === 'form' && (
          <div className="relative z-10 space-y-6">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 flex items-center justify-center">
                <Image src="/logo.png" alt="Winner's Mindset Logo" width={80} height={80} className="rounded-2xl" priority />
              </div>
              <h2 className="mt-4 text-2xl font-black text-white">Nova Senha</h2>
              <p className="mt-1 text-sm text-gray-400">Defina sua nova senha de acesso.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs text-center">{error}</div>
              )}

              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nova Senha</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 glass-input text-sm"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className="text-[10px] text-gray-500">Força: <span className="font-semibold text-gray-300">{strength.label}</span></p>
                  </div>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-9 pr-9 glass-input text-sm ${confirmPassword && confirmPassword !== password ? 'border-red-500/50' : ''}`}
                    placeholder="Repita a senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1 text-[10px] text-red-400">As senhas não coincidem.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Redefinir Senha'}
              </button>
            </form>
          </div>
        )}

        {/* SUCCESS */}
        {pageState === 'success' && (
          <div className="relative z-10 text-center space-y-6 py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Senha redefinida!</h3>
              <p className="mt-2 text-sm text-gray-400">
                Sua senha foi atualizada com sucesso.<br />
                Você já pode entrar no sistema.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-neutral-dark bg-accent hover:bg-accent/90 transition-colors"
            >
              Ir para o Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
