'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { login } from '@/app/actions/auth';
import { getProfile } from '@/app/actions/profile';
import { PublicLayout } from '@/components/public-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAuthenticatedAtom, userAtom } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await login(formData);

      if (result.success && 'user' in result) {
        setIsAuthenticated(true);
        setUser(result.user || null);
        router.push('/matches');
        toast.success('登录成功');
      } else {
        toast.error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('登录失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout redirectIfAuthenticated={false}>
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-[70vh] items-center justify-center w-full">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10 -mt-16">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-center tracking-tight text-gray-900 mb-2">
              <span className="text-blue-500">登录</span> MockPal
            </CardTitle>
            <p className="text-base text-gray-500 text-center font-medium">欢迎登录，开启你的模拟面试之旅</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="请输入密码"
                  required
                />
              </div>
              <Button type="submit" className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600" disabled={isLoading}>
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center">
              还没有账号？{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                立即注册
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
} 