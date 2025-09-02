'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { saveProfile, getProfile } from '@/app/actions/profile';
import { ProfileFormData } from '@/lib/profile';
import { TARGET_COMPANIES, TARGET_INDUSTRIES } from '@/lib/constants';

// Zod schema for form validation
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "显示名称至少需要2个字符"
  }),
  jobType: z.enum(['DA', 'DS', 'DE', 'BA'], {
    required_error: "请选择岗位类型"
  }),
  experienceLevel: z.enum(['应届', '1-3年', '3-5年', '5年以上'], {
    required_error: "请选择经验等级"
  }),
  targetCompany: z.string().optional(),
  targetIndustry: z.string().optional(),
  otherCompanyName: z.string().optional(),
  technicalInterview: z.boolean().default(false),
  behavioralInterview: z.boolean().default(false),
  caseAnalysis: z.boolean().default(false),
  email: z.string().email({ message: "请输入有效的邮箱地址" }).optional().or(z.literal('')),
  wechat: z.string().optional(),
  linkedin: z.string().url({ message: "请输入有效的LinkedIn链接" }).optional().or(z.literal('')),
  bio: z.string().optional()
}).refine((data) => {
  // 至少选择一种练习内容
  return data.technicalInterview || data.behavioralInterview || data.caseAnalysis;
}, {
  message: "请至少选择一种面试练习内容",
  path: ["practiceContent"]
}).refine((data) => {
  // 至少填写一个联系方式
  const hasEmail = data.email && data.email.trim() !== '';
  const hasWechat = data.wechat && data.wechat.trim() !== '';
  const hasLinkedin = data.linkedin && data.linkedin.trim() !== '';
  return hasEmail || hasWechat || hasLinkedin;
}, {
  message: "请至少填写一个联系方式（推荐添加微信）",
  path: ["contactInfo"]
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showOtherCompanyInput, setShowOtherCompanyInput] = useState(false);
  
  // React Hook Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      jobType: undefined,
      experienceLevel: undefined,
      targetCompany: undefined,
      targetIndustry: undefined,
      otherCompanyName: '',
      technicalInterview: false,
      behavioralInterview: false,
      caseAnalysis: false,
      email: '',
      wechat: '',
      linkedin: '',
      bio: ''
    }
  });

  // Fetch existing profile if available
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }
    if (user && user.id > 0) {
      fetchProfile();
    }
  }, [user?.id, status]); // 只依赖user.id和status

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const result = await getProfile(user.id);
      if (result.success && 'profile' in result && result.profile) {
        // Update form data with existing profile
        form.reset({
          name: result.profile.name || session?.user?.name || '',
          jobType: result.profile.jobType,
          experienceLevel: result.profile.experienceLevel,
          targetCompany: result.profile.targetCompany || undefined,
          targetIndustry: result.profile.targetIndustry || undefined,
          otherCompanyName: result.profile.otherCompanyName || '',
          technicalInterview: result.profile.technicalInterview || false,
          behavioralInterview: result.profile.behavioralInterview || false,
          caseAnalysis: result.profile.caseAnalysis || false,
          email: result.profile.email || '',
          wechat: result.profile.wechat || '',
          linkedin: result.profile.linkedin || '',
          bio: result.profile.bio || '',
        });
        
        // Check if target company is "other" and show input
        if (result.profile.targetCompany === 'other') {
          setShowOtherCompanyInput(true);
        }
      } else {
        // No existing profile, just initialize with user name
        form.reset({
          name: session?.user?.name || '',
          jobType: undefined,
          experienceLevel: undefined,
          targetCompany: undefined,
          targetIndustry: undefined,
          otherCompanyName: '',
          technicalInterview: false,
          behavioralInterview: false,
          caseAnalysis: false,
          email: '',
          wechat: '',
          linkedin: '',
          bio: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('获取资料失败，请稍后再试');
      // Still initialize name even if profile fetch fails
      form.reset({
        name: session?.user?.name || '',
        jobType: undefined,
        experienceLevel: undefined,
        targetCompany: undefined,
        targetIndustry: undefined,
        otherCompanyName: '',
        technicalInterview: false,
        behavioralInterview: false,
        caseAnalysis: false,
        email: '',
        wechat: '',
        linkedin: '',
        bio: ''
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Watch targetCompany to show/hide other company input
  const targetCompany = form.watch('targetCompany');
  
  React.useEffect(() => {
    if (targetCompany === 'other') {
      setShowOtherCompanyInput(true);
    } else {
      setShowOtherCompanyInput(false);
      form.setValue('otherCompanyName', '');
    }
  }, [targetCompany, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);

    if (!user) {
      toast.error('用户未登录');
      setIsLoading(false);
      return;
    }

    try {
      // 准备提交数据
      const submitData: ProfileFormData = {
        ...values,
        // 如果选择了"其他"公司，使用otherCompanyName
        otherCompanyName: values.targetCompany === 'other' ? values.otherCompanyName : undefined
      };
      
      const result = await saveProfile(user.id, submitData);

      if (result.success) {
        // 如果更新了名称，需要更新session
        if (values.name && values.name !== session?.user?.name) {
          await update({ name: values.name });
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
            {isFetching ? (
              <div className="text-center py-4">加载中...</div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* 用户名字段 */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>显示名称 <span className="text-red-500 ml-1">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="请输入您的显示名称" {...field} />
                        </FormControl>
                        <FormDescription>
                          这是其他用户看到的您的名称
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jobType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>岗位类型 <span className="text-red-500 ml-1">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择岗位类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DA">数据分析 (DA)</SelectItem>
                            <SelectItem value="DS">数据科学 (DS)</SelectItem>
                            <SelectItem value="DE">数据工程 (DE)</SelectItem>
                            <SelectItem value="BA">商业分析 (BA)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>经验水平 <span className="text-red-500 ml-1">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择经验水平" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="应届">应届</SelectItem>
                            <SelectItem value="1-3年">1-3年</SelectItem>
                            <SelectItem value="3-5年">3-5年</SelectItem>
                            <SelectItem value="5年以上">5年以上</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>目标公司 <span className="text-red-500 ml-1">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择目标公司" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TARGET_COMPANIES.map((company) => (
                              <SelectItem key={company.value} value={company.value}>
                                {company.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                        {showOtherCompanyInput && (
                          <FormField
                            control={form.control}
                            name="otherCompanyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="请输入目标公司名称"
                                    className="mt-2"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetIndustry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>目标行业 <span className="text-red-500 ml-1">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择目标行业" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TARGET_INDUSTRIES.map((industry) => (
                              <SelectItem key={industry.value} value={industry.value}>
                                {industry.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label>期望练习内容 <span className="text-red-500 ml-1">*</span></Label>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="technicalInterview"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>技术面</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="behavioralInterview"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>行为面</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="caseAnalysis"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>案例分析</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage />
                </div>

                <div className="space-y-2">
                  <Label>联系方式 (匹配成功后可见，推荐添加微信)</Label>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="邮箱" {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="wechat"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="微信" {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="LinkedIn https://www.linkedin.com/in/your-profile" {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>一句话介绍（可选，能提升曝光和匹配度哦～）</FormLabel>
                      <FormControl>
                        <Input placeholder="如：三年打工人，在美东时区，希望找到小姐妹一起练case～" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600" disabled={isLoading}>
                  {isLoading ? '保存中...' : '保存资料'}
                </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
} 