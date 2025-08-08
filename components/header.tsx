'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';

export function Header() {
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
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
          {status === 'authenticated' && session ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:underline transition">
                个人资料
              </Link>
              <Link href="/matches" className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:underline transition">
                匹配管理
              </Link>
              <Menubar>
                <MenubarMenu>
                  <MenubarTrigger>
                    {session.user?.name || session.user?.email || '用户'}
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem onClick={handleLogout}>
                      退出登录
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
} 