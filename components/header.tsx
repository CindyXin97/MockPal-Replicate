'use client';

import Link from 'next/link';
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
    <header className="w-full p-4 border-b">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          MockPal
        </Link>
        
        <nav>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm hover:underline">
                个人资料
              </Link>
              <Link href="/matches" className="text-sm hover:underline">
                匹配管理
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                退出登录
              </Button>
              <span className="text-sm font-medium">欢迎, {user.username}</span>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
} 