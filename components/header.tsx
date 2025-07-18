'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { isAuthenticatedAtom, userAtom } from '@/lib/store';

export function Header() {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [user] = useAtom(userAtom);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // Force reload to reset the app state
    window.location.href = '/';
  };

  return (
    <header className="w-full px-4 py-3 bg-white border-b shadow-sm fixed top-0 left-0 z-30">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 h-12 group">
          <div className="h-12 w-12 overflow-hidden flex items-center justify-center rounded-lg bg-primary shadow-sm group-hover:shadow-md transition-shadow">
            <Image
              src="/logo-icon.png"
              alt="MockPal Logo"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold">
            MockPal
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                欢迎，<span className="font-medium">{user.username}</span>
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-sm"
              >
                退出
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" className="text-sm">
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild className="text-sm">
                <Link href="/register">注册</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 