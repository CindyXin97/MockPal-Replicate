'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { userAtom } from '@/lib/store';
import { AuthLayout } from '@/components/auth-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { saveProfile, getProfile } from '@/app/actions/profile';
import { ProfileFormData } from '@/lib/profile';
import { COMPANY_OPTIONS, INDUSTRY_OPTIONS } from '@/lib/profile';

export default function ProfilePage() {
  const router = useRouter();
  const [user] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
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

  // Fetch existing profile if available
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const result = await getProfile(user.id);
      if (result.success && 'profile' in result && result.profile) {
        // Update form data with existing profile
        setFormData({
          jobType: result.profile.jobType as any,
          experienceLevel: result.profile.experienceLevel as any,
          targetCompany: result.profile.targetCompany || '',
          targetIndustry: result.profile.targetIndustry || '',
          technicalInterview: result.profile.technicalInterview || false,
          behavioralInterview: result.profile.behavioralInterview || false,
          caseAnalysis: result.profile.caseAnalysis || false,
          email: result.profile.email || '',
          wechat: result.profile.wechat || '',
          linkedin: result.profile.linkedin || '',
          bio: result.profile.bio || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('获取资料失败，请稍后再试');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData({
      ...formData,
      [field]: checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast.error('用户未登录');
      return;
    }

    // 处理"其他"选项的输入值
    const formDataToSubmit = { ...formData };
    const form = e.currentTarget;
    
    if (formData.targetCompany === '其他') {
      const otherCompany = (form.querySelector('#targetCompanyOther') as HTMLInputElement)?.value;
      if (!otherCompany?.trim()) {
        toast.error('请填写目标公司名称');
        setIsLoading(false);
        return;
      }
      formDataToSubmit.targetCompany = otherCompany;
    }
    
    if (formData.targetIndustry === '其他') {
      const otherIndustry = (form.querySelector('#targetIndustryOther') as HTMLInputElement)?.value;
      if (!otherIndustry?.trim()) {
        toast.error('请填写目标行业名称');
        setIsLoading(false);
        return;
      }
      formDataToSubmit.targetIndustry = otherIndustry;
    }

    // 联系方式校验
    if (!formDataToSubmit.email && !formDataToSubmit.wechat && !formDataToSubmit.linkedin) {
      toast.error('请至少填写一个联系方式（推荐添加微信）');
      setIsLoading(false);
      return;
    }

    try {
      const result = await saveProfile(user.id, formDataToSubmit);

      if (result.success) {
        toast.success('资料保存成功，系统会为你推荐新的匹配对象');
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
      {/* Happy Hues inspired gradient background */}
      <div className="fixed inset-0 hue-gradient-bg -z-10" aria-hidden="true"></div>
      
      <div className="hue-container flex min-h-screen items-center justify-center py-8">
        <Card className="hue-card w-full max-w-2xl rounded-3xl shadow-2xl border-0 relative z-10">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#fbdd74] to-[#f7d25c] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">👤</span>
            </div>
            <CardTitle className="hue-heading-2 mb-2">个人资料</CardTitle>
            <p className="hue-text-body">完善资料，获得更精准的匹配推荐</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isFetching ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 mx-auto border-4 border-[#ff6e6c] border-t-transparent rounded-full animate-spin"></div>
                <p className="hue-text-body mt-4">加载中...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="hue-grid-cards">
                  <div className="space-y-2">
                    <Label htmlFor="jobType" className="hue-text-secondary font-medium">岗位类型 (必选)</Label>
                    <select
                      id="jobType"
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className="hue-select"
                      required
                    >
                      <option value="DA">数据分析 (DA)</option>
                      <option value="DS">数据科学 (DS)</option>
                      <option value="DE">数据工程 (DE)</option>
                      <option value="BA">商业分析 (BA)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel" className="hue-text-secondary font-medium">经验水平 (必选)</Label>
                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      className="hue-select"
                      required
                    >
                      <option value="应届">应届</option>
                      <option value="1-3年">1-3年</option>
                      <option value="3-5年">3-5年</option>
                      <option value="5年以上">5年以上</option>
                    </select>
                  </div>
                </div>

                <div className="hue-grid-cards">
                  <div className="space-y-2">
                    <Label htmlFor="targetCompany" className="hue-text-secondary font-medium">目标公司 (必选)</Label>
                    <select
                      id="targetCompany"
                      name="targetCompany"
                      value={formData.targetCompany}
                      onChange={handleChange}
                      className="hue-select"
                      required
                    >
                      <option value="">请选择目标公司</option>
                      {COMPANY_OPTIONS.map((company) => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                    {formData.targetCompany === '其他' && (
                      <Input
                        id="targetCompanyOther"
                        name="targetCompanyOther"
                        placeholder="请输入目标公司名称"
                        className="hue-input mt-2"
                        required
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetIndustry" className="hue-text-secondary font-medium">目标行业 (必选)</Label>
                    <select
                      id="targetIndustry"
                      name="targetIndustry"
                      value={formData.targetIndustry}
                      onChange={handleChange}
                      className="hue-select"
                      required
                    >
                      <option value="">请选择目标行业</option>
                      {INDUSTRY_OPTIONS.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                    {formData.targetIndustry === '其他' && (
                      <Input
                        id="targetIndustryOther"
                        name="targetIndustryOther"
                        placeholder="请输入目标行业名称"
                        className="hue-input mt-2"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="hue-text-secondary font-medium">期望练习内容 (必选至少一项)</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-[#f4effc] rounded-lg hover:bg-[#e2daeb] transition-colors">
                      <Checkbox
                        id="technicalInterview"
                        checked={formData.technicalInterview}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('technicalInterview', checked as boolean)
                        }
                        className="text-[#ff6e6c]"
                      />
                      <Label htmlFor="technicalInterview" className="hue-text-body cursor-pointer">技术面</Label>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#f4effc] rounded-lg hover:bg-[#e2daeb] transition-colors">
                      <Checkbox
                        id="behavioralInterview"
                        checked={formData.behavioralInterview}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('behavioralInterview', checked as boolean)
                        }
                        className="text-[#ff6e6c]"
                      />
                      <Label htmlFor="behavioralInterview" className="hue-text-body cursor-pointer">行为面</Label>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#f4effc] rounded-lg hover:bg-[#e2daeb] transition-colors">
                      <Checkbox
                        id="caseAnalysis"
                        checked={formData.caseAnalysis}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('caseAnalysis', checked as boolean)
                        }
                        className="text-[#ff6e6c]"
                      />
                      <Label htmlFor="caseAnalysis" className="hue-text-body cursor-pointer">案例分析</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="hue-text-secondary font-medium">联系方式 (匹配成功后可见，推荐添加微信)</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="邮箱"
                    className="hue-input"
                  />
                  <Input
                    id="wechat"
                    name="wechat"
                    value={formData.wechat}
                    onChange={handleChange}
                    placeholder="微信"
                    className="hue-input"
                  />
                  <Input
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn https://www.linkedin.com/in/your-profile"
                    className="hue-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="hue-text-secondary font-medium">一句话介绍（可选，能提升曝光和匹配度哦～）</Label>
                  <Input
                    id="bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    placeholder="如：三年打工人，在美东时区，希望找到小姐妹一起练case～"
                    className="hue-input"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="hue-button-primary w-full py-3 text-lg font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? '保存中...' : '保存资料'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
} 