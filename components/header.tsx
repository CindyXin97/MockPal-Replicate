'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [language, setLanguage] = useAtom(languageAtom);

  const texts = language === 'zh'
    ? {
        profile: '个人资料',
        matches: '匹配管理',
        library: '我的题库',
        achievements: '我的成就',
        logout: '退出登录',
        defaultUserName: '用户',
        languageToggleAria: '选择语言',
        languageSelectPlaceholder: '选择语言',
        languageOptionZh: '简体中文',
        languageOptionEn: 'English',
      }
    : {
        profile: 'Profile',
        matches: 'Matches',
        library: 'My Library',
        achievements: 'Achievements',
        logout: 'Sign out',
        defaultUserName: 'User',
        languageToggleAria: 'Select language',
        languageSelectPlaceholder: 'Language',
        languageOptionZh: 'Chinese',
        languageOptionEn: 'English',
      };

  // 获取未读通知数量
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      fetchUnreadCount();
      
      // 每30秒刷新一次通知数量
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/user/notifications?unread_only=true&limit=1');
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.total || 0);
      }
    } catch (error) {
      console.error('获取未读通知数失败:', error);
    }
  };

  const handleLogout = async () => {
    // 清除所有本地存储的用户数据
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userProfile');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      console.log('🧹 已清除本地缓存数据');
    }
    await signOut({ callbackUrl: '/' });
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (session?.user?.name) return session.user.name;
    if (session?.user?.email) return session.user.email.split('@')[0];
    return texts.defaultUserName;
  };

  // 获取用户头像字母
  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="w-full px-4 py-2 bg-white/80 backdrop-blur border-b shadow-sm fixed top-0 left-0 z-30">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
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
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value as 'zh' | 'en')}
          >
            <SelectTrigger
              aria-label={texts.languageToggleAria}
              className="w-32 border-blue-200 text-blue-600 hover:bg-blue-50 focus:ring-blue-200 focus:ring-offset-0"
            >
              <SelectValue placeholder={texts.languageSelectPlaceholder} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="zh">{texts.languageOptionZh}</SelectItem>
              <SelectItem value="en">{texts.languageOptionEn}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <nav>
          {status === 'authenticated' && session ? (
            <div className="flex items-center gap-6">
              <Link 
                href="/profile" 
                className={`group relative text-sm font-medium transition-all duration-300 ${
                  pathname === '/profile' 
                    ? 'text-blue-600 font-semibold' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <span className="relative">
                  {texts.profile}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ${
                    pathname === '/profile' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </span>
              </Link>
              <Link 
                href="/matches" 
                className={`group relative text-sm font-medium transition-all duration-300 ${
                  pathname === '/matches' 
                    ? 'text-blue-600 font-semibold' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <span className="relative">
                  {texts.matches}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ${
                    pathname === '/matches' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </span>
              </Link>
              <Link 
                href="/my-library" 
                className={`group relative text-sm font-medium transition-all duration-300 ${
                  pathname === '/my-library' 
                    ? 'text-blue-600 font-semibold' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <span className="relative">
                  {texts.library}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ${
                    pathname === '/my-library' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </span>
              </Link>
              <Link 
                href="/me" 
                className={`group relative text-sm font-medium transition-all duration-300 ${
                  pathname?.startsWith('/me')
                    ? 'text-blue-600 font-semibold' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <span className="relative">
                  {texts.achievements}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ${
                    pathname?.startsWith('/me') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-6 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              
              <Menubar>
                <MenubarMenu>
                  <MenubarTrigger>
                    <span className="text-sm font-medium text-gray-700">{getUserDisplayName()}</span>
                  </MenubarTrigger>
                  <MenubarContent align="end" className="w-48">
                    <MenubarItem onClick={handleLogout} className="cursor-pointer">
                      <span className="text-lg mr-2">🚪</span>
                      <span>{texts.logout}</span>
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