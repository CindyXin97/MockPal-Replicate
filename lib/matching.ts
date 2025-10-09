import { db } from '@/lib/db';
import { users, userProfiles, matches, feedbacks, userDailyViews } from '@/lib/db/schema';
import { eq, and, or, not, desc, exists, inArray } from 'drizzle-orm';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { matchBetweenUsers, matchesForUser, errorResponse, successResponse } from '@/lib/matching-utils';
import { updateUserAchievement } from './achievements';

// Get potential matches for a user
export async function getPotentialMatches(userId: number) {
  try {
    // First, get the user's profile
    const userProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!userProfile) {
      return { success: false, message: '请先完成个人资料' };
    }

    // 获取今天日期（使用美东时区）
    const ET_TIMEZONE = 'America/New_York';
    const now = new Date();
    const etDate = toZonedTime(now, ET_TIMEZONE);
    const today = format(etDate, 'yyyy-MM-dd');
    // 查询今天已浏览的用户ID和操作次数
    const todayViews = await db.query.userDailyViews.findMany({
      where: and(
        eq(userDailyViews.userId, userId),
        eq(userDailyViews.date, today)
      ),
    });
    if (todayViews.length >= 4) {
      return { success: true, matches: [] };
    }
    const viewedTodayIds = todayViews.map(v => v.viewedUserId);

    // Get users who haven't been matched with the current user yet
    // 排除所有已有记录的用户：accepted、rejected、pending
    const existingMatches = await db.query.matches.findMany({
      where: or(
        eq(matches.user1Id, userId),
        eq(matches.user2Id, userId)
      ),
    });

    // Extract IDs of users already in matches
    const matchedUserIds = existingMatches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    );

    // Add current user's ID和今日已浏览ID到排除列表
    const excludedIds = [...matchedUserIds, userId, ...viewedTodayIds];

    // Find potential matches based on compatible tags
    const potentialMatches = await db.query.users.findMany({
      where: and(
        not(eq(users.id, userId)),
        // 确保用户有个人资料
        exists(
          db.select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, users.id))
        )
      ),
      with: {
        profile: true,
      },
      // 按创建时间降序排序，确保新用户优先显示
      orderBy: [desc(users.createdAt)],
    });

    // Filter out users that are already matched and ensure they have contact info
    const filteredMatches = potentialMatches.filter(user => {
      // 检查基本资料是否完整
      const hasBasicInfo = user.profile?.jobType && user.profile?.experienceLevel;
      // 检查是否选择了练习内容
      const hasPracticeContent = (
        user.profile?.technicalInterview ||
        user.profile?.behavioralInterview ||
        user.profile?.caseAnalysis ||
        user.profile?.statsQuestions
      );
      // 检查是否有联系方式
      const hasContactInfo = (
        (user.profile?.email && user.profile.email.trim() !== '') ||
        (user.profile?.wechat && user.profile.wechat.trim() !== '') ||
        (user.profile?.linkedin && user.profile.linkedin.trim() !== '')
      );
      const isNotExcluded = !excludedIds.includes(user.id);
      return isNotExcluded && hasBasicInfo && hasPracticeContent && hasContactInfo;
    });

    // 批量查询所有候选用户的pending邀请（解决N+1查询问题）
    const candidateUserIds = filteredMatches.map(u => u.id);
    let pendingInvitations: typeof matches.$inferSelect[] = [];
    
    // 只有存在候选用户时才查询
    if (candidateUserIds.length > 0) {
      pendingInvitations = await db.query.matches.findMany({
        where: and(
          eq(matches.user2Id, userId),
          eq(matches.status, 'pending'),
          inArray(matches.user1Id, candidateUserIds)
        ),
      });
    }
    
    // 构建Set用于O(1)查找
    const invitationSet = new Set(pendingInvitations.map(inv => inv.user1Id));
    
    // 优先级排序：对方已发出邀请且内容重叠 > 内容重叠 > 岗位和经验都相同 > 其他
    const invitedOverlapList: typeof filteredMatches = [];
    const overlapList: typeof filteredMatches = [];
    const jobExpList: typeof filteredMatches = [];
    const otherList: typeof filteredMatches = [];
    
    for (const user of filteredMatches) {
      const overlap =
        (user.profile?.technicalInterview && userProfile.technicalInterview) ||
        (user.profile?.behavioralInterview && userProfile.behavioralInterview) ||
        (user.profile?.caseAnalysis && userProfile.caseAnalysis) ||
        (user.profile?.statsQuestions && userProfile.statsQuestions);
      const jobMatch = user.profile?.jobType === userProfile.jobType;
      const expMatch = user.profile?.experienceLevel === userProfile.experienceLevel;
      
      // 使用Set进行O(1)查找替代数据库查询
      const hasInvited = invitationSet.has(user.id);
      
      if (hasInvited && overlap) {
        invitedOverlapList.push(user);
      } else if (overlap) {
        overlapList.push(user);
      } else if (jobMatch && expMatch) {
        jobExpList.push(user);
      } else {
        otherList.push(user);
      }
    }
    const finalList = [...invitedOverlapList, ...overlapList, ...jobExpList, ...otherList].slice(0, 4);
    return {
      success: true,
      matches: finalList.map(user => ({
        id: user.id,
        username: user.name,
        jobType: user.profile?.jobType,
        experienceLevel: user.profile?.experienceLevel,
        targetCompany: user.profile?.targetCompany,
        targetIndustry: user.profile?.targetIndustry,
        practicePreferences: {
          technicalInterview: user.profile?.technicalInterview,
          behavioralInterview: user.profile?.behavioralInterview,
          caseAnalysis: user.profile?.caseAnalysis,
          statsQuestions: user.profile?.statsQuestions,
        },
        bio: user.profile?.bio,
      }))
    };
  } catch (error) {
    console.error('Get potential matches error:', error);
    return { success: false, message: '获取匹配失败，请稍后再试' };
  }
}

// Create match (like a user) - 移除事务，改为顺序执行
export async function createMatch(userId: number, targetUserId: number) {
  try {
    // 记录今日浏览（使用美东时区）
    const ET_TIMEZONE = 'America/New_York';
    const now = new Date();
    const etDate = toZonedTime(now, ET_TIMEZONE);
    const today = format(etDate, 'yyyy-MM-dd');
    await db.insert(userDailyViews).values({
      userId,
      viewedUserId: targetUserId,
      date: today,
      createdAt: new Date(),
    });

    // 使用通用函数查询现有匹配
    const existingMatch = await db.query.matches.findFirst({
      where: matchBetweenUsers(userId, targetUserId),
    });

    if (existingMatch) {
      // 对方已发出邀请，双向匹配成功
      if (existingMatch.user1Id === targetUserId && existingMatch.status === 'pending') {
        await db
          .update(matches)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(matches.id, existingMatch.id));

        return successResponse({ match: true }, '匹配成功！');
      }

      // 自己已发出邀请，等待对方回应
      if (existingMatch.user1Id === userId && existingMatch.status === 'pending') {
        // 已经发送过邀请，不需要再次操作，直接返回等待状态
        return successResponse({ match: false }, '已收到你的喜欢！等待对方回应。');
      }

      // 已经匹配成功
      if (existingMatch.status === 'accepted') {
        return successResponse({ match: true }, '已经匹配成功！');
      }

      // 之前被拒绝，重新发起
      if (existingMatch.status === 'rejected') {
        await db
          .update(matches)
          .set({ status: 'pending', updatedAt: new Date() })
          .where(eq(matches.id, existingMatch.id));

        return successResponse({ match: false }, '已收到你的喜欢！等待对方回应。');
      }
    }

    // 创建新匹配
    await db.insert(matches).values({
      user1Id: userId,
      user2Id: targetUserId,
      status: 'pending',
    });

    return successResponse({ match: false }, '已收到你的喜欢！等待对方回应。');
  } catch (error) {
    return errorResponse('操作失败，请稍后再试', error);
  }
}

// Reject match (dislike a user) - 移除事务，改为顺序执行
export async function rejectMatch(userId: number, targetUserId: number) {
  try {
    // 记录今日浏览（使用美东时区）
    const ET_TIMEZONE = 'America/New_York';
    const now = new Date();
    const etDate = toZonedTime(now, ET_TIMEZONE);
    const today = format(etDate, 'yyyy-MM-dd');
    await db.insert(userDailyViews).values({
      userId,
      viewedUserId: targetUserId,
      date: today,
      createdAt: new Date(),
    });

    // 使用通用函数查询现有匹配
    const existingMatch = await db.query.matches.findFirst({
      where: matchBetweenUsers(userId, targetUserId),
    });

    if (existingMatch) {
      // 更新状态为拒绝
      await db
        .update(matches)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(matches.id, existingMatch.id));
    } else {
      // 创建新的拒绝记录
      await db.insert(matches).values({
        user1Id: userId,
        user2Id: targetUserId,
        status: 'rejected',
      });
    }

    return successResponse();
  } catch (error) {
    return errorResponse('操作失败，请稍后再试', error);
  }
}

// Get successful matches for a user - 优化为批量查询
export async function getSuccessfulMatches(userId: number) {
  try {
    // 查询所有成功的匹配
    const successfulMatches = await db.query.matches.findMany({
      where: matchesForUser(userId, 'accepted'),
    });

    // 提取所有匹配用户的ID
    const matchedUserIds = successfulMatches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    );

    // 批量查询所有用户信息（单次查询替代N次查询）
    if (matchedUserIds.length === 0) {
      return successResponse({ matches: [] });
    }

    const matchedUsers = await db.query.users.findMany({
      where: inArray(users.id, matchedUserIds),
      with: {
        profile: true,
      },
    });

    // 构建Map用于快速查找
    const usersMap = new Map(matchedUsers.map(u => [u.id, u]));

    // 批量查询所有匹配的反馈数据
    const matchIds = successfulMatches.map(match => match.id);
    const matchFeedbacks = matchIds.length > 0 ? await db.query.feedbacks.findMany({
      where: and(
        inArray(feedbacks.matchId, matchIds),
        eq(feedbacks.userId, userId)
      )
    }) : [];
    
    // 构建反馈Map用于快速查找
    const feedbacksMap = new Map(matchFeedbacks.map(f => [f.matchId, f]));

    // 组装返回数据
    const formattedMatches = successfulMatches
      .map(match => {
        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const user = usersMap.get(partnerId);
        if (!user || !user.profile) return null;

        // 获取该匹配的反馈信息
        const feedback = feedbacksMap.get(match.id);
        
        return {
          id: user.id, // 用户ID，用于显示
          matchId: match.id, // 匹配记录ID，用于状态更新
          username: user.name,
          jobType: user.profile.jobType,
          experienceLevel: user.profile.experienceLevel,
          targetCompany: user.profile.targetCompany,
          targetIndustry: user.profile.targetIndustry,
          practicePreferences: {
            technicalInterview: user.profile.technicalInterview,
            behavioralInterview: user.profile.behavioralInterview,
            caseAnalysis: user.profile.caseAnalysis,
            statsQuestions: user.profile.statsQuestions,
          },
          contactInfo: {
            email: user.profile.email,
            wechat: user.profile.wechat,
            linkedin: user.profile.linkedin,
          },
          bio: user.profile.bio,
          // 添加匹配相关信息
          contactStatus: match.contactStatus,
          createdAt: match.createdAt?.toISOString(),
          contactUpdatedAt: match.contactUpdatedAt?.toISOString(),
          // 添加反馈信息
          feedback: feedback ? {
            interviewStatus: feedback.interviewStatus,
            content: feedback.content,
            createdAt: feedback.createdAt?.toISOString(),
          } : null,
        };
      })
      .filter(Boolean);

    return successResponse({ matches: formattedMatches });
  } catch (error) {
    return errorResponse('获取匹配失败，请稍后再试', error);
  }
}

// 保存面试反馈
export async function saveFeedback({ matchId, userId, contactStatus, interviewStatus, content }: { matchId: number, userId: number, contactStatus?: string, interviewStatus: string, content?: string }) {
  try {
    console.log('saveFeedback - 开始保存反馈:', { matchId, userId, contactStatus, interviewStatus, content });
    
    // 保存反馈
    const insertResult = await db.insert(feedbacks).values({
      matchId,
      userId,
      contactStatus: contactStatus || null,
      interviewStatus,
      content: content || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('saveFeedback - 数据库插入结果:', insertResult);

    // 如果面试状态是成功的，更新用户成就
    if (interviewStatus === 'yes') {
      console.log('saveFeedback - 更新用户成就:', userId);
      await updateUserAchievement(userId);
    }

    console.log('saveFeedback - 成功完成');
    return { success: true };
  } catch (error) {
    console.error('saveFeedback - 错误详情:', error);
    console.error('saveFeedback - 错误堆栈:', error instanceof Error ? error.stack : 'No stack');
    return { 
      success: false, 
      message: '保存反馈失败，请稍后再试',
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 