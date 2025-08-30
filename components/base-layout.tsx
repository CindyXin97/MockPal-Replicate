'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/header';

export interface BaseLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;  // 是否需要认证
  redirectIfAuthenticated?: boolean;  // 已认证时是否重定向
  authRedirectTo?: string;  // 未认证时重定向目标
  authenticatedRedirectTo?: string;  // 已认证时重定向目标
  showHeader?: boolean;  // 是否显示Header
}

export function BaseLayout({ 
  children,
  requireAuth = false,
  redirectIfAuthenticated = false,
  authRedirectTo = '/auth',
  authenticatedRedirectTo = '/matches',
  showHeader = true
}: BaseLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    // 需要认证但未登录
    if (requireAuth && status === 'unauthenticated') {
      router.push(authRedirectTo);
      return;
    }

    // 已登录但需要重定向（如登录页面）
    if (redirectIfAuthenticated && status === 'authenticated' && session) {
      router.push(authenticatedRedirectTo);
      return;
    }
  }, [status, session, router, requireAuth, redirectIfAuthenticated, authRedirectTo, authenticatedRedirectTo]);

  // 显示加载状态
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  // 需要认证但未认证时返回null（会被useEffect重定向）
  if (requireAuth && status === 'unauthenticated') {
    return null;
  }

  // 已认证但需要重定向时返回null
  if (redirectIfAuthenticated && status === 'authenticated' && session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1 container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}

// 导出兼容的组件别名，方便迁移
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return <BaseLayout requireAuth>{children}</BaseLayout>;
}

export function PublicLayout({ 
  children,
  redirectIfAuthenticated = true
}: { 
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
}) {
  return (
    <BaseLayout redirectIfAuthenticated={redirectIfAuthenticated}>
      {children}
    </BaseLayout>
  );
}