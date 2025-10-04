import { db } from '@/lib/db';
import { userProfiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// 验证用户是否存在
export async function verifyUser(userId: number): Promise<boolean> {
  try {
    if (!userId || userId <= 0) return false;
    const result = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    return result.length > 0;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
}

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
  statsQuestions: boolean;
  email?: string;
  wechat?: string;
  linkedin?: string;
  bio?: string;
  school?: string; // 学校信息
};

type GetProfileResult =
  | { success: true; profile: any }
  | { success: false; message: string };

// Create or update user profile
export async function saveUserProfile(userId: number, profileData: Partial<ProfileFormData>) {
  try {
    // 首先验证用户是否存在
    const userExists = await verifyUser(userId);
    if (!userExists) {
      return { success: false, message: '用户不存在，请重新登录' };
    }

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
      // 更新资料 - 只更新提供的字段
      const updateData: any = { updatedAt: new Date() };
      
      // 只添加非undefined的字段到更新数据中
      if (profileData.jobType !== undefined) updateData.jobType = profileData.jobType;
      if (profileData.experienceLevel !== undefined) updateData.experienceLevel = profileData.experienceLevel;
      if (profileData.targetCompany !== undefined) updateData.targetCompany = profileData.targetCompany || null;
      if (profileData.targetIndustry !== undefined) updateData.targetIndustry = profileData.targetIndustry || null;
      if (profileData.otherCompanyName !== undefined) updateData.otherCompanyName = profileData.otherCompanyName || null;
      if (profileData.technicalInterview !== undefined) updateData.technicalInterview = profileData.technicalInterview;
      if (profileData.behavioralInterview !== undefined) updateData.behavioralInterview = profileData.behavioralInterview;
      if (profileData.caseAnalysis !== undefined) updateData.caseAnalysis = profileData.caseAnalysis;
      if (profileData.statsQuestions !== undefined) updateData.statsQuestions = profileData.statsQuestions;
      if (profileData.email !== undefined) updateData.email = profileData.email || null;
      if (profileData.wechat !== undefined) updateData.wechat = profileData.wechat || null;
      if (profileData.linkedin !== undefined) updateData.linkedin = profileData.linkedin || null;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio || null;
      if (profileData.school !== undefined) updateData.school = profileData.school || null;

      await db
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.userId, userId));
      return { success: true };
    } else {
      // Create new profile - 验证必需字段
      if (!profileData.jobType || !profileData.experienceLevel) {
        return { success: false, message: '创建资料时需要提供职位类型和经验水平' };
      }

      await db.insert(userProfiles).values({
        userId,
        jobType: profileData.jobType,
        experienceLevel: profileData.experienceLevel,
        targetCompany: profileData.targetCompany || null,
        targetIndustry: profileData.targetIndustry || null,
        otherCompanyName: profileData.otherCompanyName || null,
        technicalInterview: profileData.technicalInterview || false,
        behavioralInterview: profileData.behavioralInterview || false,
        caseAnalysis: profileData.caseAnalysis || false,
        statsQuestions: profileData.statsQuestions || false,
        email: profileData.email || null,
        wechat: profileData.wechat || null,
        linkedin: profileData.linkedin || null,
        bio: profileData.bio || null,
        school: profileData.school || null,
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
      statsQuestions: profileData.statsQuestions,
      email: profileData.email || null,
      wechat: profileData.wechat || null,
      linkedin: profileData.linkedin || null,
      bio: profileData.bio || null,
      school: profileData.school || null,
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