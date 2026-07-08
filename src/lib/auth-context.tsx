'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  nome: string;
  cargo: 'treinador' | 'auxiliar' | 'atleta';
  foto_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  globalAuthError: string | null;
  clearGlobalAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [globalAuthError, setGlobalAuthError] = useState<string | null>(null);

  const clearGlobalAuthError = () => setGlobalAuthError(null);

  async function fetchProfile(currentUser: User) {
    try {
      const { data, error } = await supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
        // Persist email in profile for phone-lookup support
        if (currentUser.email && !data.email) {
          await supabase
            .from('perfis_usuarios')
            .update({ email: currentUser.email })
            .eq('id', currentUser.id);
        }
      } else {
        // Fallback for mock/local testing: derive role from email prefix
        const email = currentUser.email || '';
        const STRICT_ADMIN_EMAILS = [
          'admin_test@athle.com',
          'admin_test@legionarios.com',
          'admin@legionarios.com',
          'treinador@legionarios.com',
          'professor@wm.com'
        ];
        const isUserAdmin = STRICT_ADMIN_EMAILS.includes(email);
        const fallbackProfile: Profile = {
          id: currentUser.id,
          nome: email.split('@')[0],
          cargo: isUserAdmin ? 'treinador' : 'atleta',
          foto_url: isUserAdmin 
            ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
            : null
        };
        // Upsert into remote database so it exists for foreign key references (e.g. avaliacoes.treinador_id)
        try {
          await supabase.from('perfis_usuarios').upsert([{ ...fallbackProfile, email }]);
        } catch (dbErr) {
          console.warn('Could not upsert profile fallback to Supabase:', dbErr);
        }
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }

  async function isApproved(currentUser: User): Promise<boolean> {
    const email = currentUser.email || '';
    const STRICT_ADMIN_EMAILS = [
      'admin_test@athle.com',
      'admin_test@legionarios.com',
      'admin@legionarios.com',
      'treinador@legionarios.com',
      'professor@wm.com'
    ];
    const STRICT_TEST_STUDENTS = [
      'aluno_test@athle.com',
      'aluno_test@legionarios.com',
      'aluno@legionarios.com'
    ];
    const isFallbackAdmin = STRICT_ADMIN_EMAILS.includes(email) || STRICT_TEST_STUDENTS.includes(email);
    if (isFallbackAdmin) {
      return true;
    }

    try {
      // 1. Check if they have a solicitation and verify status
      const { data: request, error: reqError } = await supabase
        .from('solicitacoes_cadastro')
        .select('status')
        .eq('usuario_id', currentUser.id)
        .maybeSingle();

      if (!reqError && request) {
        return request.status === 'aprovado';
      }

      // 2. Check if they already have an active profile
      const { data: profile, error: profError } = await supabase
        .from('perfis_usuarios')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!profError && profile) {
        return true;
      }

      // Default to false for new users (their solicitation is being inserted)
      return false;
    } catch (e) {
      console.warn('Error checking approval:', e);
      return false;
    }
  }

  useEffect(() => {
    // Check active session on load
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const approved = await isApproved(session.user);
          if (!approved) {
            const { data: request } = await supabase
              .from('solicitacoes_cadastro')
              .select('status')
              .eq('usuario_id', session.user.id)
              .maybeSingle();

            if (request) {
              setGlobalAuthError(
                request.status === 'pendente' 
                  ? 'Aguardando aprovação do administrador' 
                  : 'Sua solicitação de cadastro foi recusada pelo administrador.'
              );
            } else {
              setGlobalAuthError('Aguardando aprovação do administrador');
            }
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          } else {
            setGlobalAuthError(null);
            setUser(session.user);
            await fetchProfile(session.user);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const approved = await isApproved(session.user);
        if (!approved) {
          const { data: request } = await supabase
            .from('solicitacoes_cadastro')
            .select('status')
            .eq('usuario_id', session.user.id)
            .maybeSingle();

          if (request) {
            setGlobalAuthError(
              request.status === 'pendente' 
                ? 'Aguardando aprovação do administrador' 
                : 'Sua solicitação de cadastro foi recusada pelo administrador.'
            );
          } else {
            setGlobalAuthError('Aguardando aprovação do administrador');
          }
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
        } else {
          setGlobalAuthError(null);
          setUser(session.user);
          await fetchProfile(session.user);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }
  }

  const isAdmin = profile ? (profile.cargo === 'treinador' || profile.cargo === 'auxiliar') : false;

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isLoading, signOut, globalAuthError, clearGlobalAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
