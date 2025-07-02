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

    // 联系方式校验
    if (!formData.email && !formData.wechat && !formData.linkedin) {
      toast.error('请至少填写一个联系方式（推荐添加微信）');
      setIsLoading(false);
      return;
    }

    try {
      const result = await saveProfile(user.id, formData);

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
      {/* 全屏背景渐变 */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-screen items-center justify-center w-full">
        <Card className="w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold text-center tracking-tight text-gray-900 mb-2">个人资料</CardTitle>
            <p className="text-base text-gray-500 text-center font-medium">完善资料，获得更精准的匹配推荐</p>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <div className="text-center py-4">加载中...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobType">岗位类型 (必选)</Label>
                    <select
                      id="jobType"
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      required
                    >
                      <option value="DA">数据分析 (DA)</option>
                      <option value="DS">数据科学 (DS)</option>
                      <option value="DE">数据工程 (DE)</option>
                      <option value="BA">商业分析 (BA)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">经验水平 (必选)</Label>
                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      required
                    >
                      <option value="应届">应届</option>
                      <option value="1-3年">1-3年</option>
                      <option value="3-5年">3-5年</option>
                      <option value="5年以上">5年以上</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetCompany">目标公司 (可选)</Label>
                    <Input
                      id="targetCompany"
                      name="targetCompany"
                      value={formData.targetCompany}
                      onChange={handleChange}
                      placeholder="如：字节跳动、阿里巴巴"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetIndustry">目标行业 (可选)</Label>
                    <Input
                      id="targetIndustry"
                      name="targetIndustry"
                      value={formData.targetIndustry}
                      onChange={handleChange}
                      placeholder="如：互联网、金融"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>期望练习内容 (必选至少一项)</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="technicalInterview"
                        checked={formData.technicalInterview}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('technicalInterview', checked as boolean)
                        }
                      />
                      <Label htmlFor="technicalInterview">技术面</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="behavioralInterview"
                        checked={formData.behavioralInterview}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('behavioralInterview', checked as boolean)
                        }
                      />
                      <Label htmlFor="behavioralInterview">行为面</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="caseAnalysis"
                        checked={formData.caseAnalysis}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('caseAnalysis', checked as boolean)
                        }
                      />
                      <Label htmlFor="caseAnalysis">案例分析</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>联系方式 (匹配成功后可见，推荐添加微信)</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="邮箱"
                  />
                  <Input
                    id="wechat"
                    name="wechat"
                    value={formData.wechat}
                    onChange={handleChange}
                    placeholder="微信"
                  />
                  <Input
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn https://www.linkedin.com/in/your-profile"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">一句话介绍（可选，能提升曝光和匹配度哦～）</Label>
                  <Input
                    id="bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    placeholder="如：三年打工人，在美东时区，希望找到小姐妹一起练case～"
                  />
                </div>

                <Button type="submit" className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600" disabled={isLoading}>
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