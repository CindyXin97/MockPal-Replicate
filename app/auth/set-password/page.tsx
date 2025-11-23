'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { setUserPassword } from '@/app/actions/auth';
import { PublicLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [language] = useAtom(languageAtom);
  
  const t = useMemo(() => {
    if (language === 'en') {
      return {
        setPassword: 'Set Password',
        setPasswordFor: 'Set password for your account',
        password: 'Password',
        passwordPlaceholder: 'Enter password (at least 6 characters)',
        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder: 'Enter password again',
        inviteCode: 'Invite Code',
        optional: '(Optional)',
        inviteCodePlaceholder: 'Have an invite code from a friend? Enter it here',
        inviteCodeTip: '💡 Using an invite code will give your friend extra quota rewards',
        setting: 'Setting...',
        setPasswordButton: 'Set Password',
        loading: 'Loading...',
        errors: {
          invalidLink: 'Invalid password setup link',
          passwordTooShort: 'Password must be at least 6 characters',
          passwordMismatch: 'Passwords do not match',
          setPasswordSuccess: 'Password set successfully, please sign in',
          setPasswordSuccessWithInvite: 'Password set successfully, inviter has received extra quota!',
          setPasswordError: 'Failed to set password, please try again later',
        },
      };
    }
    return {
      setPassword: '设置密码',
      setPasswordFor: '为您的账号设置密码',
      password: '密码',
      passwordPlaceholder: '请输入密码 (至少6位)',
      confirmPassword: '确认密码',
      confirmPasswordPlaceholder: '请再次输入密码',
      inviteCode: '邀请码',
      optional: '(可选)',
      inviteCodePlaceholder: '有好友分享的邀请码？请输入',
      inviteCodeTip: '💡 使用邀请码注册，好友将获得额外配额奖励',
      setting: '设置中...',
      setPasswordButton: '设置密码',
      loading: '加载中...',
      errors: {
        invalidLink: '无效的设置密码链接',
        passwordTooShort: '密码长度至少为6位',
        passwordMismatch: '两次输入的密码不一致',
        setPasswordSuccess: '密码设置成功，请登录',
        setPasswordSuccessWithInvite: '密码设置成功，邀请人已获得额外配额！',
        setPasswordError: '设置密码失败，请稍后再试',
      },
    };
  }, [language]);

  useEffect(() => {
    // 从URL获取token和email
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    const inviteCodeParam = searchParams.get('inviteCode');
    
    if (!emailParam || !tokenParam) {
      toast.error(t.errors.invalidLink);
      router.push('/auth');
      return;
    }
    
    setEmail(emailParam);
    setToken(tokenParam);
    
    // 如果URL中有邀请码，自动填充
    if (inviteCodeParam) {
      setInviteCode(inviteCodeParam.toUpperCase());
    }
  }, [searchParams, router, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error(t.errors.passwordTooShort);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error(t.errors.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      const result = await setUserPassword(email, token, password, confirmPassword);
      
      if (result.success) {
        // 如果提供了邀请码，验证并处理
        if (inviteCode.trim() && 'userId' in result) {
          try {
            const inviteResult = await fetch('/api/invite-codes/use', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                inviteCode: inviteCode.trim(),
                userId: result.userId 
              })
            });
            const inviteData = await inviteResult.json();
            
            if (inviteData.success) {
              toast.success(t.errors.setPasswordSuccessWithInvite);
            } else {
              toast.success(t.errors.setPasswordSuccess);
              console.log('Invite code error:', inviteData.message);
            }
          } catch (error) {
            console.error('Invite code error:', error);
            toast.success(t.errors.setPasswordSuccess);
          }
        } else {
          toast.success(t.errors.setPasswordSuccess);
        }
        
        router.push('/auth');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Set password error:', error);
      toast.error(t.errors.setPasswordError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout redirectIfAuthenticated={false}>
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-[70vh] items-center justify-center w-full">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-center tracking-tight text-gray-900 mb-2">
              {t.setPassword}
            </CardTitle>
            <p className="text-base text-gray-500 text-center font-medium">
              {t.setPasswordFor} {email}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder={t.confirmPasswordPlaceholder}
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              {/* 邀请码输入（可选） */}
              <div className="space-y-2">
                <Label htmlFor="inviteCode">
                  {t.inviteCode} <span className="text-xs text-gray-400 font-normal">{t.optional}</span>
                </Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  placeholder={t.inviteCodePlaceholder}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="uppercase"
                />
                <p className="text-xs text-gray-500">
                  {t.inviteCodeTip}
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600"
                disabled={isLoading}
              >
                {isLoading ? t.setting : t.setPasswordButton}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <SetPasswordForm />
    </Suspense>
  );
}