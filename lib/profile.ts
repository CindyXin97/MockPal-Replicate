import { db } from '@/lib/db';
import { userProfiles, users, userProfileHistory } from '@/lib/db/schema';
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
  jobType: 'DA' | 'DS' | 'DE' | 'BA' | 'MLE';
  experienceLevel: '实习' | '应届' | '1-3年' | '3-5年' | '5年以上';
  jobSeekingStatus?: '保持状态' | '准备中' | '面试中' | '已拿offer';
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
  school: string; // 学校信息（必填）
  skills?: string[]; // 技能列表，最多3个，每个不超过12个字符
  preferredCommunicationLanguage?: '不限制' | '中文' | '英文'; // 交流语言偏好
};

type GetProfileResult =
  | { success: true; profile: any }
  | { success: false; message: string };

// 保存资料历史记录
async function saveProfileHistory(
  userId: number, 
  profileId: number | undefined,
  profileData: Partial<ProfileFormData>, 
  changeType: 'create' | 'update',
  changedFields?: string[]
) {
  try {
    await db.insert(userProfileHistory).values({
      userId,
      profileId: profileId || null,
      jobType: profileData.jobType || null,
      experienceLevel: profileData.experienceLevel || null,
      jobSeekingStatus: profileData.jobSeekingStatus || null,
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
      skills: profileData.skills ? JSON.stringify(profileData.skills) : null,
      preferredCommunicationLanguage: profileData.preferredCommunicationLanguage || null,
      changeType,
      changedFields: changedFields || null,
    });
    console.log('📜 历史记录已保存');
  } catch (error) {
    console.error('⚠️  保存历史记录失败:', error);
    // 不抛出错误，历史记录失败不应该影响主流程
  }
}

// 比较两个对象，找出变化的字段
function getChangedFields(oldProfile: any, newData: Partial<ProfileFormData>): string[] {
  const changed: string[] = [];
  const fieldsToCheck: (keyof ProfileFormData)[] = [
    'jobType', 'experienceLevel', 'jobSeekingStatus', 'targetCompany', 'targetIndustry',
    'technicalInterview', 'behavioralInterview', 'caseAnalysis', 'statsQuestions',
    'email', 'wechat', 'linkedin', 'bio', 'school', 'skills', 'preferredCommunicationLanguage'
  ];

  for (const field of fieldsToCheck) {
    if (newData[field] !== undefined && oldProfile[field] !== newData[field]) {
      changed.push(field);
    }
  }
  
  return changed;
}

// Create or update user profile
export async function saveUserProfile(userId: number, profileData: Partial<ProfileFormData>) {
  try {
    console.log('💾 开始保存 Profile，userId:', userId);
    console.log('📦 接收到的 profileData:', JSON.stringify(profileData, null, 2));
    
    // 首先验证用户是否存在
    const userExists = await verifyUser(userId);
    if (!userExists) {
      return { success: false, message: '用户不存在，请重新登录' };
    }

    // Update user name if provided
    if (profileData.name) {
      console.log('✏️ 更新用户名称:', profileData.name);
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
      console.log('🔄 更新现有 Profile');
      const oldProfile = existingProfile[0];
      
      // 找出变化的字段
      const changedFields = getChangedFields(oldProfile, profileData);
      
      if (changedFields.length === 0) {
        console.log('⏭️  没有字段变化，跳过更新');
        return { success: true };
      }
      
      console.log('📝 变化的字段:', changedFields);
      
      // 更新资料 - 只更新提供的字段
      const updateData: any = { updatedAt: new Date() };
      
      // 只添加非undefined的字段到更新数据中
      if (profileData.jobType !== undefined) updateData.jobType = profileData.jobType;
      if (profileData.experienceLevel !== undefined) updateData.experienceLevel = profileData.experienceLevel;
      if (profileData.jobSeekingStatus !== undefined) updateData.jobSeekingStatus = profileData.jobSeekingStatus || null;
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
      if (profileData.school !== undefined) updateData.school = profileData.school;
      if (profileData.skills !== undefined) updateData.skills = profileData.skills ? JSON.stringify(profileData.skills) : null;
      if (profileData.preferredCommunicationLanguage !== undefined) updateData.preferredCommunicationLanguage = profileData.preferredCommunicationLanguage || null;

      // 验证更新后至少有一种练习内容（如果提供了练习内容字段）
      const practiceFieldsProvided = profileData.technicalInterview !== undefined || 
                                     profileData.behavioralInterview !== undefined || 
                                     profileData.caseAnalysis !== undefined || 
                                     profileData.statsQuestions !== undefined;
      
      if (practiceFieldsProvided) {
        // 计算更新后的状态
        const finalTechnical = profileData.technicalInterview !== undefined ? profileData.technicalInterview : oldProfile.technicalInterview;
        const finalBehavioral = profileData.behavioralInterview !== undefined ? profileData.behavioralInterview : oldProfile.behavioralInterview;
        const finalCase = profileData.caseAnalysis !== undefined ? profileData.caseAnalysis : oldProfile.caseAnalysis;
        const finalStats = profileData.statsQuestions !== undefined ? profileData.statsQuestions : oldProfile.statsQuestions;
        
        if (!finalTechnical && !finalBehavioral && !finalCase && !finalStats) {
          return { success: false, message: '请至少选择一种期望练习内容' };
        }
      }

      console.log('📝 准备更新的数据:', JSON.stringify(updateData, null, 2));

      await db
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.userId, userId));
      
      // 保存历史记录
      await saveProfileHistory(userId, oldProfile.id, profileData, 'update', changedFields);
      
      console.log('✅ Profile 更新成功');
      return { success: true };
    } else {
      console.log('🆕 创建新 Profile');
      // Create new profile - 验证必需字段
      if (!profileData.jobType || !profileData.experienceLevel || !profileData.school) {
        return { success: false, message: '创建资料时需要提供职位类型、经验水平和学校信息' };
      }

      // 验证至少选择一种练习内容
      if (!profileData.technicalInterview && 
          !profileData.behavioralInterview && 
          !profileData.caseAnalysis && 
          !profileData.statsQuestions) {
        return { success: false, message: '请至少选择一种期望练习内容' };
      }

      const newProfileResult = await db.insert(userProfiles).values({
        userId,
        jobType: profileData.jobType,
        experienceLevel: profileData.experienceLevel,
        jobSeekingStatus: profileData.jobSeekingStatus || null,
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
        school: profileData.school,
        skills: profileData.skills ? JSON.stringify(profileData.skills) : null,
        preferredCommunicationLanguage: profileData.preferredCommunicationLanguage || null,
      }).returning({ id: userProfiles.id });

      // 保存创建历史记录
      const newProfileId = newProfileResult[0]?.id;
      await saveProfileHistory(userId, newProfileId, profileData, 'create');

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
    // 验证至少选择一种练习内容
    if (!profileData.technicalInterview && 
        !profileData.behavioralInterview && 
        !profileData.caseAnalysis && 
        !profileData.statsQuestions) {
      return { success: false, message: '请至少选择一种期望练习内容' };
    }

    await db.insert(userProfiles).values({
      userId,
      jobType: profileData.jobType,
      experienceLevel: profileData.experienceLevel,
      jobSeekingStatus: profileData.jobSeekingStatus || null,
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
      school: profileData.school,
      skills: profileData.skills ? JSON.stringify(profileData.skills) : null,
      preferredCommunicationLanguage: profileData.preferredCommunicationLanguage || null,
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
    console.log('📖 开始加载 Profile，userId:', userId);
    
    // 先获取用户的name
    const userInfo = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userName = userInfo.length > 0 ? userInfo[0].name : null;
    console.log('👤 用户名称:', userName);
    
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    console.log('📊 从数据库查询到的 profile:', profile.length > 0 ? profile[0] : '未找到');
    
    if (profile.length > 0) {
      // 将name字段合并到profile中，并解析skills字段
      const profileWithName = {
        ...profile[0],
        name: userName,
        skills: profile[0].skills ? JSON.parse(profile[0].skills) : []
      };
      console.log('✅ 返回的完整 profile:', JSON.stringify(profileWithName, null, 2));
      return { success: true, profile: profileWithName };
    } else {
      console.log('❌ 未找到用户资料');
      return { success: false, message: '未找到资料' };
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    return { success: false, message: '获取资料失败，请稍后再试' };
  }
} 