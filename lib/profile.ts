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
    console.log('saveUserProfile received:', { userId, profileDataName: profileData.name, fullProfileData: profileData });
    
    // Update user name if provided
    if (profileData.name) {
      console.log('Updating user name to:', profileData.name);
      const updateResult = await db
        .update(users)
        .set({
          name: profileData.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      console.log('User name update result:', updateResult);
    } else {
      console.log('No name provided in profileData');
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
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (profile.length > 0) {
      return { success: true, profile: profile[0] };
    } else {
      return { success: false, message: '未找到资料' };
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    return { success: false, message: '获取资料失败，请稍后再试' };
  }
} 