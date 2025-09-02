import { getUserProfile } from '@/lib/profile';

// 定义资料完整性标准
export interface ProfileCompletenessCheck {
  isComplete: boolean;
  missingFields: string[];
}

/**
 * 检查用户资料完整性
 * @param userId 用户ID
 * @returns Promise<ProfileCompletenessCheck>
 */
export const checkUserProfileCompleteness = async (userId: number): Promise<ProfileCompletenessCheck> => {
  try {
    const result = await getUserProfile(userId);
    
    if (!result.success || !result.profile) {
      return {
        isComplete: false,
        missingFields: ['profile']
      };
    }

    const profile = result.profile;
    const missingFields: string[] = [];

    // 检查必填字段
    if (!profile.name || profile.name.trim() === '') {
      missingFields.push('name');
    }
    
    if (!profile.jobType) {
      missingFields.push('jobType');
    }
    
    if (!profile.experienceLevel) {
      missingFields.push('experienceLevel');
    }
    
    if (!profile.targetCompany) {
      missingFields.push('targetCompany');
    }
    
    if (!profile.targetIndustry) {
      missingFields.push('targetIndustry');
    }

    // 至少选择一种练习内容
    const hasPracticeContent = profile.technicalInterview || 
                               profile.behavioralInterview || 
                               profile.caseAnalysis;
    if (!hasPracticeContent) {
      missingFields.push('practiceContent');
    }

    // 至少填写一个联系方式
    const hasContactInfo = (profile.email && profile.email.trim() !== '') ||
                          (profile.wechat && profile.wechat.trim() !== '') ||
                          (profile.linkedin && profile.linkedin.trim() !== '');
    if (!hasContactInfo) {
      missingFields.push('contactInfo');
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  } catch (error) {
    console.error('Error checking profile completeness:', error);
    return {
      isComplete: false,
      missingFields: ['error']
    };
  }
};

/**
 * 获取资料完整性提示文本
 * @param missingFields 缺失的字段
 * @returns 提示文本
 */
export const getProfileCompletenessMessage = (missingFields: string[]): string => {
  const fieldMessages: { [key: string]: string } = {
    'name': '显示名称',
    'jobType': '岗位类型',
    'experienceLevel': '经验水平', 
    'targetCompany': '目标公司',
    'targetIndustry': '目标行业',
    'practiceContent': '练习内容',
    'contactInfo': '联系方式',
    'profile': '个人资料'
  };

  if (missingFields.length === 0) {
    return '资料已完整';
  }

  const missingFieldNames = missingFields
    .map(field => fieldMessages[field] || field)
    .join('、');

  return `还需完善：${missingFieldNames}`;
};