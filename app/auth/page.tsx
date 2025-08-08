'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { register } from '@/app/actions/auth';
import { PublicLayout } from '@/components/public-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, User, Lock } from 'lucide-react';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // 根据 URL 参数决定显示模式
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setAuthMode('register');
    } else {
      setAuthMode('login');
    }

    // 检查URL中的错误参数（只在登录模式下）
    const error = searchParams.get('error');
    if (error && authMode === 'login') {
      if (error === 'Callback') {
        toast.error('Google登录回调失败，请检查配置');
      } else if (error === 'OAuthSignin') {
        toast.error('OAuth登录失败，请重试');
      } else if (error === 'OAuthCallback') {
        toast.error('OAuth回调失败，请检查配置');
      } else if (error === 'Configuration') {
        toast.error('认证配置错误，请联系管理员');
      } else {
        toast.error('登录失败：' + error);
      }
    }
  }, [searchParams, authMode]);

  const handleCredentialsLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await signIn('credentials', {
        username: formData.get('username'),
        password: formData.get('password'),
        redirect: false,
      });

      if (result?.error) {
        toast.error('用户名或密码错误');
      } else {
        toast.success('登录成功');
        router.push('/matches');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('登录失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email) {
      toast.error('请输入邮箱地址');
      return;
    }

    setIsLoading(true);
    console.log('🔵 [前端] 邮箱验证按钮被点击 (统一流程)');
    console.log('📧 [前端] 邮箱地址:', email);

    try {
      console.log('📤 [前端] 调用 NextAuth signIn(email) - 统一处理');
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: authMode === 'register' ? '/profile' : '/matches',
      });
      console.log('📨 [前端] NextAuth 返回:', result);
      
      toast.success('验证邮件已发送，请查看您的邮箱');
      router.push(`/verify-request?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('❌ [前端] 邮件验证失败:', error);
      toast.error('发送邮件失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await register(formData);

      if (result.success && 'user' in result) {
        // 自动登录
        await signIn('credentials', {
          username: formData.get('username'),
          password: formData.get('password'),
          redirect: false,
        });
        router.push('/profile');
        toast.success('注册成功，请先完善个人资料');
      } else {
        toast.error(result.message || '注册失败');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('注册失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const callbackUrl = authMode === 'register' ? '/profile' : '/matches';
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error(`Google${authMode === 'register' ? '注册' : '登录'}失败，请稍后再试`);
      setIsLoading(false);
    }
  };


  const switchAuthMode = () => {
    const newMode = authMode === 'login' ? 'register' : 'login';
    setAuthMode(newMode);
    router.push(`/auth?mode=${newMode}`, { scroll: false });
  };

  return (
    <PublicLayout redirectIfAuthenticated={false}>
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-[70vh] items-center justify-center w-full">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-center tracking-tight text-gray-900 mb-2">
              <span className="text-blue-500">{authMode === 'login' ? '登录' : '注册'}</span> MockPal
            </CardTitle>
            <p className="text-base text-gray-500 text-center font-medium">
              {authMode === 'login' ? '欢迎登录，开启你的模拟面试之旅' : '欢迎注册，开启你的模拟面试之旅'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {authMode === 'login' ? (
                // 登录模式
                <>
                  <Tabs defaultValue="password" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password">密码登录</TabsTrigger>
                    <TabsTrigger value="email">邮箱验证</TabsTrigger>
                  </TabsList>

                  {/* 密码登录 */}
                  <TabsContent value="password" className="space-y-4">
                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">用户名</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="username"
                            name="username"
                            placeholder="请输入用户名"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">密码</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="请输入密码"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600"
                        disabled={isLoading}
                      >
                        {isLoading ? '登录中...' : '登录'}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* 邮箱登录 */}
                  <TabsContent value="email" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">邮箱地址</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="请输入邮箱地址"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleEmailAuth}
                        className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600"
                        disabled={isLoading}
                      >
                        {isLoading ? '发送中...' : '发送验证邮件'}
                      </Button>
                      <p className="text-sm text-gray-500 text-center">
                        我们将向您的邮箱发送一个登录链接
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">或</span>
                  </div>
                </div>

                {/* Google 登录按钮 */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  使用 Google 账号登录
                </Button>
                </>
              ) : (
                // 注册模式
                <div className="space-y-4">
                  {/* 邮箱注册 */}
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱注册</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="请输入邮箱地址"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleEmailAuth}
                        disabled={isLoading}
                      >
                        发送验证邮件
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">或使用密码注册</span>
                    </div>
                  </div>

                  {/* 传统注册表单 */}
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="username"
                          name="username"
                          placeholder="请输入用户名"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="请输入密码 (至少6位)"
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">确认密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="请再次输入密码"
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600"
                      disabled={isLoading}
                    >
                      {isLoading ? '注册中...' : '注册'}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">或</span>
                    </div>
                  </div>

                  {/* Google 注册按钮 */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    使用 Google 账号注册
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center">
              {authMode === 'login' ? '还没有账号？' : '已有账号？'}{' '}
              <button
                onClick={switchAuthMode}
                className="text-blue-600 font-semibold hover:underline"
              >
                {authMode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}