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
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const [language] = useAtom(languageAtom);

  const texts = useMemo(() => {
    if (language === 'en') {
      return {
        title: 'Profile',
        subtitle: 'Select the role you want to practice now. We’ll match partners with the same goals.',
        displayNameLabel: 'Display name',
        displayNamePlaceholder: 'Enter your display name',
        displayNameHelp: 'This is the name shown to other users',
        schoolLabel: 'School',
        schoolPlaceholder: 'Enter school name',
        loading: 'Loading...',
        jobTypeLabel: 'Job Type',
        jobTypePlaceholder: 'Select job type',
        jobTypeOptions: {
          DA: 'Data Analyst (DA)',
          DS: 'Data Scientist (DS)',
          DE: 'Data Engineer (DE)',
          BA: 'Business Analyst (BA)',
          MLE: 'Machine Learning Engineer (MLE)',
        } as Record<string, string>,
        experienceLevelLabel: 'Experience Level',
        experienceLevelPlaceholder: 'Select experience level',
        experienceLevels: ['Intern', 'Entry-level', '1-3 years', '3-5 years', '5+ years'],
        jobSeekingLabel: 'Job Search Status',
        jobSeekingPlaceholder: 'Select your job search status',
        jobSeekingOptions: {
          保持状态: '🌱 Keep warm - Maintain interview readiness',
          准备中: '🔍 Preparing - Actively getting ready',
          面试中: '🎯 Interviewing - Currently have interviews',
          已拿offer: '💼 Offer in hand - Keep improving',
        } as Record<string, string>,
        targetCompanyLabel: 'Target Company',
        targetCompanyPlaceholder: 'Enter company name',
        targetIndustryLabel: 'Target Industry',
        targetIndustryPlaceholder: 'Select target industry',
        practiceLabel: 'Desired Practice Topics',
        practiceOptions: {
          technical: 'Technical',
          behavioral: 'Behavioral',
          case: 'Case study',
          stats: 'Statistics',
        },
        contactLabel: 'Contact (visible after matching; WhatsApp/LinkedIn recommended)',
        emailPlaceholder: 'Email',
        wechatPlaceholder: 'WhatsApp',
        linkedinPlaceholder: 'LinkedIn https://www.linkedin.com/in/your-profile',
        skillsLabel: 'My Skills',
        skillsAddHint: 'Up to 3 skills, e.g., A/B Testing, ML, Product..',
        skillPlaceholderPrefix: 'Skill',
        bioLabel: 'Brief self-introduction',
        bioPlaceholder: 'e.g., 3 years DS, strong in Case, NYC timezone, free on weekday evenings.',
        bioHelp: 'Tip: Share status, strengths, timezone, availability to improve matching.',
        preferredLanguageLabel: 'Preferred Communication Language',
        preferredLanguagePlaceholder: 'Select communication language',
        preferredLanguageOptions: {
          '不限制': 'No preference',
          '中文': 'Chinese',
          '英文': 'English',
        } as Record<string, string>,
        submitting: 'Saving...',
        submit: 'Save profile',
        pageLoading: 'Loading...',
        industriesEn: {
          technology: 'Technology/Internet',
          finance: 'Finance/Banking',
          healthcare: 'Healthcare',
          retail: 'Retail/E-commerce',
          manufacturing: 'Manufacturing',
          education: 'Education',
          consulting: 'Consulting',
          media: 'Media/Entertainment',
          transportation: 'Transportation/Logistics',
          energy: 'Energy/Utilities',
          government: 'Government/Nonprofit',
          real_estate: 'Real Estate',
          agriculture: 'Agriculture',
          tourism: 'Travel/Hospitality',
          sports: 'Sports',
          other: 'Other',
        } as Record<string, string>,
      };
    }
    return {
      title: '个人资料',
      subtitle: '请选择你现在最想练习的岗位，系统将为你匹配相同目标的练习伙伴',
      displayNameLabel: '显示名称',
      displayNamePlaceholder: '请输入您的显示名称',
      displayNameHelp: '这是其他用户看到的您的名称',
      schoolLabel: '学校',
      schoolPlaceholder: '请输入学校名称',
      loading: '加载中...',
      jobTypeLabel: '岗位类型',
      jobTypePlaceholder: '请选择岗位类型',
      jobTypeOptions: {
        DA: '数据分析 (DA)',
        DS: '数据科学 (DS)',
        DE: '数据工程 (DE)',
        BA: '商业分析 (BA)',
        MLE: '机器学习工程师 (MLE)',
      } as Record<string, string>,
      experienceLevelLabel: '经验水平',
      experienceLevelPlaceholder: '请选择经验水平',
      experienceLevels: ['实习', '应届', '1-3年', '3-5年', '5年以上'],
      jobSeekingLabel: '求职状态',
      jobSeekingPlaceholder: '选择你的求职状态',
      jobSeekingOptions: {
        保持状态: '🌱 保持状态 - 想保持面试感觉',
        准备中: '🔍 准备中 - 正在积极准备',
        面试中: '🎯 面试中 - 已有面试机会',
        已拿offer: '💼 已拿offer - 继续提升能力',
      } as Record<string, string>,
      targetCompanyLabel: '目标公司',
      targetCompanyPlaceholder: '请输入公司名称',
      targetIndustryLabel: '目标行业',
      targetIndustryPlaceholder: '请选择目标行业',
      practiceLabel: '期望练习内容',
      practiceOptions: {
        technical: '技术面',
        behavioral: '行为面',
        case: '案例分析',
        stats: '统计题目',
      },
      contactLabel: '联系方式 (匹配成功后可见，推荐添加微信)',
      emailPlaceholder: '邮箱',
      wechatPlaceholder: '微信',
      linkedinPlaceholder: 'LinkedIn https://www.linkedin.com/in/your-profile',
      skillsLabel: '我的技能',
      skillsAddHint: '💡 最多可添加3个技能，例如: A/B Testing, ML, Product..',
      skillPlaceholderPrefix: '技能',
        bioLabel: '简单介绍一下自己',
        bioPlaceholder: '如：三年DS经验，擅长Case，坐标纽约，工作日晚上有空～',
        bioHelp: '💡 建议包含：目前状态、擅长技能、所在时区、可Mock时间段，让匹配更精准！',
        preferredLanguageLabel: '交流语言偏好',
        preferredLanguagePlaceholder: '请选择交流语言偏好',
        preferredLanguageOptions: {
          '不限制': '不限制',
          '中文': '中文',
          '英文': '英文',
        } as Record<string, string>,
        submitting: '保存中...',
        submit: '保存资料',
        pageLoading: '加载中...',
      industriesEn: {} as Record<string, string>, // not used in zh
    };
  }, [language]);

  const mapIndustryLabel = (value: string, defaultLabel: string) => {
    if (language === 'en') {
      return texts.industriesEn[value] || defaultLabel;
    }
    return defaultLabel;
  };
  
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
  const [userAchievement, setUserAchievement] = useState<any>(null);
  
  const [formData, setFormData] = useState<ProfileFormData & {name: string}>({
    name: '',
    jobType: 'DA',
    experienceLevel: '应届',
    jobSeekingStatus: undefined,
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
    preferredCommunicationLanguage: undefined,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }
  }, [status, router]);

  // 获取用户成就数据
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/achievements?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUserAchievement(data.achievement);
          }
        })
        .catch(error => {
          console.error('Error loading user achievement:', error);
        });
    }
  }, [user?.id]);

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
          jobSeekingStatus: undefined,
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
          preferredCommunicationLanguage: undefined,
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
        jobSeekingStatus: profile.jobSeekingStatus,
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
        preferredCommunicationLanguage: profile.preferredCommunicationLanguage || undefined,
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
    if (value.length > 20) return; // 限制每个技能不超过20个字符
    
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

  // 获取用户等级信息
  const getUserLevelInfo = () => {
    if (!userAchievement) {
      return { icon: '🌱', level: '新用户' };
    }

    const levelMap: Record<string, { icon: string }> = {
      '新用户': { icon: '🌱' },
      '面试新手': { icon: '⭐' },
      '面试新星': { icon: '🌟' },
      '面试达人': { icon: '🌙' },
      '面试导师': { icon: '👑' },
    };

    const levelInfo = levelMap[userAchievement.currentLevel] || levelMap['新用户'];
    return {
      ...levelInfo,
      level: userAchievement.currentLevel,
    };
  };

  const translateLevelLabel = (label: string) => {
    if (language !== 'en') return label;
    const map: Record<string, string> = {
      '新用户': 'Rookie',
      '面试新手': 'Interview Novice',
      '面试新星': 'Rising Star',
      '面试达人': 'Interview Pro',
      '面试导师': 'Interview Mentor',
    };
    return map[label] || label;
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

    // 验证个人介绍必填
    if (!formData.bio?.trim()) {
      toast.error('请填写个人介绍');
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
            {/* 响应式布局：移动端纵向，桌面端横向 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 mb-1">
              <CardTitle className="text-xl font-extrabold text-center tracking-tight text-gray-900">{texts.title}</CardTitle>
              {/* 显示用户等级徽章 */}
              {userAchievement && (
                <div className="flex items-center justify-center sm:justify-start gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200 shadow-sm mx-auto sm:mx-0 w-fit">
                  <span className="text-sm">{getUserLevelInfo().icon}</span>
                  <span className="text-[10px] font-semibold text-blue-700">{translateLevelLabel(getUserLevelInfo().level)}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 text-center font-medium">
              {texts.subtitle}
            </p>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            <form onSubmit={handleSubmit} className="space-y-3">
                              <div className="space-y-1">
                  <Label htmlFor="name">{texts.displayNameLabel} <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={texts.displayNamePlaceholder}
                  className="h-10"
                />
                <p className="text-sm text-gray-500">{texts.displayNameHelp}</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="school">{texts.schoolLabel} <span className="text-red-500 ml-1">*</span></Label>
                {!profileLoading ? (
                  <SchoolAutocomplete
                    value={formData.school}
                    onChange={(value) => handleInputChange('school', value)}
                    placeholder={texts.schoolPlaceholder}
                    className="h-10"
                  />
                ) : (
                  <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                    {texts.loading}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="jobType">{texts.jobTypeLabel} <span className="text-red-500 ml-1">*</span></Label>
                  {!profileLoading ? (
                    <Select key={`jobType-${profile?.jobType || 'default'}`} value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={texts.jobTypePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DA">{texts.jobTypeOptions['DA']}</SelectItem>
                        <SelectItem value="DS">{texts.jobTypeOptions['DS']}</SelectItem>
                        <SelectItem value="DE">{texts.jobTypeOptions['DE']}</SelectItem>
                        <SelectItem value="BA">{texts.jobTypeOptions['BA']}</SelectItem>
                        <SelectItem value="MLE">{texts.jobTypeOptions['MLE']}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      {texts.loading}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="experienceLevel">{texts.experienceLevelLabel} <span className="text-red-500 ml-1">*</span></Label>
                  {!profileLoading ? (
                    <Select key={`experienceLevel-${profile?.experienceLevel || 'default'}`} value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={texts.experienceLevelPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {language === 'en' ? (
                          <>
                            <SelectItem value="实习">{texts.experienceLevels[0]}</SelectItem>
                            <SelectItem value="应届">{texts.experienceLevels[1]}</SelectItem>
                            <SelectItem value="1-3年">{texts.experienceLevels[2]}</SelectItem>
                            <SelectItem value="3-5年">{texts.experienceLevels[3]}</SelectItem>
                            <SelectItem value="5年以上">{texts.experienceLevels[4]}</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="实习">实习</SelectItem>
                            <SelectItem value="应届">应届</SelectItem>
                            <SelectItem value="1-3年">1-3年</SelectItem>
                            <SelectItem value="3-5年">3-5年</SelectItem>
                            <SelectItem value="5年以上">5年以上</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      {texts.loading}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="jobSeekingStatus">{texts.jobSeekingLabel}</Label>
                  {!profileLoading ? (
                    <Select key={`jobSeekingStatus-${profile?.jobSeekingStatus || 'default'}`} value={formData.jobSeekingStatus || ''} onValueChange={(value) => handleInputChange('jobSeekingStatus', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={texts.jobSeekingPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="保持状态">{texts.jobSeekingOptions['保持状态']}</SelectItem>
                        <SelectItem value="准备中">{texts.jobSeekingOptions['准备中']}</SelectItem>
                        <SelectItem value="面试中">{texts.jobSeekingOptions['面试中']}</SelectItem>
                        <SelectItem value="已拿offer">{texts.jobSeekingOptions['已拿offer']}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      {texts.loading}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="preferredCommunicationLanguage">{texts.preferredLanguageLabel}</Label>
                  {!profileLoading ? (
                    <Select key={`preferredCommunicationLanguage-${profile?.preferredCommunicationLanguage || 'default'}`} value={formData.preferredCommunicationLanguage || ''} onValueChange={(value) => handleInputChange('preferredCommunicationLanguage', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={texts.preferredLanguagePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="不限制">{texts.preferredLanguageOptions['不限制']}</SelectItem>
                        <SelectItem value="中文">{texts.preferredLanguageOptions['中文']}</SelectItem>
                        <SelectItem value="英文">{texts.preferredLanguageOptions['英文']}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      {texts.loading}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="targetCompany">{texts.targetCompanyLabel} <span className="text-red-500 ml-1">*</span></Label>
                  {!profileLoading ? (
                    <CompanyAutocomplete
                      value={formData.targetCompany || ''}
                      onChange={(value) => handleInputChange('targetCompany', value)}
                      placeholder={texts.targetCompanyPlaceholder}
                      className="h-10"
                    />
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      {texts.loading}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="targetIndustry">{texts.targetIndustryLabel} <span className="text-red-500 ml-1">*</span></Label>
                  {!profileLoading ? (
                    <Select key={`targetIndustry-${profile?.targetIndustry || 'default'}`} value={formData.targetIndustry} onValueChange={(value) => handleInputChange('targetIndustry', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={texts.targetIndustryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_INDUSTRIES.map((industry) => {
                          const label = mapIndustryLabel(industry.value, industry.label);
                          return (
                            <SelectItem key={industry.value} value={industry.value}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-gray-500 text-sm">
                      {texts.loading}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{texts.practiceLabel} <span className="text-red-500 ml-1">*</span></Label>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="technicalInterview"
                      checked={formData.technicalInterview}
                      onCheckedChange={(checked) => handleInputChange('technicalInterview', checked)}
                    />
                    <Label htmlFor="technicalInterview">{texts.practiceOptions.technical}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="behavioralInterview"
                      checked={formData.behavioralInterview}
                      onCheckedChange={(checked) => handleInputChange('behavioralInterview', checked)}
                    />
                    <Label htmlFor="behavioralInterview">{texts.practiceOptions.behavioral}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="caseAnalysis"
                      checked={formData.caseAnalysis}
                      onCheckedChange={(checked) => handleInputChange('caseAnalysis', checked)}
                    />
                    <Label htmlFor="caseAnalysis">{texts.practiceOptions.case}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="statsQuestions"
                      checked={formData.statsQuestions || false}
                      onCheckedChange={(checked) => handleInputChange('statsQuestions', checked)}
                    />
                    <Label htmlFor="statsQuestions">{texts.practiceOptions.stats}</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{texts.contactLabel}</Label>
                <div className="space-y-2">
                  <Input
                    placeholder={texts.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-10"
                  />
                  {language === 'en' ? (
                    <>
                      <Input
                        placeholder={texts.linkedinPlaceholder}
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="h-10"
                      />
                      <Input
                        placeholder={texts.wechatPlaceholder}
                        value={formData.wechat}
                        onChange={(e) => handleInputChange('wechat', e.target.value)}
                        className="h-10"
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        placeholder={texts.wechatPlaceholder}
                        value={formData.wechat}
                        onChange={(e) => handleInputChange('wechat', e.target.value)}
                        className="h-10"
                      />
                      <Input
                        placeholder={texts.linkedinPlaceholder}
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="h-10"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{texts.skillsLabel}</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  {(formData.skills || []).map((skill, index) => (
                    <div key={index} className="relative inline-block">
                      <Input
                        value={skill}
                        onChange={(e) => handleSkillChange(index, e.target.value)}
                        placeholder={`${texts.skillPlaceholderPrefix} ${index + 1}`}
                        className="h-10 pr-8"
                        style={{ width: `${Math.max(80, Math.min(200, getTextWidth(skill) + 40))}px` }}
                        maxLength={20}
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
                <p className="text-sm text-gray-500">{texts.skillsAddHint}</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio">{texts.bioLabel} <span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder={texts.bioPlaceholder}
                  className="h-10"
                />
                <p className="text-sm text-gray-500">{texts.bioHelp}</p>
              </div>

              <Button type="submit" className="w-full px-8 py-2 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600" disabled={isLoading}>
                {isLoading ? texts.submitting : texts.submit}
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