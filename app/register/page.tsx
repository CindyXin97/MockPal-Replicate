'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { register } from '@/app/actions/auth';
import { PublicLayout } from '@/components/public-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isAuthenticatedAtom, userAtom } from '@/lib/store';
import { TARGET_COMPANIES, TARGET_INDUSTRIES } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherCompanyInput, setShowOtherCompanyInput] = useState(false);
  const [otherCompanyName, setOtherCompanyName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');

  const handleCompanyChange = (value: string) => {
    setTargetCompany(value);
    if (value === 'other') {
      setShowOtherCompanyInput(true);
    } else {
      setShowOtherCompanyInput(false);
      setOtherCompanyName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // 验证其他公司名称
    if (targetCompany === 'other' && !otherCompanyName.trim()) {
      toast.error('请填写目标公司名称');
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData(e.currentTarget);
      
      // 如果选择了"其他"，将公司名称设置为用户输入的名称
      if (targetCompany === 'other') {
        formData.set('targetCompany', otherCompanyName);
      } else {
        formData.set('targetCompany', targetCompany);
      }
      
      const result = await register(formData);

      if (result.success && 'user' in result) {
        setIsAuthenticated(true);
        setUser(result.user || null);
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

  return (
    <PublicLayout redirectIfAuthenticated={false}>
      {/* 全屏背景渐变 */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-[70vh] items-center justify-center w-full">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10 -mt-16">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-center tracking-tight text-gray-900 mb-2">
              <span className="text-blue-500">注册</span> MockPal
            </CardTitle>
            <p className="text-base text-gray-500 text-center font-medium">欢迎注册，开启你的模拟面试之旅</p>
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
                  placeholder="请输入密码 (至少6位)"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetCompany">目标公司 (必选)</Label>
                <Select value={targetCompany} onValueChange={handleCompanyChange} required>
                  <SelectTrigger className="w-full rounded-md border border-input bg-background px-3 py-2">
                    <SelectValue placeholder="请选择目标公司" className="text-gray-400" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_COMPANIES.map((company) => (
                      <SelectItem key={company.value} value={company.value}>
                        {company.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showOtherCompanyInput && (
                  <Input
                    placeholder="请输入目标公司名称"
                    value={otherCompanyName}
                    onChange={(e) => setOtherCompanyName(e.target.value)}
                    className="mt-2"
                    required
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetIndustry">目标行业 (必选)</Label>
                <Select name="targetIndustry" required>
                  <SelectTrigger className="w-full rounded-md border border-input bg-background px-3 py-2">
                    <SelectValue placeholder="请选择目标行业" className="text-gray-400" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600" disabled={isLoading}>
                {isLoading ? '注册中...' : '注册'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center">
              已有账号？{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                立即登录
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
} 