'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { registerWithEmail } from '@/app/actions/auth';
import { PublicLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [language] = useAtom(languageAtom);
  
  const t = useMemo(() => {
    if (language === 'en') {
      return {
        login: 'Sign In',
        register: 'Sign Up',
        welcomeLogin: 'Welcome back, start your mock interview journey',
        welcomeRegister: 'Welcome, start your mock interview journey',
        passwordLogin: 'Password Login',
        emailLogin: 'Email Login',
        email: 'Email',
        emailPlaceholder: 'Enter your email address',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        loginButton: 'Sign In',
        loggingIn: 'Signing in...',
        emailAddress: 'Email Address',
        sendVerificationEmail: 'Send Verification Email',
        sending: 'Sending...',
        emailLinkSent: 'We will send a login link to your email',
        or: 'OR',
        googleLogin: 'Sign in with Google',
        googleRegister: 'Sign up with Google',
        inviteCode: 'Invite Code',
        optional: '(Optional)',
        inviteCodePlaceholder: 'Enter invite code if you have one',
        inviteCodeTip: '💡 Using an invite code will give your friend extra quota rewards',
        sendPasswordEmail: 'Send Password Setup Email',
        passwordEmailSent: 'We will send a password setup link to your email',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        registerNow: 'Sign up now',
        loginNow: 'Sign in now',
        errors: {
          googleCallbackFailed: 'Google sign-in callback failed, please check configuration',
          oauthSigninFailed: 'OAuth sign-in failed, please try again',
          oauthCallbackFailed: 'OAuth callback failed, please check configuration',
          configError: 'Authentication configuration error, please contact administrator',
          loginFailed: 'Sign in failed: ',
          emailRequired: 'Please enter your email address',
          loginSuccess: 'Sign in successful',
          emailOrPasswordError: 'Email or password incorrect',
          loginError: 'Sign in failed, please try again later',
          emailSent: 'Verification email sent, please check your inbox',
          sendEmailError: 'Failed to send email, please try again later',
          registrationError: 'Registration failed, please try again later',
          googleAuthError: 'Google authentication failed, please try again later',
        },
      };
    }
    return {
      login: '登录',
      register: '注册',
      welcomeLogin: '欢迎登录，开启你的模拟面试之旅',
      welcomeRegister: '欢迎注册，开启你的模拟面试之旅',
      passwordLogin: '密码登录',
      emailLogin: '邮箱登录',
      email: '邮箱',
      emailPlaceholder: '请输入邮箱地址',
      password: '密码',
      passwordPlaceholder: '请输入密码',
      loginButton: '登录',
      loggingIn: '登录中...',
      emailAddress: '邮箱地址',
      sendVerificationEmail: '发送验证邮件',
      sending: '发送中...',
      emailLinkSent: '我们将向您的邮箱发送一个登录链接',
      or: '或',
      googleLogin: '使用 Google 账号登录',
      googleRegister: '使用 Google 账号注册',
      inviteCode: '邀请码',
      optional: '(选填)',
      inviteCodePlaceholder: '如有好友分享的邀请码，请输入',
      inviteCodeTip: '💡 使用邀请码注册，好友将获得额外配额奖励',
      sendPasswordEmail: '发送设置密码邮件',
      passwordEmailSent: '我们将向您的邮箱发送设置密码的链接',
      noAccount: '还没有账号？',
      hasAccount: '已有账号？',
      registerNow: '立即注册',
      loginNow: '立即登录',
      errors: {
        googleCallbackFailed: 'Google登录回调失败，请检查配置',
        oauthSigninFailed: 'OAuth登录失败，请重试',
        oauthCallbackFailed: 'OAuth回调失败，请检查配置',
        configError: '认证配置错误，请联系管理员',
        loginFailed: '登录失败：',
        emailRequired: '请输入邮箱地址',
        loginSuccess: '登录成功',
        emailOrPasswordError: '邮箱或密码错误',
        loginError: '登录失败，请稍后再试',
        emailSent: '验证邮件已发送，请查看您的邮箱',
        sendEmailError: '发送邮件失败，请稍后再试',
        registrationError: '注册失败，请稍后再试',
        googleAuthError: 'Google认证失败，请稍后再试',
      },
    };
  }, [language]);

  useEffect(() => {
    // 根据 URL 参数决定显示模式
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setAuthMode('register');
    } else {
      setAuthMode('login');
    }

    // 检查URL中的错误参数
    const error = searchParams.get('error');
    if (error && authMode === 'login') {
      if (error === 'Callback') {
        toast.error(t.errors.googleCallbackFailed);
      } else if (error === 'OAuthSignin') {
        toast.error(t.errors.oauthSigninFailed);
      } else if (error === 'OAuthCallback') {
        toast.error(t.errors.oauthCallbackFailed);
      } else if (error === 'Configuration') {
        toast.error(t.errors.configError);
      } else {
        toast.error(t.errors.loginFailed + error);
      }
    }
  }, [searchParams, authMode, t]);

  // 邮箱+密码登录
  const handleEmailPasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        toast.success(t.errors.loginSuccess);
        router.push('/matches');
      } else {
        toast.error(t.errors.emailOrPasswordError);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t.errors.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  // 邮箱验证登录
  const handleEmailAuth = async () => {
    if (!email) {
      toast.error(t.errors.emailRequired);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/matches',
      });
      
      toast.success(t.errors.emailSent);
      router.push(`/verify-request?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('Email auth error:', error);
      toast.error(t.errors.sendEmailError);
    } finally {
      setIsLoading(false);
    }
  };

  // 邮箱注册 - 发送设置密码链接
  const handleEmailRegister = async () => {
    if (!registerEmail) {
      toast.error(t.errors.emailRequired);
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerWithEmail(registerEmail, inviteCode.trim() || undefined);
      
      if (result.success) {
        toast.success(result.message);
        router.push(`/verify-request?email=${encodeURIComponent(registerEmail)}&type=password`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(t.errors.registrationError);
    } finally {
      setIsLoading(false);
    }
  };

  // Google认证
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // Google登录/注册都跳转到个人资料页面，确保用户填写完整信息
      const callbackUrl = '/profile';
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error(t.errors.googleAuthError);
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
      <div className="fixed inset-0 w-full h-full -z-10" style={{backgroundColor: '#f5f7fa'}} aria-hidden="true"></div>
      <div className="flex min-h-[70vh] items-center justify-center w-full">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-center tracking-tight text-gray-900 mb-2">
              <span style={{color: '#3b82f6'}}>{authMode === 'login' ? t.login : t.register}</span> MockPal
            </CardTitle>
            <p className="text-base text-gray-500 text-center font-medium">
              {authMode === 'login' ? t.welcomeLogin : t.welcomeRegister}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {authMode === 'login' ? (
                // 登录模式
                <>
                  <Tabs defaultValue="password" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="password">{t.passwordLogin}</TabsTrigger>
                      <TabsTrigger value="email">{t.emailLogin}</TabsTrigger>
                    </TabsList>

                    {/* 邮箱密码登录 */}
                    <TabsContent value="password" className="space-y-4">
                      <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">{t.email}</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder={t.emailPlaceholder}
                              className="pl-10"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t.password}</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="password"
                              name="password"
                              type="password"
                              placeholder={t.passwordPlaceholder}
                              className="pl-10"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full px-10 py-2 text-lg font-semibold text-white border-0 shadow-md hover:shadow-lg transition-all"
                          style={{background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'}}
                          disabled={isLoading}
                        >
                          {isLoading ? t.loggingIn : t.loginButton}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* 邮箱验证登录 */}
                    <TabsContent value="email" className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email-magic">{t.emailAddress}</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="email-magic"
                              type="email"
                              placeholder={t.emailPlaceholder}
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
                          className="w-full px-10 py-2 text-lg font-semibold text-white border-0 shadow-md hover:shadow-lg transition-all"
                          style={{background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'}}
                          disabled={isLoading}
                        >
                          {isLoading ? t.sending : t.sendVerificationEmail}
                        </Button>
                        <p className="text-sm text-gray-500 text-center">
                          {t.emailLinkSent}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">{t.or}</span>
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
                    {t.googleLogin}
                  </Button>
                </>
              ) : (
                // 注册模式
                <div className="space-y-4">
                  {/* 邮箱注册表单 */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">{t.emailAddress}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder={t.emailPlaceholder}
                          className="pl-10"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-code">
                        {t.inviteCode} <span className="text-xs text-gray-400 font-normal">{t.optional}</span>
                      </Label>
                      <Input
                        id="invite-code"
                        type="text"
                        placeholder={t.inviteCodePlaceholder}
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        maxLength={12}
                      />
                      <p className="text-xs text-gray-500">
                        {t.inviteCodeTip}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleEmailRegister}
                      className="w-full px-10 py-2 text-lg font-semibold text-white border-0 shadow-md hover:shadow-lg transition-all"
                      style={{background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'}}
                      disabled={isLoading}
                    >
                      {isLoading ? t.sending : t.sendPasswordEmail}
                    </Button>
                    <p className="text-sm text-gray-500 text-center">
                      {t.passwordEmailSent}
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">{t.or}</span>
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
                    {t.googleRegister}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center">
              {authMode === 'login' ? t.noAccount : t.hasAccount}{' '}
              <button
                onClick={switchAuthMode}
                className="font-semibold hover:underline"
                style={{color: '#3b82f6'}}
              >
                {authMode === 'login' ? t.registerNow : t.loginNow}
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