'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { isAuthenticatedAtom, userAtom } from '@/lib/store';

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [user, setUser] = useAtom(userAtom);

  const handleLogout = () => {
    // Reset Jotai state
    setIsAuthenticated(false);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // Force reload to reset the app state
    window.location.href = '/';
  };

  return (
    <header className="w-full px-4 py-2 bg-white/80 backdrop-blur border-b shadow-sm fixed top-0 left-0 z-30">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 h-12">
          <div className="h-12 w-12 overflow-hidden flex items-center justify-center rounded">
            <Image
              src="/logo-icon.png"
              alt="MockPal Logo"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-black font-['Poppins']" style={{ fontWeight: 700 }}>
            Mock<span className="text-blue-500">Pal</span>
          </span>
        </Link>
        
        <nav>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:underline transition">
                个人资料
              </Link>
              <Link href="/matches" className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:underline transition">
                匹配管理
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                退出登录
              </Button>
              <span className="text-sm font-medium text-gray-500">欢迎, {user.username}</span>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
} 