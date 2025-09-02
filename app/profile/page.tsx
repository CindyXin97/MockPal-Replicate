'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfileFormData } from '@/lib/profile';
import { TARGET_COMPANIES, TARGET_INDUSTRIES } from '@/lib/constants';
import { useProfile } from '@/lib/useProfile';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  
  // 检测是否从匹配页面跳转而来
  const fromMatches = searchParams.get('from') === 'matches';
  
  // 使用useMemo缓存user对象，避免每次渲染创建新对象
  const user = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: parseInt(session.user.id || '0'),
      username: session.user.name || session.user.email || 'User'
    };
  }, [session?.user?.id, session?.user?.name, session?.user?.email]);

  // 使用简单的profile hook
  const { profile, updateProfile } = useProfile(user?.id);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherCompanyInput, setShowOtherCompanyInput] = useState(false);
  const [otherCompanyName, setOtherCompanyName] = useState('');
  
  // Form state - 从profile初始化
  const [formData, setFormData] = useState<ProfileFormData & {name: string}>({
    name: '',
    jobType: 'DA',
    experienceLevel: '应届',
    targetCompany: '',
    targetIndustry: '',
    technicalInterview: false,
    behavioralInterview: false,
    caseAnalysis: false,
    email: '',
    wechat: '',
    linkedin: '',
    bio: '',
  });

  // 重定向未认证用户
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }
  }, [status, router]);

  // 同步profile到表单
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || session?.user?.name || '',
        jobType: profile.jobType || 'DA',
        experienceLevel: profile.experienceLevel || '应届',
        targetCompany: profile.targetCompany || '',
        targetIndustry: profile.targetIndustry || '',
        technicalInterview: profile.technicalInterview || false,
        behavioralInterview: profile.behavioralInterview || false,
        caseAnalysis: profile.caseAnalysis || false,
        email: profile.email || '',
        wechat: profile.wechat || '',
        linkedin: profile.linkedin || '',
        bio: profile.bio || '',
      });
      
      // 检查是否选择了"其他"公司
      if (profile.targetCompany === 'other') {
        setShowOtherCompanyInput(true);
        setOtherCompanyName(profile.otherCompanyName || '');
      }
    } else if (session?.user?.name) {
      // 没有profile时，只初始化用户名
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
      }));
    }
  }, [profile, session?.user?.name]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('用户未登录');
      return;
    }

    setIsLoading(true);

    try {
      // 准备提交数据
      const submitData: ProfileFormData = {
        ...formData,
        // 如果选择了"其他"公司，使用otherCompanyName
        otherCompanyName: formData.targetCompany === 'other' ? otherCompanyName : undefined
      };
      
      const result = await updateProfile(submitData);

      if (result.success) {
        // 如果更新了名称，需要更新session
        if (formData.name && formData.name !== session?.user?.name) {
          await update({ name: formData.name });
        }
        
        if (fromMatches) {
          toast.success('资料完善成功！正在为您寻找最合适的练习伙伴...');
        } else {
          toast.success('资料保存成功，系统会为你推荐新的匹配对象');
        }
        router.push('/matches');
      } else {
        toast.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error('保存失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* 全屏背景渐变 */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-screen items-center justify-center w-full">
        <Card className="w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-center tracking-tight text-gray-900 mb-2">个人资料</CardTitle>
            <p className="text-base text-gray-500 text-center font-medium">完善资料，获得更精准的匹配推荐</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户名字段 */}
              <div className="space-y-2">
                <Label htmlFor="name">显示名称 <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入您的显示名称"
                  required
                />
                <p className="text-sm text-gray-500">这是其他用户看到的您的名称</p>
              </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobType">岗位类型 <span className="text-red-500 ml-1">*</span></Label>
                  <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择岗位类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DA">数据分析 (DA)</SelectItem>
                      <SelectItem value="DS">数据科学 (DS)</SelectItem>
                      <SelectItem value="DE">数据工程 (DE)</SelectItem>
                      <SelectItem value="BA">商业分析 (BA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">经验水平 <span className="text-red-500 ml-1">*</span></Label>
                  <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择经验水平" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="应届">应届</SelectItem>
                      <SelectItem value="1-3年">1-3年</SelectItem>
                      <SelectItem value="3-5年">3-5年</SelectItem>
                      <SelectItem value="5年以上">5年以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetCompany">目标公司 <span className="text-red-500 ml-1">*</span></Label>
                  <Select value={formData.targetCompany} onValueChange={(value) => {
                    handleInputChange('targetCompany', value);
                    setShowOtherCompanyInput(value === 'other');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择目标公司" />
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
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetIndustry">目标行业 <span className="text-red-500 ml-1">*</span></Label>
                  <Select value={formData.targetIndustry} onValueChange={(value) => handleInputChange('targetIndustry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择目标行业" />
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
              </div>

              <div className="space-y-3">
                <Label>期望练习内容 <span className="text-red-500 ml-1">*</span></Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="technicalInterview"
                      checked={formData.technicalInterview}
                      onCheckedChange={(checked) => handleInputChange('technicalInterview', checked)}
                    />
                    <Label htmlFor="technicalInterview">技术面</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="behavioralInterview"
                      checked={formData.behavioralInterview}
                      onCheckedChange={(checked) => handleInputChange('behavioralInterview', checked)}
                    />
                    <Label htmlFor="behavioralInterview">行为面</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="caseAnalysis"
                      checked={formData.caseAnalysis}
                      onCheckedChange={(checked) => handleInputChange('caseAnalysis', checked)}
                    />
                    <Label htmlFor="caseAnalysis">案例分析</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>联系方式 (匹配成功后可见，推荐添加微信)</Label>
                <Input
                  placeholder="邮箱"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                <Input
                  placeholder="微信"
                  value={formData.wechat}
                  onChange={(e) => handleInputChange('wechat', e.target.value)}
                />
                <Input
                  placeholder="LinkedIn https://www.linkedin.com/in/your-profile"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">一句话介绍（可选，能提升曝光和匹配度哦～）</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="如：三年打工人，在美东时区，希望找到小姐妹一起练case～"
                />
              </div>

              <Button type="submit" className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600" disabled={isLoading}>
                {isLoading ? '保存中...' : '保存资料'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">加载中...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}