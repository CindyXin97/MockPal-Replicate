'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { setUserPassword } from '@/app/actions/auth';
import { PublicLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    // 从URL获取token和email
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    const inviteCodeParam = searchParams.get('inviteCode');
    
    if (!emailParam || !tokenParam) {
      toast.error('无效的设置密码链接');
      router.push('/auth');
      return;
    }
    
    setEmail(emailParam);
    setToken(tokenParam);
    
    // 如果URL中有邀请码，自动填充
    if (inviteCodeParam) {
      setInviteCode(inviteCodeParam.toUpperCase());
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('密码长度至少为6位');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
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
              toast.success('密码设置成功，邀请人已获得额外配额！');
            } else {
              toast.success('密码设置成功！');
              console.log('Invite code error:', inviteData.message);
            }
          } catch (error) {
            console.error('Invite code error:', error);
            toast.success('密码设置成功！');
          }
        } else {
          toast.success('密码设置成功，请登录');
        }
        
        router.push('/auth');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Set password error:', error);
      toast.error('设置密码失败，请稍后再试');
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
              设置密码
            </CardTitle>
            <p className="text-base text-gray-500 text-center font-medium">
              为您的账号 {email} 设置密码
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  邀请码 <span className="text-xs text-gray-400 font-normal">(可选)</span>
                </Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  placeholder="有好友分享的邀请码？请输入"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="uppercase"
                />
                <p className="text-xs text-gray-500">
                  💡 使用邀请码注册，好友将获得额外配额奖励
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600"
                disabled={isLoading}
              >
                {isLoading ? '设置中...' : '设置密码'}
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