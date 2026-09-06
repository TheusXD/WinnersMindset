'use client';

import React from 'react';
import Image from 'next/image';
import { LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import NotificationsMenu from './NotificationsMenu';

export default function Header({ onOpenTutorial }: { onOpenTutorial?: () => void }) {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full glass-card rounded-none border-t-0 border-x-0 border-b bg-neutral-dark/80 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Winner's Mindset Logo"
            width={44}
            height={44}
            className="rounded-lg"
            priority
          />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white leading-tight">
            WINNER&apos;S MINDSET
          </h1>
          <p className="text-[10px] text-gray-400">Gestão Esportiva</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            title="Ver o tutorial"
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        )}
        
        <NotificationsMenu />

        <div className="flex items-center space-x-2 border-l border-white/10 pl-4">
          {profile?.foto_url ? (
            <img
              src={profile.foto_url}
              alt={profile.nome}
              className="h-8 w-8 rounded-full border border-primary-light object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/30 text-accent flex items-center justify-center font-bold text-xs">
              {profile?.nome ? profile.nome.substring(0, 2).toUpperCase() : 'U'}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white">{profile?.nome || 'Usuário'}</p>
            <p className="text-[10px] text-accent capitalize">{profile?.cargo || 'Membro'}</p>
          </div>
          <button
            onClick={signOut}
            title="Sair do sistema"
            className="p-1.5 ml-1 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
