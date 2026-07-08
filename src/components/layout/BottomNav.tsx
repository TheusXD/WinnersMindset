'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Target, ClipboardList, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems = [
    { label: 'Início', href: '/', icon: Home },
    { label: 'Atletas', href: '/atletas', icon: Users },
    { label: 'Jogos', href: '/jogos', icon: Target },
    ...(isAdmin ? [
      { label: 'Avaliar', href: '/avaliar', icon: ClipboardList },
      { label: 'Pagamentos', href: '/pagamentos', icon: CreditCard }
    ] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full glass-card rounded-none border-b-0 border-x-0 border-t bg-neutral-dark/90 px-2 py-2 md:py-3 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-accent scale-105 font-semibold bg-primary/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="h-5 w-5 md:h-6 md:w-6 transition-transform duration-200" />
            <span className="text-[10px] mt-1 tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
