import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Profile type for form submission
export type ProfileFormData = {
  jobType: 'DA' | 'DS' | 'DE' | 'BA';
  experienceLevel: '应届' | '1-3年' | '3-5年' | '5年以上';
  targetCompany?: string;
  targetIndustry?: string;
  technicalInterview: boolean;
  behavioralInterview: boolean;
  caseAnalysis: boolean;
  email?: string;
  wechat?: string;
  linkedin?: string;
  bio?: string;
};

type GetProfileResult =
  | { success: true; profile: any }
  | { success: false; message: string };

// Create or update user profile
export async function saveUserProfile(userId: number, profileData: ProfileFormData) {
  try {
    // Check if profile already exists
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (existingProfile) {
      // 只更新资料
      await db
        .update(userProfiles)
        .set({
          jobType: profileData.jobType,
          experienceLevel: profileData.experienceLevel,
          targetCompany: profileData.targetCompany || null,
          targetIndustry: profileData.targetIndustry || null,
          technicalInterview: profileData.technicalInterview,
          behavioralInterview: profileData.behavioralInterview,
          caseAnalysis: profileData.caseAnalysis,
          email: profileData.email || null,
          wechat: profileData.wechat || null,
          linkedin: profileData.linkedin || null,
          bio: profileData.bio || null,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));
      return { success: true };
    } else {
      // Create new profile
      await db.insert(userProfiles).values({
        userId,
        jobType: profileData.jobType,
        experienceLevel: profileData.experienceLevel,
        targetCompany: profileData.targetCompany || null,
        targetIndustry: profileData.targetIndustry || null,
        technicalInterview: profileData.technicalInterview,
        behavioralInterview: profileData.behavioralInterview,
        caseAnalysis: profileData.caseAnalysis,
        email: profileData.email || null,
        wechat: profileData.wechat || null,
        linkedin: profileData.linkedin || null,
        bio: profileData.bio || null,
      });

      return { success: true };
    }
  } catch (error) {
    console.error('Profile save error:', error);
    return { success: false, message: '保存失败，请稍后再试' };
  }
}

// Get user profile
export async function getUserProfile(userId: number): Promise<GetProfileResult> {
  try {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    if (profile) {
    return { success: true, profile };
    } else {
      return { success: false, message: '未找到资料' };
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    return { success: false, message: '获取资料失败，请稍后再试' };
  }
} 

// 北美主流行业
export const INDUSTRY_OPTIONS = [
  '互联网/科技',
  '金融/银行',
  '咨询',
  '零售/电商',
  '医疗健康',
  '教育',
  '能源',
  '制造业',
  '政府/非营利',
  '媒体/广告',
  '物流/运输',
  '房地产',
  '其他',
];

// 北美主流公司（部分示例，可后续补充）
export const COMPANY_OPTIONS = [
  'Google',
  'Meta (Facebook)',
  'Amazon',
  'Apple',
  'Microsoft',
  'Netflix',
  'Tesla',
  'Nvidia',
  'Salesforce',
  'Uber',
  'Airbnb',
  'LinkedIn',
  'Stripe',
  'Shopify',
  'Oracle',
  'IBM',
  'JPMorgan Chase',
  'Goldman Sachs',
  'Morgan Stanley',
  'McKinsey',
  'BCG',
  'Bain',
  'Walmart',
  'Target',
  'CVS Health',
  'UnitedHealth',
  '其他',
]; 