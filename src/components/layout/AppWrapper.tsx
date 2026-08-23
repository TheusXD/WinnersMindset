'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import TutorialModal from '@/components/TutorialModal';
import { Loader2 } from 'lucide-react';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = ['/login', '/cadastro', '/reset-password'].includes(pathname);
      if (!user && !isAuthRoute) {
        router.push('/login');
      } else if (user && isAuthRoute) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Show the "how to use it" tutorial once per account, right after login —
  // gated on `profile` too so it doesn't flash the wrong role's steps while
  // isAdmin is still resolving.
  useEffect(() => {
    if (!isLoading && user && profile) {
      try {
        if (!localStorage.getItem(`tutorial_seen_${user.id}`)) {
          setShowTutorial(true);
        }
      } catch {
        // localStorage unavailable (e.g. private mode) — just skip auto-show.
      }
    }
  }, [isLoading, user, profile]);

  const handleCloseTutorial = () => {
    if (user) {
      try {
        localStorage.setItem(`tutorial_seen_${user.id}`, '1');
      } catch {
        // ignore
      }
    }
    setShowTutorial(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-dark text-gray-400">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-xs font-semibold tracking-wider uppercase">Carregando sistema...</span>
        </div>
      </div>
    );
  }

  const isAuthPage = ['/login', '/cadastro', '/reset-password'].includes(pathname);

  return (
    <div className="min-h-full flex flex-col bg-neutral-dark text-foreground">
      {!isAuthPage && <Header onOpenTutorial={() => setShowTutorial(true)} />}
      <main className={`flex-1 ${isAuthPage ? 'flex items-center justify-center' : 'pb-24 md:pb-28 px-4 pt-4 max-w-7xl mx-auto w-full'}`}>
        {children}
      </main>
      {!isAuthPage && <BottomNav />}
      {!isAuthPage && showTutorial && <TutorialModal onClose={handleCloseTutorial} />}
    </div>
  );
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
