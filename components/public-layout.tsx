'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/header';

export function PublicLayout({ 
  children,
  redirectIfAuthenticated = true
}: { 
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (redirectIfAuthenticated && status === 'authenticated' && session) {
      router.push('/matches');
    }
  }, [status, session, router, redirectIfAuthenticated]);

  if (redirectIfAuthenticated && status === 'authenticated' && session) {
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