import { db } from '@/lib/db';
import { users, userProfiles, matches, feedbacks, userDailyViews } from '@/lib/db/schema';
import { eq, and, or, not, desc, exists } from 'drizzle-orm';
import { format } from 'date-fns';

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

    // 获取今天日期
    const today = format(new Date(), 'yyyy-MM-dd');
    // 查询今天已浏览的用户ID和操作次数
    const todayViews = await db.query.userDailyViews.findMany({
      where: and(
        eq(userDailyViews.userId, userId),
        eq(userDailyViews.date, today)
      ),
    });
    if (todayViews.length >= 5) {
      return { success: true, matches: [] };
    }
    const viewedTodayIds = todayViews.map(v => v.viewedUserId);

    // Get users who haven't been matched with the current user yet
    const existingMatches = await db.query.matches.findMany({
      where: and(
        or(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, userId)
        ),
        or(
          eq(matches.status, 'accepted'),
          eq(matches.status, 'rejected')
        )
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
        user.profile?.caseAnalysis
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

    // 优先级排序：对方已发出邀请且内容重叠 > 内容重叠 > 岗位和经验都相同 > 其他
    const invitedOverlapList: typeof filteredMatches = [];
    const overlapList: typeof filteredMatches = [];
    const jobExpList: typeof filteredMatches = [];
    const otherList: typeof filteredMatches = [];
    for (const user of filteredMatches) {
      const p = user.profile;
      const overlap =
        (user.profile?.technicalInterview && p.technicalInterview) ||
        (user.profile?.behavioralInterview && p.behavioralInterview) ||
        (user.profile?.caseAnalysis && p.caseAnalysis);
      const jobMatch = user.profile?.jobType === p.jobType;
      const expMatch = user.profile?.experienceLevel === p.experienceLevel;
      // 判断对方是否已发出邀请且内容重叠
      const hasInvited = await db.query.matches.findFirst({
        where: and(
          eq(matches.user1Id, user.id),
          eq(matches.user2Id, userId),
          eq(matches.status, 'pending')
        ),
      });
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
    const finalList = [...invitedOverlapList, ...overlapList, ...jobExpList, ...otherList].slice(0, 5);
    return {
      success: true,
      matches: finalList.map(user => ({
        id: user.id,
        username: user.username,
        jobType: user.profile?.jobType,
        experienceLevel: user.profile?.experienceLevel,
        targetCompany: user.profile?.targetCompany,
        targetIndustry: user.profile?.targetIndustry,
        practicePreferences: {
          technicalInterview: user.profile?.technicalInterview,
          behavioralInterview: user.profile?.behavioralInterview,
          caseAnalysis: user.profile?.caseAnalysis,
        },
        bio: user.profile?.bio,
      }))
    };
  } catch (error) {
    console.error('Get potential matches error:', error);
    return { success: false, message: '获取匹配失败，请稍后再试' };
  }
}

// Create match (like a user)
export async function createMatch(userId: number, targetUserId: number) {
  try {
    // 记录今日浏览
    const today = format(new Date(), 'yyyy-MM-dd');
    await db.insert(userDailyViews).values({
      userId,
      viewedUserId: targetUserId,
      date: today,
      createdAt: new Date(),
    });

    // Check if match already exists
    const existingMatch = await db.query.matches.findFirst({
      where: or(
        and(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, targetUserId)
        ),
        and(
          eq(matches.user1Id, targetUserId),
          eq(matches.user2Id, userId)
        )
      ),
    });

    if (existingMatch) {
      // If user2 has already liked user1, update match status to accepted
      if (existingMatch.user1Id === targetUserId && existingMatch.status === 'pending') {
        await db
          .update(matches)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(matches.id, existingMatch.id));

        return { success: true, match: true, message: '匹配成功！' };
      }

      // If user1 has already liked user2, but user2 is liking user1 now, this shouldn't happen
      // But let's handle it by updating the match to accepted
      if (existingMatch.user1Id === userId && existingMatch.status === 'pending') {
        await db
          .update(matches)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(matches.id, existingMatch.id));

        return { success: true, match: true, message: '匹配成功！' };
      }

      // If the match is already accepted, just return success
      if (existingMatch.status === 'accepted') {
        return { success: true, match: true, message: '已经匹配成功！' };
      }

      // If the match was rejected, update it to pending
      if (existingMatch.status === 'rejected') {
        await db
          .update(matches)
          .set({ status: 'pending', updatedAt: new Date() })
          .where(eq(matches.id, existingMatch.id));

        return { success: true, match: false, message: '已收到你的喜欢！等待对方回应。' };
      }
    }

    // Create new match
    await db.insert(matches).values({
      user1Id: userId,
      user2Id: targetUserId,
      status: 'pending',
    });

    return { success: true, match: false, message: '已收到你的喜欢！等待对方回应。' };
  } catch (error) {
    console.error('Create match error:', error);
    return { success: false, message: '操作失败，请稍后再试' };
  }
}

// Reject match (dislike a user)
export async function rejectMatch(userId: number, targetUserId: number) {
  try {
    // 记录今日浏览
    const today = format(new Date(), 'yyyy-MM-dd');
    await db.insert(userDailyViews).values({
      userId,
      viewedUserId: targetUserId,
      date: today,
      createdAt: new Date(),
    });

    // Check if match already exists
    const existingMatch = await db.query.matches.findFirst({
      where: or(
        and(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, targetUserId)
        ),
        and(
          eq(matches.user1Id, targetUserId),
          eq(matches.user2Id, userId)
        )
      ),
    });

    if (existingMatch) {
      // Update match status to rejected
      await db
        .update(matches)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(matches.id, existingMatch.id));
    } else {
      // Create new match with rejected status
      await db.insert(matches).values({
        user1Id: userId,
        user2Id: targetUserId,
        status: 'rejected',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Reject match error:', error);
    return { success: false, message: '操作失败，请稍后再试' };
  }
}

// Get successful matches for a user
export async function getSuccessfulMatches(userId: number) {
  try {
    const successfulMatches = await db.query.matches.findMany({
      where: and(
        or(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, userId)
        ),
        eq(matches.status, 'accepted')
      ),
    });

    // Get the matched users' details
    const matchedUsers = await Promise.all(
      successfulMatches.map(async (match) => {
        const matchedUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        
        const matchedUser = await db.query.users.findFirst({
          where: eq(users.id, matchedUserId),
          with: {
            profile: true,
          },
        });

        if (!matchedUser || !matchedUser.profile) {
          return null;
        }

        return {
          id: matchedUser.id,
          username: matchedUser.username,
          jobType: matchedUser.profile.jobType,
          experienceLevel: matchedUser.profile.experienceLevel,
          targetCompany: matchedUser.profile.targetCompany,
          targetIndustry: matchedUser.profile.targetIndustry,
          practicePreferences: {
            technicalInterview: matchedUser.profile.technicalInterview,
            behavioralInterview: matchedUser.profile.behavioralInterview,
            caseAnalysis: matchedUser.profile.caseAnalysis,
          },
          contactInfo: {
            email: matchedUser.profile.email,
            wechat: matchedUser.profile.wechat,
          },
          bio: matchedUser.profile.bio,
        };
      })
    );

    // Filter out null values
    const filteredMatches = matchedUsers.filter(Boolean);

    return { success: true, matches: filteredMatches };
  } catch (error) {
    console.error('Get successful matches error:', error);
    return { success: false, message: '获取匹配失败，请稍后再试' };
  }
}

// 保存面试反馈
export async function saveFeedback({ matchId, userId, interviewStatus, content }: { matchId: number, userId: number, interviewStatus: string, content?: string }) {
  try {
    await db.insert(feedbacks).values({
      matchId,
      userId,
      interviewStatus,
      content: content || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Save feedback error:', error);
    return { success: false, message: '保存反馈失败，请稍后再试' };
  }
} 