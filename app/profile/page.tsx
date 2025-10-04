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

  const { profile, isLoading: profileLoading, updateProfile } = useProfile(user?.id);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherCompanyInput, setShowOtherCompanyInput] = useState(false);
  const [otherCompanyName, setOtherCompanyName] = useState('');
  const [customSchoolName, setCustomSchoolName] = useState('');
  
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
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (profile) {
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
        school: profile.school || '',
      };
      setFormData(newFormData);
      
      if (profile.targetCompany === 'other') {
        setShowOtherCompanyInput(true);
        setOtherCompanyName(profile.otherCompanyName || '');
      }
    } else if (session?.user?.name) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('用户未登录');
      return;
    }

    // 验证必填字段
    if (!formData.name.trim()) {
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

    if (formData.targetCompany === 'other' && !otherCompanyName.trim()) {
      toast.error('请输入目标公司名称');
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

    setIsLoading(true);

    try {
      const submitData: ProfileFormData = {
        ...formData,
        targetCompany: formData.targetCompany || undefined,
        targetIndustry: formData.targetIndustry || undefined,
        experienceLevel: formData.experienceLevel || undefined,
        otherCompanyName: formData.targetCompany === 'other' ? otherCompanyName : undefined,
        school: (formData.school === 'custom' || formData.school === 'other') ? customSchoolName : formData.school
      };
      
      const result = await updateProfile(submitData);

      if (result.success) {
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
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-screen items-start justify-center w-full pt-8">
        <Card className="w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10 mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-extrabold text-center tracking-tight text-gray-900 mb-1">个人资料</CardTitle>
            <p className="text-sm text-gray-500 text-center font-medium">完善资料，获得更精准的匹配推荐</p>
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
                <Select value={formData.school} onValueChange={(value) => handleInputChange('school', value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="请选择学校" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">自定义填写</SelectItem>
                    <SelectItem value="stanford">Stanford University</SelectItem>
                    <SelectItem value="mit">MIT</SelectItem>
                    <SelectItem value="harvard">Harvard University</SelectItem>
                    <SelectItem value="cmu">Carnegie Mellon University</SelectItem>
                    <SelectItem value="berkeley">UC Berkeley</SelectItem>
                    <SelectItem value="caltech">Caltech</SelectItem>
                    <SelectItem value="princeton">Princeton University</SelectItem>
                    <SelectItem value="yale">Yale University</SelectItem>
                    <SelectItem value="columbia">Columbia University</SelectItem>
                    <SelectItem value="upenn">University of Pennsylvania</SelectItem>
                    <SelectItem value="cornell">Cornell University</SelectItem>
                    <SelectItem value="brown">Brown University</SelectItem>
                    <SelectItem value="dartmouth">Dartmouth College</SelectItem>
                    <SelectItem value="duke">Duke University</SelectItem>
                    <SelectItem value="northwestern">Northwestern University</SelectItem>
                    <SelectItem value="jhu">Johns Hopkins University</SelectItem>
                    <SelectItem value="rice">Rice University</SelectItem>
                    <SelectItem value="vanderbilt">Vanderbilt University</SelectItem>
                    <SelectItem value="washu">Washington University in St. Louis</SelectItem>
                    <SelectItem value="emory">Emory University</SelectItem>
                    <SelectItem value="georgetown">Georgetown University</SelectItem>
                    <SelectItem value="nyu">New York University</SelectItem>
                    <SelectItem value="usc">University of Southern California</SelectItem>
                    <SelectItem value="ucla">UCLA</SelectItem>
                    <SelectItem value="ucsd">UC San Diego</SelectItem>
                    <SelectItem value="uci">UC Irvine</SelectItem>
                    <SelectItem value="ucsb">UC Santa Barbara</SelectItem>
                    <SelectItem value="ucdavis">UC Davis</SelectItem>
                    <SelectItem value="ucsc">UC Santa Cruz</SelectItem>
                    <SelectItem value="ucriverside">UC Riverside</SelectItem>
                    <SelectItem value="ucmerced">UC Merced</SelectItem>
                    <SelectItem value="gatech">Georgia Institute of Technology</SelectItem>
                    <SelectItem value="uiuc">University of Illinois Urbana-Champaign</SelectItem>
                    <SelectItem value="umich">University of Michigan</SelectItem>
                    <SelectItem value="uwmadison">University of Wisconsin-Madison</SelectItem>
                    <SelectItem value="purdue">Purdue University</SelectItem>
                    <SelectItem value="osu_ohio">Ohio State University</SelectItem>
                    <SelectItem value="psu">Penn State University</SelectItem>
                    <SelectItem value="rutgers">Rutgers University</SelectItem>
                    <SelectItem value="buffalo">SUNY Buffalo</SelectItem>
                    <SelectItem value="stonybrook">SUNY Stony Brook</SelectItem>
                    <SelectItem value="binghamton">SUNY Binghamton</SelectItem>
                    <SelectItem value="albany">SUNY Albany</SelectItem>
                    <SelectItem value="arizona">University of Arizona</SelectItem>
                    <SelectItem value="asu">Arizona State University</SelectItem>
                    <SelectItem value="ut">University of Texas at Austin</SelectItem>
                    <SelectItem value="tamu">Texas A&M University</SelectItem>
                    <SelectItem value="baylor">Baylor University</SelectItem>
                    <SelectItem value="tcu">Texas Christian University</SelectItem>
                    <SelectItem value="smu">Southern Methodist University</SelectItem>
                    <SelectItem value="utd">University of Texas at Dallas</SelectItem>
                    <SelectItem value="utah">University of Utah</SelectItem>
                    <SelectItem value="byu">Brigham Young University</SelectItem>
                    <SelectItem value="colorado">University of Colorado Boulder</SelectItem>
                    <SelectItem value="colorado_state">Colorado State University</SelectItem>
                    <SelectItem value="denver">University of Denver</SelectItem>
                    <SelectItem value="oregon">University of Oregon</SelectItem>
                    <SelectItem value="osu_oregon">Oregon State University</SelectItem>
                    <SelectItem value="washington">University of Washington</SelectItem>
                    <SelectItem value="wsu">Washington State University</SelectItem>
                    <SelectItem value="alaska">University of Alaska</SelectItem>
                    <SelectItem value="hawaii">University of Hawaii</SelectItem>
                    <SelectItem value="minnesota">University of Minnesota</SelectItem>
                    <SelectItem value="iowa">University of Iowa</SelectItem>
                    <SelectItem value="iowa_state">Iowa State University</SelectItem>
                    <SelectItem value="nebraska">University of Nebraska</SelectItem>
                    <SelectItem value="kansas">University of Kansas</SelectItem>
                    <SelectItem value="kansas_state">Kansas State University</SelectItem>
                    <SelectItem value="missouri">University of Missouri</SelectItem>
                    <SelectItem value="arkansas">University of Arkansas</SelectItem>
                    <SelectItem value="oklahoma">University of Oklahoma</SelectItem>
                    <SelectItem value="oklahoma_state">Oklahoma State University</SelectItem>
                    <SelectItem value="lsu">Louisiana State University</SelectItem>
                    <SelectItem value="tulane">Tulane University</SelectItem>
                    <SelectItem value="ole_miss">University of Mississippi</SelectItem>
                    <SelectItem value="mississippi_state">Mississippi State University</SelectItem>
                    <SelectItem value="alabama">University of Alabama</SelectItem>
                    <SelectItem value="auburn">Auburn University</SelectItem>
                    <SelectItem value="uab">University of Alabama at Birmingham</SelectItem>
                    <SelectItem value="uga">University of Georgia</SelectItem>
                    <SelectItem value="georgia_tech">Georgia Institute of Technology</SelectItem>
                    <SelectItem value="fsu">Florida State University</SelectItem>
                    <SelectItem value="uf">University of Florida</SelectItem>
                    <SelectItem value="umiami">University of Miami</SelectItem>
                    <SelectItem value="usf">University of South Florida</SelectItem>
                    <SelectItem value="ucf">University of Central Florida</SelectItem>
                    <SelectItem value="fau">Florida Atlantic University</SelectItem>
                    <SelectItem value="fiu">Florida International University</SelectItem>
                    <SelectItem value="nova">Nova Southeastern University</SelectItem>
                    <SelectItem value="other">其他美国大学</SelectItem>
                  </SelectContent>
                </Select>
                {formData.school === 'custom' && (
                  <Input
                    placeholder="请输入学校名称"
                    value={customSchoolName}
                    onChange={(e) => setCustomSchoolName(e.target.value)}
                    className="mt-2 h-10"
                  />
                )}
                {formData.school === 'other' && (
                  <Input
                    placeholder="请输入其他美国大学名称"
                    value={customSchoolName}
                    onChange={(e) => setCustomSchoolName(e.target.value)}
                    className="mt-2 h-10"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="jobType">岗位类型 <span className="text-red-500 ml-1">*</span></Label>
                  {profile ? (
                    <Select key="jobType" value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
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
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
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
                    <Select key={`targetCompany-${profile?.targetCompany || 'default'}`} value={formData.targetCompany} onValueChange={(value) => {
                      handleInputChange('targetCompany', value);
                      setShowOtherCompanyInput(value === 'other');
                    }}>
                      <SelectTrigger className="h-10">
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
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      加载中...
                    </div>
                  )}
                  {showOtherCompanyInput && (
                    <Input
                      placeholder="请输入目标公司名称"
                      value={otherCompanyName}
                      onChange={(e) => setOtherCompanyName(e.target.value)}
                      className="mt-2 h-10"
                    />
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