import { db } from '@/lib/db';
import { users, userProfiles, matches, feedbacks, userDailyViews, userDailyBonus } from '@/lib/db/schema';
import { eq, and, or, not, desc, exists, inArray } from 'drizzle-orm';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { matchBetweenUsers, matchesForUser, errorResponse, successResponse } from '@/lib/matching-utils';
import { updateUserAchievement, getBatchUserAchievements } from './achievements';
import { emailService } from '@/lib/email-service';

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
    
    // 获取今日总配额（基础+奖励）
    const dailyLimit = await getUserDailyMatchLimit(userId);
    
    // 查询今天已浏览的用户ID和操作次数
    const todayViews = await db.query.userDailyViews.findMany({
      where: and(
        eq(userDailyViews.userId, userId),
        eq(userDailyViews.date, today)
      ),
    });
    
    if (todayViews.length >= dailyLimit) {
      return { success: true, matches: [] };
    }
    const viewedTodayIds = todayViews.map(v => v.viewedUserId);

    // 查询所有历史浏览记录（判断是否浏览完所有人）
    const allViews = await db.query.userDailyViews.findMany({
      where: eq(userDailyViews.userId, userId),
    });
    const allViewedUserIds = [...new Set(allViews.map(v => v.viewedUserId))];

    // 查询总用户数（有完整资料的）
    const allUsersWithProfiles = await db.query.users.findMany({
      where: exists(
        db.select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, users.id))
      ),
    });
    const totalUsersCount = allUsersWithProfiles.length;

    // 判断是否浏览完所有人（第一轮 vs 第二轮）
    const hasViewedAll = allViewedUserIds.length >= totalUsersCount - 1;

    // 获取所有match记录（按时间倒序，用于找最新状态）
    const existingMatches = await db.select()
      .from(matches)
      .where(or(
        eq(matches.user1Id, userId),
        eq(matches.user2Id, userId)
      ))
      .orderBy(desc(matches.createdAt));

    // 按用户对分组，找到每个用户的最新状态
    const latestStatusByUser = new Map<number, typeof existingMatches[0]>();
    
    for (const match of existingMatches) {
      const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
      
      // 只保留最新的记录（已按时间倒序）
      if (!latestStatusByUser.has(partnerId)) {
        latestStatusByUser.set(partnerId, match);
      }
    }

    // 构建排除列表
    let excludedIds: number[] = [userId]; // 永远排除自己

    if (hasViewedAll) {
      // 第二轮：只排除 accepted 用户
      for (const [partnerId, latestMatch] of latestStatusByUser.entries()) {
        if (latestMatch.status === 'accepted') {
          excludedIds.push(partnerId);
        }
      }
      
      excludedIds = [...excludedIds, ...viewedTodayIds];
    } else {
      // 第一轮：排除所有有view记录的用户（除了对方最新是 like 的）
      excludedIds = [...excludedIds, ...allViewedUserIds, ...viewedTodayIds];
      
      // 但对方最新操作是 like（发出邀请）的不排除（优先展示）
      const pendingInvitationsToMe: number[] = [];
      
      for (const [partnerId, latestMatch] of latestStatusByUser.entries()) {
        // 对方最新操作是 like，且是对方→我的方向
        if (latestMatch.user1Id === partnerId && 
            latestMatch.user2Id === userId && 
            latestMatch.actionType === 'like' &&
            latestMatch.status !== 'accepted') {
          pendingInvitationsToMe.push(partnerId);
        }
      }
      
      // 从排除列表中移除对方的pending邀请
      excludedIds = excludedIds.filter(id => !pendingInvitationsToMe.includes(id));
    }

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
      const profile = user.profile as any;
      // 检查基本资料是否完整
      const hasBasicInfo = profile?.jobType && profile?.experienceLevel;
      // 检查是否选择了练习内容
      const hasPracticeContent = (
        profile?.technicalInterview ||
        profile?.behavioralInterview ||
        profile?.caseAnalysis ||
        profile?.statsQuestions
      );
      // 检查是否有联系方式
      const hasContactInfo = (
        (profile?.email && profile.email.trim() !== '') ||
        (profile?.wechat && profile.wechat.trim() !== '') ||
        (profile?.linkedin && profile.linkedin.trim() !== '')
      );
      const isNotExcluded = !excludedIds.includes(user.id);
      return isNotExcluded && hasBasicInfo && hasPracticeContent && hasContactInfo;
    });

    // 批量查询所有候选用户的邀请（解决N+1查询问题）
    // 在历史记录模式下，需要找到每个用户对我的最新操作
    const candidateUserIds = filteredMatches.map(u => u.id);
    const invitationSet = new Set<number>();
    
    // 从 latestStatusByUser 中找出对我发出 like 的用户
    for (const [partnerId, latestMatch] of latestStatusByUser.entries()) {
      // 检查是否在候选列表中
      if (candidateUserIds.includes(partnerId)) {
        // 对方→我的方向，且最新操作是 like
        if (latestMatch.user1Id === partnerId && 
            latestMatch.user2Id === userId && 
            latestMatch.actionType === 'like' &&
            latestMatch.status !== 'accepted') {
          invitationSet.add(partnerId);
        }
      }
    }
    
    // 批量获取所有候选用户的成就数据
    const achievementsData = await getBatchUserAchievements(candidateUserIds);
    const achievementsMap = new Map(achievementsData.map(a => [a.userId, a]));
    
    // 优先级排序：对方已发出邀请且内容重叠 > 内容重叠 > 经验相同 > 岗位相同 > 其他
    const invitedOverlapList: typeof filteredMatches = [];
    const overlapList: typeof filteredMatches = [];
    const expList: typeof filteredMatches = [];
    const jobList: typeof filteredMatches = [];
    const otherList: typeof filteredMatches = [];
    
    for (const user of filteredMatches) {
      const profile = user.profile as any;
      const overlap =
        (profile?.technicalInterview && userProfile.technicalInterview) ||
        (profile?.behavioralInterview && userProfile.behavioralInterview) ||
        (profile?.caseAnalysis && userProfile.caseAnalysis) ||
        (profile?.statsQuestions && userProfile.statsQuestions);
      const jobMatch = profile?.jobType === userProfile.jobType;
      const expMatch = profile?.experienceLevel === userProfile.experienceLevel;
      
      // 使用Set进行O(1)查找替代数据库查询
      const hasInvited = invitationSet.has(user.id);
      
      if (hasInvited && overlap) {
        invitedOverlapList.push(user);
      } else if (overlap) {
        overlapList.push(user);
      } else if (expMatch) {
        expList.push(user);
      } else if (jobMatch) {
        jobList.push(user);
      } else {
        otherList.push(user);
      }
    }
    
    // 混合排序：综合考虑等级、活跃度和新用户
    const sortByMixedScore = (a: typeof filteredMatches[0], b: typeof filteredMatches[0]) => {
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      
      // 计算用户A的综合得分
      const aExp = achievementsMap.get(a.id)?.experiencePoints || 0;
      const aProfile = a.profile as any;
      const aUpdatedAt = aProfile?.updatedAt?.getTime() || a.createdAt?.getTime() || 0;
      const aCreatedAt = a.createdAt?.getTime() || 0;
      
      // 等级分：经验值 * 100（最高权重）
      const aExpScore = aExp * 100;
      
      // 活跃分：最近30天内更新资料 +50，最近7天 +70
      const aDaysSinceUpdate = (now - aUpdatedAt) / ONE_DAY;
      let aActiveScore = 0;
      if (aDaysSinceUpdate <= 7) {
        aActiveScore = 70; // 最近7天活跃
      } else if (aDaysSinceUpdate <= 30) {
        aActiveScore = 50; // 最近30天活跃
      }
      
      // 新用户分：注册7天内 +30
      const aDaysSinceCreated = (now - aCreatedAt) / ONE_DAY;
      const aNewUserScore = aDaysSinceCreated <= 7 ? 30 : 0;
      
      const aScore = aExpScore + aActiveScore + aNewUserScore;
      
      // 计算用户B的综合得分
      const bExp = achievementsMap.get(b.id)?.experiencePoints || 0;
      const bProfile = b.profile as any;
      const bUpdatedAt = bProfile?.updatedAt?.getTime() || b.createdAt?.getTime() || 0;
      const bCreatedAt = b.createdAt?.getTime() || 0;
      
      const bExpScore = bExp * 100;
      
      const bDaysSinceUpdate = (now - bUpdatedAt) / ONE_DAY;
      let bActiveScore = 0;
      if (bDaysSinceUpdate <= 7) {
        bActiveScore = 70;
      } else if (bDaysSinceUpdate <= 30) {
        bActiveScore = 50;
      }
      
      const bDaysSinceCreated = (now - bCreatedAt) / ONE_DAY;
      const bNewUserScore = bDaysSinceCreated <= 7 ? 30 : 0;
      
      const bScore = bExpScore + bActiveScore + bNewUserScore;
      
      // 按综合得分降序排序
      return bScore - aScore;
    };
    
    invitedOverlapList.sort(sortByMixedScore);
    overlapList.sort(sortByMixedScore);
    expList.sort(sortByMixedScore);
    jobList.sort(sortByMixedScore);
    otherList.sort(sortByMixedScore);
    
    // 使用动态配额限制返回的匹配数量
    const finalList = [...invitedOverlapList, ...overlapList, ...expList, ...jobList, ...otherList].slice(0, dailyLimit);
    return {
      success: true,
      matches: finalList.map(user => {
        const profile = user.profile as any;
        return {
          id: user.id,
          username: user.name,
          jobType: profile?.jobType,
          experienceLevel: profile?.experienceLevel,
          jobSeekingStatus: profile?.jobSeekingStatus,
          targetCompany: profile?.targetCompany,
          targetIndustry: profile?.targetIndustry,
          practicePreferences: {
            technicalInterview: profile?.technicalInterview,
            behavioralInterview: profile?.behavioralInterview,
            caseAnalysis: profile?.caseAnalysis,
            statsQuestions: profile?.statsQuestions,
          },
          bio: profile?.bio,
          skills: profile?.skills ? JSON.parse(profile.skills) : [],
        };
      })
    };
  } catch (error) {
    console.error('Get potential matches error:', error);
    return { success: false, message: '获取匹配失败，请稍后再试' };
  }
}

/**
 * 获取用户今日总配额（基础+奖励）
 */
async function getUserDailyMatchLimit(userId: number): Promise<number> {
  const ET_TIMEZONE = 'America/New_York';
  const now = new Date();
  const etDate = toZonedTime(now, ET_TIMEZONE);
  const today = format(etDate, 'yyyy-MM-dd');
  
  const BASE_LIMIT = 4; // 基础配额
  
  try {
    // 查询今天的bonus记录
    let bonus = await db.query.userDailyBonus.findFirst({
      where: and(
        eq(userDailyBonus.userId, userId),
        eq(userDailyBonus.date, today)
      ),
    });
    
    // 如果今天还没有记录，创建一个（继承昨天的bonus_balance）
    if (!bonus) {
      // 查询最近的bonus记录，获取余额
      const recentBonus = await db.query.userDailyBonus.findFirst({
        where: eq(userDailyBonus.userId, userId),
        orderBy: (table, { desc }) => [desc(table.date)],
      });

      const inheritedBalance = recentBonus?.bonusBalance || 0;

      // 创建今天的记录
      const newBonus = await db.insert(userDailyBonus).values({
        userId,
        date: today,
        postsToday: 0,
        commentsToday: 0,
        bonusQuota: 0,
        bonusBalance: inheritedBalance, // 继承昨天的余额
      }).returning();

      bonus = newBonus[0];
    }
    
    // 使用 bonusBalance（当前剩余配额）来确定实际能刷的人数
    // 这样返回的候选人数量就会和实际配额一致
    return BASE_LIMIT + (bonus?.bonusBalance || 0);
  } catch (error) {
    console.error('Error getting daily limit:', error);
    return BASE_LIMIT;
  }
}

/**
 * 记录用户今日浏览，带每日限制检查和防重复
 * @returns { success: true } 或 { success: false, message: string }
 */
async function recordDailyView(userId: number, targetUserId: number): Promise<{ success: boolean, message?: string }> {
  const ET_TIMEZONE = 'America/New_York';
  const now = new Date();
  const etDate = toZonedTime(now, ET_TIMEZONE);
  const today = format(etDate, 'yyyy-MM-dd');
  const BASE_LIMIT = 4;

  try {
    // 1. 检查是否已经记录过这个用户（避免重复）
    const existingView = await db.query.userDailyViews.findFirst({
      where: and(
        eq(userDailyViews.userId, userId),
        eq(userDailyViews.viewedUserId, targetUserId),
        eq(userDailyViews.date, today)
      ),
    });

    if (existingView) {
      return { success: true }; // 已记录，直接返回成功
    }

    // 2. 查询今天已浏览的记录
    const todayViews = await db.query.userDailyViews.findMany({
      where: and(
        eq(userDailyViews.userId, userId),
        eq(userDailyViews.date, today)
      ),
    });

    const currentViewCount = todayViews.length;

    // 3. 查询今日奖励配额（无论是否已用完基础配额）
    const bonus = await db.query.userDailyBonus.findFirst({
      where: and(
        eq(userDailyBonus.userId, userId),
        eq(userDailyBonus.date, today)
      ),
    });

    const bonusBalance = bonus?.bonusBalance || 0; // 剩余可用配额
    const bonusQuota = bonus?.bonusQuota || 0; // 今日获得的总奖励配额
    const totalQuota = BASE_LIMIT + bonusQuota; // 今日总配额（用于显示）
    const currentLimit = BASE_LIMIT + bonusBalance; // 当前可用上限（用于检查）

    // 4. 检查是否超过当前可用上限
    if (currentViewCount >= currentLimit) {
      return { 
        success: false, 
        message: `今日浏览次数已达上限（共${totalQuota}次）。💡 发布真题可获得更多配额！` 
      };
    }

    // 5. 如果已经用完基础配额，需要扣除奖励配额
    if (currentViewCount >= BASE_LIMIT) {
      if (bonus && bonusBalance > 0) {
        await db
          .update(userDailyBonus)
          .set({
            bonusBalance: bonusBalance - 1,
            updatedAt: new Date(),
          })
          .where(eq(userDailyBonus.id, bonus.id));
      } else {
        // 理论上不应该到这里，因为上面已经检查过了
        return { 
          success: false, 
          message: `今日浏览次数已达上限（共${BASE_LIMIT}次）。💡 发布真题可获得更多配额！` 
        };
      }
    }

    // 6. 插入浏览记录
    await db.insert(userDailyViews).values({
      userId,
      viewedUserId: targetUserId,
      date: today,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Record daily view error:', error);
    
    // 只有在唯一性约束冲突时才返回成功（说明已经记录过了）
    if (error?.code === '23505' || error?.message?.includes('unique')) {
      return { success: true };
    }
    
    // 其他错误返回失败
    return { 
      success: false, 
      message: '记录浏览失败，请稍后重试' 
    };
  }
}

// Create match (like a user) - 历史记录模式：始终插入新记录
export async function createMatch(userId: number, targetUserId: number) {
  try {
    // 记录今日浏览，带限制检查
    const viewResult = await recordDailyView(userId, targetUserId);
    if (!viewResult.success) {
      return { success: false, message: viewResult.message };
    }

    // 查询所有历史记录（双向查询，按时间倒序）
    const allRecords = await db.select()
      .from(matches)
      .where(matchBetweenUsers(userId, targetUserId))
      .orderBy(desc(matches.createdAt));

    // 按方向分类，找到最新记录
    const myRecords = allRecords.filter(m => m.user1Id === userId);
    const partnerRecords = allRecords.filter(m => m.user1Id === targetUserId);
    
    const myLatest = myRecords[0]; // 最新的记录（因为已按时间倒序）
    const partnerLatest = partnerRecords[0];

    // 检查是否已经有 accepted 记录
    const hasAccepted = allRecords.some(r => r.status === 'accepted');
    if (hasAccepted) {
      return successResponse({ match: true }, '已经匹配成功！');
    }

    // 情况1：对方最新操作是 like，且还没 accepted，双方匹配成功
    if (partnerLatest?.actionType === 'like' && partnerLatest.status !== 'accepted') {
      // 创建新的 accepted 记录（不修改旧记录）
      await db.insert(matches).values({
        user1Id: userId,
        user2Id: targetUserId,
        actionType: 'like',
        status: 'accepted',
      });
      
      //
      const baseUrl = process.env.NEXTAUTH_URL || 'https://mockpals.com';
      const matchesUrl = `${baseUrl}/matches`;
      
      // 查询双方用户信息
      const me = await db.query.users.findFirst({ where: eq(users.id, userId) });
      const partner = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });
      
      // 并行尝试发送邮件（有邮箱再发，失败不影响主流程）
      try {
        await Promise.all([
          me?.email ? emailService.sendMatchSuccessEmail(me.email, {
            partnerName: partner?.name || '对方',
            matchesUrl,
          }) : Promise.resolve(),
          partner?.email ? emailService.sendMatchSuccessEmail(partner.email, {
            partnerName: me?.name || '对方',
            matchesUrl,
          }) : Promise.resolve(),
        ]);
      } catch (e) {
        console.warn('发送匹配成功通知失败（忽略不中断）:', e);
      }

      return successResponse({ match: true }, '匹配成功！');
    }

    // 情况2：自己最新操作已经是 like，避免重复记录
    if (myLatest?.actionType === 'like') {
      return successResponse({ match: false }, '已收到你的喜欢！等待对方回应。');
    }

    // 情况3：创建新的 like 记录
    // （包括第一次 like，或者之前 dislike 现在改变主意）
    await db.insert(matches).values({
      user1Id: userId,
      user2Id: targetUserId,
      actionType: 'like',
      status: 'pending',
    });

    return successResponse({ match: false }, '已收到你的喜欢！等待对方回应。');
  } catch (error) {
    return errorResponse('操作失败，请稍后再试', error);
  }
}

// Reject match (dislike a user) - 历史记录模式：始终插入新记录
export async function rejectMatch(userId: number, targetUserId: number) {
  try {
    // 记录今日浏览，带限制检查
    const viewResult = await recordDailyView(userId, targetUserId);
    if (!viewResult.success) {
      return { success: false, message: viewResult.message };
    }

    // 查询所有历史记录（双向查询，按时间倒序）
    const allRecords = await db.select()
      .from(matches)
      .where(matchBetweenUsers(userId, targetUserId))
      .orderBy(desc(matches.createdAt));

    // 按方向分类，找到最新记录
    const myRecords = allRecords.filter(m => m.user1Id === userId);
    const partnerRecords = allRecords.filter(m => m.user1Id === targetUserId);
    
    const myLatest = myRecords[0];
    const partnerLatest = partnerRecords[0];

    // 检查是否已经有 accepted 记录
    const hasAccepted = allRecords.some(r => r.status === 'accepted');
    if (hasAccepted) {
      return { success: false, message: '该匹配已完成，无法修改' };
    }

    // 情况1：自己最新操作是 like，现在点击 dislike = 取消
    if (myLatest?.actionType === 'like') {
      // 创建 cancel 记录
      await db.insert(matches).values({
        user1Id: userId,
        user2Id: targetUserId,
        actionType: 'cancel',
        status: 'rejected',
      });
      return successResponse({}, '已取消对该用户的邀请');
    }

    // 情况2：自己最新操作已经是 dislike，避免重复记录
    if (myLatest?.actionType === 'dislike') {
      return successResponse({}, '操作成功');
    }

    // 情况3：对方最新操作是 like（对我发出邀请），我现在拒绝
    // 或者第一次操作，或者之前 like 过现在改变主意
    // 创建新的 dislike 记录
    await db.insert(matches).values({
      user1Id: userId,
      user2Id: targetUserId,
      actionType: 'dislike',
      status: 'rejected',
    });

    return successResponse({}, '操作成功');
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

    // 提取所有匹配用户的ID（去重）
    const matchedUserIds = [...new Set(successfulMatches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    ))];

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

    // 按用户去重：每个用户只保留一条记录（最新的）
    const uniqueMatchesByUser = new Map<number, typeof successfulMatches[0]>();
    for (const match of successfulMatches) {
      const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const existing = uniqueMatchesByUser.get(partnerId);
      // 如果不存在或当前记录更新，则更新
      if (!existing || (match.createdAt && existing.createdAt && match.createdAt > existing.createdAt)) {
        uniqueMatchesByUser.set(partnerId, match);
      }
    }

    // 组装返回数据
    const formattedMatches = Array.from(uniqueMatchesByUser.values())
      .map(match => {
        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const user = usersMap.get(partnerId);
        if (!user || !user.profile) return null;

        const profile = user.profile as any;
        
        // 获取该匹配的反馈信息
        const feedback = feedbacksMap.get(match.id);
        
        return {
          id: user.id, // 用户ID，用于显示
          matchId: match.id, // 匹配记录ID，用于状态更新
          username: user.name,
          jobType: profile.jobType,
          experienceLevel: profile.experienceLevel,
          jobSeekingStatus: profile.jobSeekingStatus,
          targetCompany: profile.targetCompany,
          targetIndustry: profile.targetIndustry,
          practicePreferences: {
            technicalInterview: profile.technicalInterview,
            behavioralInterview: profile.behavioralInterview,
            caseAnalysis: profile.caseAnalysis,
            statsQuestions: profile.statsQuestions,
          },
          contactInfo: {
            email: profile.email,
            wechat: profile.wechat,
            linkedin: profile.linkedin,
          },
          bio: profile.bio,
          skills: profile.skills ? JSON.parse(profile.skills) : [],
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