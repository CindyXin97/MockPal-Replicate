import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Profile type for form submission
export type ProfileFormData = {
  jobType: 'DA' | 'DS' | 'DE';
  experienceLevel: '应届' | '1-3年' | '3年+';
  targetCompany?: string;
  targetIndustry?: string;
  technicalInterview: boolean;
  behavioralInterview: boolean;
  caseAnalysis: boolean;
  email?: string;
  wechat?: string;
  linkedin?: string;
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