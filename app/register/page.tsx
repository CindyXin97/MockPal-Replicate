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
import { isAuthenticatedAtom, userAtom } from '@/lib/store';
import { COMPANY_OPTIONS, INDUSTRY_OPTIONS } from '@/lib/profile';

export default function RegisterPage() {
  const router = useRouter();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [targetCompany, setTargetCompany] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // 处理"其他"选项的输入值
      if (targetCompany === '其他') {
        const otherCompany = (e.currentTarget.querySelector('#targetCompanyOther') as HTMLInputElement)?.value;
        if (!otherCompany?.trim()) {
          toast.error('请填写目标公司名称');
          setIsLoading(false);
          return;
        }
        formData.set('targetCompany', otherCompany);
      }
      
      if (targetIndustry === '其他') {
        const otherIndustry = (e.currentTarget.querySelector('#targetIndustryOther') as HTMLInputElement)?.value;
        if (!otherIndustry?.trim()) {
          toast.error('请填写目标行业名称');
          setIsLoading(false);
          return;
        }
        formData.set('targetIndustry', otherIndustry);
      }

      const result = await register(formData);

      if (result.success && 'user' in result) {
        setIsAuthenticated(true);
        setUser(result.user || null);
        router.push('/matches');
        toast.success('注册成功！开始浏览匹配对象');
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
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center py-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">加入 MockPal</CardTitle>
            <p className="text-muted-foreground">创建你的账户，开启模拟面试练习之旅</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <select
                  id="targetCompany"
                  name="targetCompany"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">请选择目标公司</option>
                  {COMPANY_OPTIONS.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
                {targetCompany === '其他' && (
                  <Input
                    id="targetCompanyOther"
                    name="targetCompanyOther"
                    placeholder="请输入目标公司名称"
                    className="mt-2"
                    required
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetIndustry">目标行业 (必选)</Label>
                <select
                  id="targetIndustry"
                  name="targetIndustry"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">请选择目标行业</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {targetIndustry === '其他' && (
                  <Input
                    id="targetIndustryOther"
                    name="targetIndustryOther"
                    placeholder="请输入目标行业名称"
                    className="mt-2"
                    required
                  />
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? '注册中...' : '注册'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <p className="text-center text-sm text-muted-foreground">
              已有账号？{' '}
              <Link href="/login" className="text-primary hover:underline">
                立即登录
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicLayout>
  );
} 