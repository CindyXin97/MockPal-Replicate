'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { isAuthenticatedAtom, userAtom } from '@/lib/store';
import { Header } from '@/components/header';

export function PublicLayout({ 
  children,
  redirectIfAuthenticated = true
}: { 
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
}) {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [user] = useAtom(userAtom);
  const router = useRouter();

  useEffect(() => {
    if (redirectIfAuthenticated && isAuthenticated && user) {
      router.push('/matches');
    }
  }, [isAuthenticated, user, router, redirectIfAuthenticated]);

  if (redirectIfAuthenticated && isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
} 