import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import {
  users,
  userAchievements,
  userDailyViews,
  matches,
  userInterviewPosts,
  interviewComments,
  interviewVotes,
  userNotifications,
} from '@/lib/db/schema';
import { eq, and, or, sql, desc } from 'drizzle-orm';
import { getUserAchievement } from '@/lib/achievements';

// GET - 获取用户完整统计数据
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户ID
    const userResult = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const user = userResult[0];
    const userId = user.id;

    // 1. 获取浏览统计（双向）
    const today = new Date().toISOString().split('T')[0];
    
    // 有多少人浏览了我
    const viewsOfMeResult = await db
      .selectDistinct({ userId: userDailyViews.userId })
      .from(userDailyViews)
      .where(eq(userDailyViews.viewedUserId, userId));
    const viewsOfMe = viewsOfMeResult.length;

    // 我浏览了多少人
    const myViewsResult = await db
      .selectDistinct({ viewedUserId: userDailyViews.viewedUserId })
      .from(userDailyViews)
      .where(eq(userDailyViews.userId, userId));
    const myViews = myViewsResult.length;
    
    // 总互动人数（去重）
    const allInteractedUsers = new Set([
      ...viewsOfMeResult.map(v => v.userId),
      ...myViewsResult.map(v => v.viewedUserId)
    ]);
    const totalInteractions = allInteractedUsers.size;

    // 今天的统计
    const todayViewsOfMeResult = await db
      .select()
      .from(userDailyViews)
      .where(
        and(
          eq(userDailyViews.viewedUserId, userId),
          eq(userDailyViews.date, today)
        )
      );
    const todayViewsOfMe = todayViewsOfMeResult.length;
    
    const todayMyViewsResult = await db
      .select()
      .from(userDailyViews)
      .where(
        and(
          eq(userDailyViews.userId, userId),
          eq(userDailyViews.date, today)
        )
      );
    const todayMyViews = todayMyViewsResult.length;

    // 2. 获取匹配统计
    const allMatches = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, userId)
        )
      );

    // 我点赞的总数（主动匹配）
    const totalLikes = allMatches.filter((m) => m.user1Id === userId).length;
    
    // 总匹配数
    const totalMatches = allMatches.length;
    
    // 匹配成功数
    const successfulMatches = allMatches.filter((m) => m.status === 'accepted').length;
    
    // 等待回应的数量（我发起但对方还没回应）
    const pendingMatches = allMatches.filter(
      (m) => m.status === 'pending' && m.user1Id === userId
    ).length;

    // 3. 获取成就和面试统计
    const achievement = await getUserAchievement(userId);

    // 3.5 计算周/月活动（包括发帖、评论、被浏览）
    let thisWeekActivity = 0;
    let lastWeekActivity = 0;
    let thisMonthActivity = 0;
    let lastMonthActivity = 0;
    
    let thisWeekPosts = 0;
    let lastWeekPosts = 0;
    let thisWeekComments = 0;
    let lastWeekComments = 0;
    let thisWeekViews = 0;
    let lastWeekViews = 0;
    
    let thisMonthPosts = 0;
    let lastMonthPosts = 0;
    let thisMonthComments = 0;
    let lastMonthComments = 0;
    let thisMonthViews = 0;
    let lastMonthViews = 0;
    
    try {
      const now = new Date();
      
      // 本周开始和结束（周一作为一周开始）
      const thisWeekStart = new Date(now);
      thisWeekStart.setHours(0, 0, 0, 0);
      const dayOfWeek = thisWeekStart.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周日特殊处理，周一为0
      thisWeekStart.setDate(thisWeekStart.getDate() - diff);
      
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 7);
      
      // 上周开始和结束
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      
      // 本月开始和结束
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // 上月开始和结束
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // 1. 计算发帖数
      const allPosts = await db
        .select()
        .from(userInterviewPosts)
        .where(eq(userInterviewPosts.userId, userId));
      
      thisWeekPosts = allPosts.filter(p => {
        if (!p.createdAt) return false;
        const postDate = new Date(p.createdAt);
        return postDate >= thisWeekStart && postDate < thisWeekEnd;
      }).length;
      
      lastWeekPosts = allPosts.filter(p => {
        if (!p.createdAt) return false;
        const postDate = new Date(p.createdAt);
        return postDate >= lastWeekStart && postDate < lastWeekEnd;
      }).length;
      
      thisMonthPosts = allPosts.filter(p => {
        if (!p.createdAt) return false;
        const postDate = new Date(p.createdAt);
        return postDate >= thisMonthStart && postDate < thisMonthEnd;
      }).length;
      
      lastMonthPosts = allPosts.filter(p => {
        if (!p.createdAt) return false;
        const postDate = new Date(p.createdAt);
        return postDate >= lastMonthStart && postDate < lastMonthEnd;
      }).length;
      
      // 2. 计算评论数
      const allComments = await db
        .select()
        .from(interviewComments)
        .where(eq(interviewComments.userId, userId));
      
      thisWeekComments = allComments.filter(c => {
        if (!c.createdAt) return false;
        const commentDate = new Date(c.createdAt);
        return commentDate >= thisWeekStart && commentDate < thisWeekEnd;
      }).length;
      
      lastWeekComments = allComments.filter(c => {
        if (!c.createdAt) return false;
        const commentDate = new Date(c.createdAt);
        return commentDate >= lastWeekStart && commentDate < lastWeekEnd;
      }).length;
      
      thisMonthComments = allComments.filter(c => {
        if (!c.createdAt) return false;
        const commentDate = new Date(c.createdAt);
        return commentDate >= thisMonthStart && commentDate < thisMonthEnd;
      }).length;
      
      lastMonthComments = allComments.filter(c => {
        if (!c.createdAt) return false;
        const commentDate = new Date(c.createdAt);
        return commentDate >= lastMonthStart && commentDate < lastMonthEnd;
      }).length;
      
      // 3. 计算我的浏览人数（主动行为，去重）
      const allMyViews = await db
        .select()
        .from(userDailyViews)
        .where(eq(userDailyViews.userId, userId));
      
      // 本周浏览的独立用户数
      const thisWeekViewedUsers = new Set(
        allMyViews
          .filter(v => {
            if (!v.createdAt) return false;
            const viewDate = new Date(v.createdAt);
            return viewDate >= thisWeekStart && viewDate < thisWeekEnd;
          })
          .map(v => v.viewedUserId)
      );
      thisWeekViews = thisWeekViewedUsers.size;
      
      // 上周浏览的独立用户数
      const lastWeekViewedUsers = new Set(
        allMyViews
          .filter(v => {
            if (!v.createdAt) return false;
            const viewDate = new Date(v.createdAt);
            return viewDate >= lastWeekStart && viewDate < lastWeekEnd;
          })
          .map(v => v.viewedUserId)
      );
      lastWeekViews = lastWeekViewedUsers.size;
      
      // 本月浏览的独立用户数
      const thisMonthViewedUsers = new Set(
        allMyViews
          .filter(v => {
            if (!v.createdAt) return false;
            const viewDate = new Date(v.createdAt);
            return viewDate >= thisMonthStart && viewDate < thisMonthEnd;
          })
          .map(v => v.viewedUserId)
      );
      thisMonthViews = thisMonthViewedUsers.size;
      
      // 上月浏览的独立用户数
      const lastMonthViewedUsers = new Set(
        allMyViews
          .filter(v => {
            if (!v.createdAt) return false;
            const viewDate = new Date(v.createdAt);
            return viewDate >= lastMonthStart && viewDate < lastMonthEnd;
          })
          .map(v => v.viewedUserId)
      );
      lastMonthViews = lastMonthViewedUsers.size;
      
      // 计算总活动数
      thisWeekActivity = thisWeekPosts + thisWeekComments + thisWeekViews;
      lastWeekActivity = lastWeekPosts + lastWeekComments + lastWeekViews;
      thisMonthActivity = thisMonthPosts + thisMonthComments + thisMonthViews;
      lastMonthActivity = lastMonthPosts + lastMonthComments + lastMonthViews;
      
    } catch (error) {
      console.error('❌ 计算周月活动失败:', error);
      // 使用默认值0
    }

    // 4. 获取社区统计
    // 发布的题目数
    const postsCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userInterviewPosts)
      .where(eq(userInterviewPosts.userId, userId));
    const postsCount = postsCountResult[0]?.count || 0;

    // 评论数
    const commentsCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviewComments)
      .where(eq(interviewComments.userId, userId));
    const commentsCount = commentsCountResult[0]?.count || 0;

    // 点赞数（我点过的）
    const votesGivenResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviewVotes)
      .where(
        and(
          eq(interviewVotes.userId, userId),
          eq(interviewVotes.voteType, 'up')
        )
      );
    const votesGiven = votesGivenResult[0]?.count || 0;

    // 收到的点赞数（别人对我内容的点赞）
    // 需要关联用户发布的题目和评论
    const votesReceivedQuery = sql`
      SELECT COUNT(*) as count
      FROM interview_votes v
      WHERE v.vote_type = 'up' AND (
        (v.post_type = 'user' AND v.post_id IN (
          SELECT id FROM user_interview_posts WHERE user_id = ${userId}
        ))
      )
    `;
    const votesReceivedResult: any = await db.execute(votesReceivedQuery);
    const votesReceived = votesReceivedResult[0]?.count || 0;

    // 5. 获取未读通知数
    const unreadNotificationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, false),
          eq(userNotifications.isDeleted, false)
        )
      );
    const unreadNotifications = unreadNotificationsResult[0]?.count || 0;

    // 6. 最近活动（最新的3个通知）
    const recentNotifications = await db
      .select()
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isDeleted, false)
        )
      )
      .orderBy(desc(userNotifications.createdAt))
      .limit(3);

    // 7. 计算百分位数
    // 获取所有用户的面试次数（用于计算百分位）
    let percentile = 0;
    try {
      const allUserAchievements = await db
        .select({
          totalInterviews: userAchievements.totalInterviews,
        })
        .from(userAchievements);
      
      // 计算有多少用户的面试次数少于当前用户
      const usersWithFewerInterviews = allUserAchievements.filter(
        a => (a.totalInterviews || 0) < achievement.totalInterviews
      ).length;
      
      const totalUsers = allUserAchievements.length || 1;
      percentile = Math.round((usersWithFewerInterviews / totalUsers) * 100);
    } catch (error) {
      console.error('❌ 计算面试百分位失败:', error);
      percentile = 0;
    }
    
    // 获取所有用户的匹配成功数（用于计算百分位）
    let matchPercentile = 0;
    try {
      const allUserMatchesQuery = await db.execute(sql`
        SELECT user_id, COUNT(*) as match_count
        FROM (
          SELECT user1_id as user_id FROM matches WHERE status = 'accepted'
          UNION ALL
          SELECT user2_id as user_id FROM matches WHERE status = 'accepted'
        ) as all_user_matches
        GROUP BY user_id
      `);
      
      const matchCounts = (allUserMatchesQuery.rows || allUserMatchesQuery).map((row: any) => Number(row.match_count || 0));
      const usersWithFewerMatches = matchCounts.filter(
        count => count < successfulMatches
      ).length;
      
      const totalMatchUsers = matchCounts.length || 1;
      matchPercentile = Math.round((usersWithFewerMatches / totalMatchUsers) * 100);
    } catch (error) {
      console.error('❌ 计算匹配百分位失败:', error);
      // 如果计算失败，设置为0，不影响其他功能
      matchPercentile = 0;
    }

    // 返回完整统计数据
    const responseData = {
      success: true,
      data: {
        user: {
          id: userId,
          name: user.name,
          email: user.email,
        },
        // 浏览统计
        views: {
          totalInteractions: totalInteractions, // 总互动人数
          viewsOfMe: viewsOfMe, // 访问我的人
          myViews: myViews, // 我浏览的人
          todayViewsOfMe: todayViewsOfMe, // 今天访问我的
          todayMyViews: todayMyViews, // 我今天浏览的
        },
        // 匹配统计
        matching: {
          totalLikes,
          totalMatches,
          successfulMatches,
          pendingMatches,
          percentile: matchPercentile, // 百分位数
        },
        // 活动统计
        activity: {
          // 周对比
          thisWeek: thisWeekActivity,
          lastWeek: lastWeekActivity,
          weekChange: lastWeekActivity > 0 
            ? Math.round(((thisWeekActivity - lastWeekActivity) / lastWeekActivity) * 100)
            : (thisWeekActivity > 0 ? 100 : 0),
          // 周详情
          thisWeekPosts,
          thisWeekComments,
          thisWeekViews,
          lastWeekPosts,
          lastWeekComments,
          lastWeekViews,
          // 月对比
          thisMonth: thisMonthActivity,
          lastMonth: lastMonthActivity,
          monthChange: lastMonthActivity > 0
            ? Math.round(((thisMonthActivity - lastMonthActivity) / lastMonthActivity) * 100)
            : (thisMonthActivity > 0 ? 100 : 0),
          // 月详情
          thisMonthPosts,
          thisMonthComments,
          thisMonthViews,
          lastMonthPosts,
          lastMonthComments,
          lastMonthViews,
        },
        // 面试统计
        interviews: {
          completed: achievement.totalInterviews,
          experiencePoints: achievement.experiencePoints,
          currentLevel: achievement.currentLevel,
          percentile: percentile, // 百分位数
        },
        // 社区统计
        community: {
          postsCount,
          commentsCount,
          votesGiven,
          votesReceived,
        },
        // 通知统计
        notifications: {
          unreadCount: unreadNotifications,
          recent: recentNotifications,
        },
      },
    };
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ [统计API] 获取数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取统计数据失败，请稍后重试' },
      { status: 500 }
    );
  }
}

