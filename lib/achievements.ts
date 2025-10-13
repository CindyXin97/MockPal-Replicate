import { db } from './db';
import { userAchievements, feedbacks } from './db/schema';
import { eq, count, and } from 'drizzle-orm';

// 成就等级定义
export const ACHIEVEMENT_LEVELS = {
  '新用户': { minExperience: 0, icon: '🌱', description: '刚加入平台的新成员' },
  '面试新手': { minExperience: 1, icon: '⭐', description: '开始积累经验' },
  '面试新星': { minExperience: 5, icon: '🌟', description: '积极的面试伙伴' },
  '面试达人': { minExperience: 10, icon: '🌙', description: '完成第一阶段挑战' },
  '面试导师': { minExperience: 15, icon: '👑', description: '经验丰富的面试专家' },
} as const;

export type AchievementLevel = keyof typeof ACHIEVEMENT_LEVELS;

// 根据经验值计算等级
export function calculateLevel(experiencePoints: number): AchievementLevel {
  if (experiencePoints >= 15) return '面试导师';
  if (experiencePoints >= 10) return '面试达人';
  if (experiencePoints >= 5) return '面试新星';
  if (experiencePoints >= 1) return '面试新手';
  return '新用户';
}

// 获取用户成就数据
export async function getUserAchievement(userId: number) {
  try {
    // 首先尝试从成就表获取
    const existingAchievement = await db.query.userAchievements.findFirst({
      where: eq(userAchievements.userId, userId),
    });

    if (existingAchievement) {
      return existingAchievement;
    }

    // 如果不存在，基于用户的面试历史创建
    const interviewCount = await db
      .select({ count: count() })
      .from(feedbacks)
      .where(and(
        eq(feedbacks.userId, userId),
        eq(feedbacks.interviewStatus, 'yes')
      ))
      .then(result => result[0]?.count || 0);

    const experiencePoints = interviewCount;
    const currentLevel = calculateLevel(experiencePoints);

    try {
      // 尝试创建新的成就记录
      const newAchievement = await db.insert(userAchievements).values({
        userId,
        totalInterviews: interviewCount,
        experiencePoints,
        currentLevel,
      }).returning();

      return newAchievement[0];
    } catch (insertError) {
      console.warn('Could not insert achievement (table may not exist):', insertError);
      // 如果插入失败（可能表不存在），返回计算的默认值
      return {
        id: 0,
        userId,
        totalInterviews: interviewCount,
        experiencePoints,
        currentLevel,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  } catch (error) {
    console.error('Error getting user achievement:', error);
    // 返回默认值
    return {
      id: 0,
      userId,
      totalInterviews: 0,
      experiencePoints: 0,
      currentLevel: '新用户' as AchievementLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// 更新用户成就（当完成面试时调用）
export async function updateUserAchievement(userId: number) {
  try {
    // 计算用户总的成功面试次数
    const successfulInterviewsResult = await db
      .select({ count: count() })
      .from(feedbacks)
      .where(and(
        eq(feedbacks.userId, userId),
        eq(feedbacks.interviewStatus, 'yes')
      ));
    
    const totalInterviews = successfulInterviewsResult[0]?.count || 0;
    const experiencePoints = totalInterviews;
    const currentLevel = calculateLevel(experiencePoints);

    // 更新或创建成就记录
    const existingAchievement = await db.query.userAchievements.findFirst({
      where: eq(userAchievements.userId, userId),
    });

    if (existingAchievement) {
      // 更新现有记录
      await db
        .update(userAchievements)
        .set({
          totalInterviews,
          experiencePoints,
          currentLevel,
          updatedAt: new Date(),
        })
        .where(eq(userAchievements.userId, userId));
    } else {
      // 创建新记录
      await db.insert(userAchievements).values({
        userId,
        totalInterviews,
        experiencePoints,
        currentLevel,
      });
    }

    return { totalInterviews, experiencePoints, currentLevel };
  } catch (error) {
    console.error('Error updating user achievement:', error);
    throw error;
  }
}

// 获取成就等级信息
export function getAchievementInfo(level: AchievementLevel) {
  return ACHIEVEMENT_LEVELS[level];
}

// 批量获取多个用户的成就数据
export async function getBatchUserAchievements(userIds: number[]) {
  try {
    const achievements = await db.query.userAchievements.findMany({
      where: (table, { inArray }) => inArray(table.userId, userIds),
    });

    // 为没有成就记录的用户创建默认数据
    const achievementMap = new Map(achievements.map(a => [a.userId, a]));
    const result = userIds.map(userId => {
      const existing = achievementMap.get(userId);
      if (existing) return existing;
      
      // 返回默认成就数据
      return {
        id: 0,
        userId,
        totalInterviews: 0,
        experiencePoints: 0,
        currentLevel: '新用户' as AchievementLevel,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    return result;
  } catch (error) {
    console.error('Error getting batch user achievements:', error);
    // 返回默认数据
    return userIds.map(userId => ({
      id: 0,
      userId,
      totalInterviews: 0,
      experiencePoints: 0,
      currentLevel: '新用户' as AchievementLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
} 