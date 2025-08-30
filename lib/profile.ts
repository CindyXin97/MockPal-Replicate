import { db } from '@/lib/db';
import { userProfiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Profile type for form submission
export type ProfileFormData = {
  name?: string; // 用户显示名称
  jobType: 'DA' | 'DS' | 'DE' | 'BA';
  experienceLevel: '应届' | '1-3年' | '3-5年' | '5年以上';
  targetCompany?: string;
  targetIndustry?: string;
  otherCompanyName?: string; // 用户自定义的公司名称
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
    // Update user name if provided
    if (profileData.name) {
      await db
        .update(users)
        .set({
          name: profileData.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    // Check if profile already exists
    const existingProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

    if (existingProfile.length > 0) {
      // 更新资料
      await db
        .update(userProfiles)
        .set({
          jobType: profileData.jobType,
          experienceLevel: profileData.experienceLevel,
          targetCompany: profileData.targetCompany || null,
          targetIndustry: profileData.targetIndustry || null,
          otherCompanyName: profileData.otherCompanyName || null,
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
        otherCompanyName: profileData.otherCompanyName || null,
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

// Create user profile
export async function createProfile(userId: number, profileData: ProfileFormData) {
  try {
    await db.insert(userProfiles).values({
      userId,
      jobType: profileData.jobType,
      experienceLevel: profileData.experienceLevel,
      targetCompany: profileData.targetCompany || null,
      targetIndustry: profileData.targetIndustry || null,
      otherCompanyName: profileData.otherCompanyName || null,
      technicalInterview: profileData.technicalInterview,
      behavioralInterview: profileData.behavioralInterview,
      caseAnalysis: profileData.caseAnalysis,
      email: profileData.email || null,
      wechat: profileData.wechat || null,
      linkedin: profileData.linkedin || null,
      bio: profileData.bio || null,
    });
    return { success: true };
  } catch (error) {
    console.error('Profile creation error:', error);
    return { success: false, message: '创建资料失败，请稍后再试' };
  }
}

// Get user profile
export async function getUserProfile(userId: number): Promise<GetProfileResult> {
  try {
    // 先获取用户的name
    const userInfo = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userName = userInfo.length > 0 ? userInfo[0].name : null;
    
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (profile.length > 0) {
      // 将name字段合并到profile中
      const profileWithName = {
        ...profile[0],
        name: userName
      };
      return { success: true, profile: profileWithName };
    } else {
      return { success: false, message: '未找到资料' };
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    return { success: false, message: '获取资料失败，请稍后再试' };
  }
} 