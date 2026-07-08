'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { Loader2 } from 'lucide-react';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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
      {!isAuthPage && <Header />}
      <main className={`flex-1 ${isAuthPage ? 'flex items-center justify-center' : 'pb-24 md:pb-28 px-4 pt-4 max-w-7xl mx-auto w-full'}`}>
        {children}
      </main>
      {!isAuthPage && <BottomNav />}
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
