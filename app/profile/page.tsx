'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
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
import { SchoolAutocomplete } from '@/components/ui/school-autocomplete';
import { CompanyAutocomplete } from '@/components/ui/company-autocomplete';
import { ProfileFormData } from '@/lib/profile';
import { TARGET_COMPANIES, TARGET_INDUSTRIES, SCHOOLS } from '@/lib/constants';
import { useProfile } from '@/lib/useProfile';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  
  const fromMatches = searchParams.get('from') === 'matches';
  
  const user = useMemo(() => {
    if (!session?.user?.id) return null;
    const userId = parseInt(session.user.id);
    if (isNaN(userId) || userId <= 0) return null;
    return {
      id: userId,
      username: session.user.name || session.user.email || 'User'
    };
  }, [session?.user?.id, session?.user?.name, session?.user?.email]);

  const { profile, isLoading: profileLoading, updateProfile, fetchProfile } = useProfile(user?.id);
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData & {name: string}>({
    name: '',
    jobType: 'DA',
    experienceLevel: '应届',
    targetCompany: '',
    targetIndustry: '',
    technicalInterview: false,
    behavioralInterview: false,
    caseAnalysis: false,
    statsQuestions: false,
    email: '',
    wechat: '',
    linkedin: '',
    bio: '',
    school: '',
    skills: [],
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }
  }, [status, router]);

  // 当用户ID可用时，强制刷新一次数据
  const userIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    // 只在用户ID从无到有，或者用户ID发生变化时刷新
    if (user?.id && user.id !== userIdRef.current && fetchProfile) {
      console.log('🔄 用户ID变化或首次加载，强制刷新个人资料数据');
      
      // 如果用户ID变化（切换用户），清除缓存
      if (userIdRef.current !== undefined && userIdRef.current !== user.id) {
        console.log('⚠️ 检测到用户切换:', userIdRef.current, '->', user.id);
        // 重置表单状态
        setFormData({
          name: '',
          jobType: 'DA',
          experienceLevel: '应届',
          targetCompany: '',
          targetIndustry: '',
          technicalInterview: false,
          behavioralInterview: false,
          caseAnalysis: false,
          statsQuestions: false,
          email: '',
          wechat: '',
          linkedin: '',
          bio: '',
          school: '',
          skills: [],
        });
      }
      
      userIdRef.current = user.id;
      fetchProfile(true);
    }
  }, [user?.id, fetchProfile]);

  // 检查资料完整性的独立useEffect（仅用于Google登录的新用户）
  // 注释掉自动跳转逻辑，允许用户随时查看和编辑个人资料
  // useEffect(() => {
  //   if (profile && !fromMatches) {
  //     // 检查用户资料是否已经填写完整
  //     const isProfileComplete = profile.name && 
  //       profile.jobType && 
  //       profile.experienceLevel && 
  //       profile.targetCompany && 
  //       profile.targetIndustry && 
  //       profile.school && 
  //       profile.bio && 
  //       (profile.email || profile.wechat || profile.linkedin) &&
  //       (profile.technicalInterview || profile.behavioralInterview || profile.caseAnalysis || profile.statsQuestions);

  //     // 如果资料已经完整，跳转到匹配页面
  //     if (isProfileComplete) {
  //       toast.info('您的资料已经完整，正在跳转到匹配页面...');
  //       router.push('/matches');
  //     }
  //   }
  // }, [profile, fromMatches, router]);

  // 处理表单数据更新的独立useEffect
  useEffect(() => {
    console.log('🔍 Profile useEffect 触发:', { profile, sessionName: session?.user?.name });
    
    if (profile) {
      // 预设的学校选项列表
      const predefinedSchools = [
        'stanford', 'mit', 'harvard', 'cmu', 'berkeley', 'caltech', 'princeton', 'yale',
        'columbia', 'upenn', 'cornell', 'brown', 'dartmouth', 'duke', 'northwestern',
        'jhu', 'rice', 'vanderbilt', 'washu', 'emory', 'georgetown', 'nyu', 'usc',
        'ucla', 'ucsd', 'uci', 'ucsb', 'ucdavis', 'ucsc', 'ucriverside', 'ucmerced',
        'gatech', 'uiuc', 'umich', 'uwmadison', 'purdue', 'osu_ohio', 'psu', 'rutgers',
        'buffalo', 'stonybrook', 'binghamton', 'albany', 'arizona', 'asu', 'ut', 'tamu',
        'baylor', 'tcu', 'smu', 'utd', 'utah', 'byu', 'colorado', 'colorado_state',
        'denver', 'oregon', 'osu_oregon', 'washington', 'wsu', 'alaska', 'hawaii',
        'minnesota', 'iowa', 'iowa_state', 'nebraska', 'kansas', 'kansas_state',
        'missouri', 'arkansas', 'oklahoma', 'oklahoma_state', 'lsu', 'tulane',
        'ole_miss', 'mississippi_state', 'alabama', 'auburn', 'uab', 'uga',
        'georgia_tech', 'fsu', 'uf', 'umiami', 'usf', 'ucf', 'fau', 'fiu', 'nova'
      ];

      // 直接使用学校的原始值
      let schoolValue = profile.school || '';
      
      console.log('📚 原始学校值:', schoolValue);

      const newFormData = {
        name: profile.name || session?.user?.name || '',
        jobType: profile.jobType || 'DA',
        experienceLevel: profile.experienceLevel || '应届',
        targetCompany: profile.targetCompany || '',
        targetIndustry: profile.targetIndustry || '',
        technicalInterview: profile.technicalInterview || false,
        behavioralInterview: profile.behavioralInterview || false,
        caseAnalysis: profile.caseAnalysis || false,
        statsQuestions: profile.statsQuestions || false,
        email: profile.email || '',
        wechat: profile.wechat || '',
        linkedin: profile.linkedin || '',
        bio: profile.bio || '',
        school: schoolValue,
        skills: profile.skills || [],
      };
      
      console.log('📋 设置表单数据:', { 
        school: newFormData.school,
        jobType: newFormData.jobType,
        targetCompany: newFormData.targetCompany 
      });
      
      setFormData(newFormData);
    } else if (session?.user?.name) {
      console.log('👤 只有session名称，设置name字段');
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
      }));
    }
  }, [profile, session?.user?.name]);

  const handleInputChange = (field: string, value: any) => {
    if (['experienceLevel', 'targetCompany', 'targetIndustry'].includes(field) && 
        value === '' && 
        formData[field as keyof typeof formData]) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillChange = (index: number, value: string) => {
    if (value.length > 12) return; // 限制每个技能不超过12个字符
    
    setFormData(prev => {
      const newSkills = [...(prev.skills || [])];
      newSkills[index] = value;
      return {
        ...prev,
        skills: newSkills
      };
    });
  };

  const addSkill = () => {
    if ((formData.skills || []).length < 3) {
      // 检查是否有空的技能输入框
      const hasEmptySkill = (formData.skills || []).some(skill => !skill.trim());
      if (hasEmptySkill) {
        toast.error('请先填写当前技能再添加新的');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), '']
      }));
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index)
    }));
  };

  // 计算文本实际宽度，考虑中文字符
  const getTextWidth = (text: string) => {
    if (!text) return 16; // 最小宽度
    
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // 中文字符、全角字符等使用16px宽度
      if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(char)) {
        width += 16;
      } else {
        // 英文字符使用10px宽度
        width += 10;
      }
    }
    
    // 为placeholder预留空间
    const placeholderWidth = 32; // "技能 1"的宽度
    return Math.max(width, placeholderWidth);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 开始提交个人资料...', formData);
    
    if (!user) {
      console.error('❌ 用户未登录');
      toast.error('用户未登录');
      return;
    }

    // 验证必填字段
    if (!formData.name.trim()) {
      console.error('❌ 缺少显示名称');
      toast.error('请输入显示名称');
      return;
    }

    if (!formData.jobType) {
      toast.error('请选择岗位类型');
      return;
    }

    if (!formData.experienceLevel) {
      toast.error('请选择经验水平');
      return;
    }

    if (!formData.targetCompany) {
      toast.error('请选择目标公司');
      return;
    }

    if (!formData.targetIndustry) {
      toast.error('请选择目标行业');
      return;
    }

    if (!formData.school?.trim()) {
      toast.error('请选择学校');
      return;
    }

    // 验证至少选择一种练习内容
    if (!formData.technicalInterview && !formData.behavioralInterview && !formData.caseAnalysis && !formData.statsQuestions) {
      toast.error('请至少选择一种期望练习内容');
      return;
    }

    // 验证一句话介绍必填
    if (!formData.bio?.trim()) {
      toast.error('请填写一句话介绍');
      return;
    }

    // 验证至少填写一种联系方式
    if (!formData.email?.trim() && !formData.wechat?.trim() && !formData.linkedin?.trim()) {
      toast.error('请至少填写一种联系方式');
      return;
    }

    // 验证技能输入：如果有技能输入框，必须全部填写
    const skills = formData.skills || [];
    if (skills.length > 0) {
      const hasEmptySkill = skills.some(skill => !skill.trim());
      if (hasEmptySkill) {
        toast.error('请填写完整的技能信息或删除空技能');
        return;
      }
    }

    setIsLoading(true);

    try {
      const submitData: ProfileFormData = {
        ...formData,
        targetCompany: formData.targetCompany || undefined,
        targetIndustry: formData.targetIndustry || undefined,
        experienceLevel: formData.experienceLevel || undefined,
        school: formData.school,
        skills: (formData.skills || []).filter(skill => skill.trim()).length > 0 
          ? (formData.skills || []).filter(skill => skill.trim()) 
          : undefined
      };
      
      console.log('🚀 准备调用updateProfile...');
      const result = await updateProfile(submitData);
      console.log('📊 updateProfile结果:', result);

      if (result.success) {
        console.log('✅ 资料保存成功');
        
        if (formData.name && formData.name !== session?.user?.name) {
          console.log('🔄 更新session名称...');
          await update({ name: formData.name });
        }
        
        if (fromMatches) {
          toast.success('资料完善成功！正在为您寻找最合适的练习伙伴...');
        } else {
          toast.success('资料保存成功，系统会为你推荐新的匹配对象');
        }
        
        console.log('🎯 准备跳转到匹配页面...');
        router.push('/matches');
        console.log('✅ 跳转命令已执行');
      } else {
        console.error('❌ 保存失败:', result.message);
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
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-screen items-start justify-center w-full pt-8">
        <Card className="w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10 mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-extrabold text-center tracking-tight text-gray-900 mb-1">个人资料</CardTitle>
            <p className="text-sm text-gray-500 text-center font-medium">
              请选择你现在最想练习的岗位，系统将为你匹配相同目标的练习伙伴
            </p>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            <form onSubmit={handleSubmit} className="space-y-3">
                              <div className="space-y-1">
                  <Label htmlFor="name">显示名称 <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入您的显示名称"
                  className="h-10"
                />
                <p className="text-sm text-gray-500">这是其他用户看到的您的名称</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="school">学校 <span className="text-red-500 ml-1">*</span></Label>
                {!profileLoading ? (
                  <SchoolAutocomplete
                    value={formData.school}
                    onChange={(value) => handleInputChange('school', value)}
                    placeholder="请输入学校名称"
                    className="h-10"
                  />
                ) : (
                  <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                    加载中...
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="jobType">岗位类型 <span className="text-red-500 ml-1">*</span></Label>
                  {!profileLoading ? (
                    <Select key={`jobType-${profile?.jobType || 'default'}`} value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="请选择岗位类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DA">数据分析 (DA)</SelectItem>
                        <SelectItem value="DS">数据科学 (DS)</SelectItem>
                        <SelectItem value="DE">数据工程 (DE)</SelectItem>
                        <SelectItem value="BA">商业分析 (BA)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      加载中...
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="experienceLevel">经验水平 <span className="text-red-500 ml-1">*</span></Label>
                  {!profileLoading ? (
                    <Select key={`experienceLevel-${profile?.experienceLevel || 'default'}`} value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="请选择经验水平" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="实习">实习</SelectItem>
                        <SelectItem value="应届">应届</SelectItem>
                        <SelectItem value="1-3年">1-3年</SelectItem>
                        <SelectItem value="3-5年">3-5年</SelectItem>
                        <SelectItem value="5年以上">5年以上</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      加载中...
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="targetCompany">目标公司 <span className="text-red-500 ml-1">*</span></Label>
                  {!profileLoading ? (
                    <CompanyAutocomplete
                      value={formData.targetCompany || ''}
                      onChange={(value) => handleInputChange('targetCompany', value)}
                      placeholder="请输入公司名称"
                      className="h-10"
                    />
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      加载中...
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="targetIndustry">目标行业 <span className="text-red-500 ml-1">*</span></Label>
                  {!profileLoading ? (
                    <Select key={`targetIndustry-${profile?.targetIndustry || 'default'}`} value={formData.targetIndustry} onValueChange={(value) => handleInputChange('targetIndustry', value)}>
                      <SelectTrigger className="h-10">
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
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      加载中...
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>期望练习内容 <span className="text-red-500 ml-1">*</span></Label>
                <div className="space-y-1">
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="statsQuestions"
                      checked={formData.statsQuestions || false}
                      onCheckedChange={(checked) => handleInputChange('statsQuestions', checked)}
                    />
                    <Label htmlFor="statsQuestions">统计题目</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>联系方式 (匹配成功后可见，推荐添加微信)</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="邮箱"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-10"
                  />
                  <Input
                    placeholder="微信"
                    value={formData.wechat}
                    onChange={(e) => handleInputChange('wechat', e.target.value)}
                    className="h-10"
                  />
                  <Input
                    placeholder="LinkedIn https://www.linkedin.com/in/your-profile"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>我的技能</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  {(formData.skills || []).map((skill, index) => (
                    <div key={index} className="relative inline-block">
                      <Input
                        value={skill}
                        onChange={(e) => handleSkillChange(index, e.target.value)}
                        placeholder={`技能 ${index + 1}`}
                        className="h-10 pr-8"
                        style={{ width: `${Math.max(80, Math.min(160, getTextWidth(skill) + 40))}px` }}
                        maxLength={10}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(index)}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                  {(formData.skills || []).length < 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={addSkill}
                      className="w-10 h-10 p-0 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md border-2 border-dashed border-blue-200 hover:border-blue-300 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500">💡 最多可添加3个技能，例如: A/B Testing, ML, Product..</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio">一句话介绍 <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="如：三年打工人，在美东时区，希望找到小姐妹一起练case～"
                  className="h-10"
                />
                <p className="text-sm text-gray-500">✍️ 写好您的介绍可以增加匹配成功率哦！</p>
              </div>

              <Button type="submit" className="w-full px-8 py-2 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600" disabled={isLoading}>
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