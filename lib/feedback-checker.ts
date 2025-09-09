import { db } from '@/lib/db';
import { matches, feedbacks, users } from '@/lib/db/schema';
import { eq, and, notExists } from 'drizzle-orm';

// 检查用户是否有未反馈的匹配
export async function getUserPendingFeedback(userId: number) {
  try {
    // 查找用户的成功匹配中没有提供反馈的
    const pendingMatches = await db
      .select({
        id: matches.id,
        user1Id: matches.user1Id,
        user2Id: matches.user2Id,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .where(
        and(
          // 用户参与的匹配
          eq(matches.status, 'accepted'),
          // 匹配中包含当前用户
          eq(matches.user2Id, userId),
          // 该匹配没有来自当前用户的反馈
          notExists(
            db.select()
              .from(feedbacks)
              .where(
                and(
                  eq(feedbacks.matchId, matches.id),
                  eq(feedbacks.userId, userId)
                )
              )
          )
        )
      )
      .orderBy(matches.createdAt)
      .limit(1); // 只返回最早的一个未反馈匹配

    return pendingMatches[0] || null;
  } catch (error) {
    console.error('Error checking pending feedback:', error);
    return null;
  }
}

// 获取匹配的对方用户信息
export async function getMatchPartnerInfo(matchId: number, currentUserId: number) {
  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
    });

    if (!match) return null;

    // 确定对方用户ID
    const partnerUserId = match.user1Id === currentUserId ? match.user2Id : match.user1Id;
    
    // 获取对方用户信息
    const partnerUser = await db.query.users.findFirst({
      where: eq(users.id, partnerUserId),
      with: {
        profile: true,
      },
    });

    if (!partnerUser) return null;
    
    return {
      id: partnerUser.id,
      name: partnerUser.name,
      profile: partnerUser.profile,
    };
  } catch (error) {
    console.error('Error getting match partner info:', error);
    return null;
  }
}

// 提交反馈
export async function submitFeedback(
  matchId: number, 
  userId: number, 
  interviewCompleted: boolean, 
  content?: string
) {
  try {
    const feedback = await db.insert(feedbacks).values({
      matchId,
      userId,
      interviewStatus: interviewCompleted ? 'yes' : 'no',
      content: content || null,
    }).returning();

    return feedback[0];
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
} 