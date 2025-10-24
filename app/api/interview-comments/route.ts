import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { interviewComments, users, userInterviewPosts, interviewQuestions, userDailyBonus } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
  notifyCommentReply,
  notifyMentioned,
  notifyPostComment,
  parseMentions,
} from '@/lib/notification-service';

// POST - 创建评论
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户ID和姓名
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

    const currentUser = userResult[0];
    const userId = currentUser.id;
    const userName = currentUser.name || currentUser.email?.split('@')[0] || '用户';

    // 获取请求数据
    const body = await request.json();
    const {
      postType,
      postId,
      content,
      parentCommentId = null,
      isAnonymous = false,
    } = body;

    // 验证必填字段
    if (!postType || !postId || !content) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证帖子类型
    if (postType !== 'system' && postType !== 'user') {
      return NextResponse.json(
        { success: false, message: '无效的帖子类型' },
        { status: 400 }
      );
    }

    // 验证评论内容长度
    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, message: '评论内容不能超过1000字' },
        { status: 400 }
      );
    }

    // 插入评论
    const newComment = await db
      .insert(interviewComments)
      .values({
        userId,
        postType,
        postId: parseInt(postId),
        content,
        parentCommentId: parentCommentId ? parseInt(parentCommentId) : null,
        isAnonymous,
      })
      .returning();

    const commentData = (newComment as any)[0];

    // === 触发通知 ===
    try {
      // 1. 解析评论中的@提及
      const mentionedUserIds = await parseMentions(content);
      
      // 2. 通知被@的用户
      for (const mentionedUserId of mentionedUserIds) {
        await notifyMentioned(
          mentionedUserId,
          userId,
          userName,
          content,
          postType,
          parseInt(postId)
        );
      }

      // 3. 如果是回复评论，通知原评论作者
      if (parentCommentId) {
        const parentComment = await db
          .select({ userId: interviewComments.userId })
          .from(interviewComments)
          .where(eq(interviewComments.id, parseInt(parentCommentId)))
          .limit(1);

        if (parentComment.length > 0) {
          await notifyCommentReply(
            parentComment[0].userId,
            userId,
            userName,
            content,
            postType,
            parseInt(postId),
            commentData.id
          );
        }
      }

      // 4. 如果是直接评论题目（不是回复），通知题目作者
      if (!parentCommentId) {
        let postAuthorId: number | null = null;

        if (postType === 'user') {
          // 用户发布的题目
          const userPost = await db
            .select({ userId: userInterviewPosts.userId })
            .from(userInterviewPosts)
            .where(eq(userInterviewPosts.id, parseInt(postId)))
            .limit(1);
          
          if (userPost.length > 0) {
            postAuthorId = userPost[0].userId;
          }
        }
        // 系统题目没有作者，不需要通知

        if (postAuthorId && postAuthorId !== userId) {
          await notifyPostComment(
            postAuthorId,
            userId,
            userName,
            content,
            postType,
            parseInt(postId)
          );
        }
      }

      console.log('✅ [评论] 通知发送成功');
    } catch (notificationError) {
      console.error('⚠️ [评论] 发送通知失败（不影响评论发布）:', notificationError);
      // 通知失败不影响评论发布
    }

    // 检查并发放评论奖励配额
    const ET_TIMEZONE = 'America/New_York';
    const now = new Date();
    const etDate = toZonedTime(now, ET_TIMEZONE);
    const todayStr = format(etDate, 'yyyy-MM-dd');
    
    let bonusInfo = null;
    
    try {
      // 验证评论质量：至少10字
      if (content.trim().length >= 10) {
        // 查询今日是否已有记录
        const existingBonus = await db.query.userDailyBonus.findFirst({
          where: and(
            eq(userDailyBonus.userId, userId),
            eq(userDailyBonus.date, todayStr)
          ),
        });
        
        if (existingBonus) {
          // 更新评论数
          const newCommentsCount = existingBonus.commentsToday + 1;
          
          // 如果刚好达到3条，且余额未满，给予奖励
          if (newCommentsCount === 3 && existingBonus.bonusBalance < 6) {
            const newBalance = Math.min(existingBonus.bonusBalance + 1, 6);
            await db
              .update(userDailyBonus)
              .set({
                commentsToday: newCommentsCount,
                bonusQuota: existingBonus.bonusQuota + 1,
                bonusBalance: newBalance,
                updatedAt: new Date(),
              })
              .where(eq(userDailyBonus.id, existingBonus.id));
            
            bonusInfo = {
              earned: true,
              quota: 1,
              message: '🎉 恭喜！评论达到3条，获得+1个匹配配额',
              newBalance: newBalance,
            };
          } else if (newCommentsCount === 3 && existingBonus.bonusBalance >= 6) {
            // 达到3条但余额已满
            await db
              .update(userDailyBonus)
              .set({
                commentsToday: newCommentsCount,
                updatedAt: new Date(),
              })
              .where(eq(userDailyBonus.id, existingBonus.id));
            
            bonusInfo = {
              earned: false,
              message: '💰 奖励配额已满(6/6)，请先使用后再继续获取奖励',
            };
          } else {
            // 还没达到3条，或者已经超过3条
            await db
              .update(userDailyBonus)
              .set({
                commentsToday: newCommentsCount,
                updatedAt: new Date(),
              })
              .where(eq(userDailyBonus.id, existingBonus.id));
            
            if (newCommentsCount < 3) {
              bonusInfo = {
                earned: false,
                progress: newCommentsCount,
                total: 3,
                message: `还差${3 - newCommentsCount}条评论可获得+1配额`,
              };
            }
          }
        } else {
          // 创建新记录（继承昨天的余额）
          const recentBonus = await db.query.userDailyBonus.findFirst({
            where: eq(userDailyBonus.userId, userId),
            orderBy: (table, { desc }) => [desc(table.date)],
          });

          const inheritedBalance = recentBonus?.bonusBalance || 0;
          
          await db.insert(userDailyBonus).values({
            userId,
            date: todayStr,
            postsToday: 0,
            commentsToday: 1,
            bonusQuota: 0,
            bonusBalance: inheritedBalance,
          });
          
          bonusInfo = {
            earned: false,
            progress: 1,
            total: 3,
            message: '还差2条评论可获得+1配额',
          };
        }
      }
    } catch (bonusError) {
      console.error('Error awarding comment bonus:', bonusError);
      // 即使奖励发放失败，评论已经创建成功，不影响主流程
    }

    return NextResponse.json({
      success: true,
      message: '评论发布成功！',
      data: commentData,
      bonus: bonusInfo,
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    
    // 检查是否是表不存在的错误
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          message: '评论功能尚未启用。请联系管理员运行数据库迁移。',
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: '评论失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// GET - 获取评论列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postType = searchParams.get('postType');
    const postId = searchParams.get('postId');

    console.log('🔵 [评论API] 获取评论列表:', { postType, postId });

    if (!postType || !postId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 查询评论（包含用户信息）
    const comments = await db
      .select({
        id: interviewComments.id,
        userId: interviewComments.userId,
        postType: interviewComments.postType,
        postId: interviewComments.postId,
        content: interviewComments.content,
        parentCommentId: interviewComments.parentCommentId,
        isAnonymous: interviewComments.isAnonymous,
        createdAt: interviewComments.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(interviewComments)
      .leftJoin(users, eq(interviewComments.userId, users.id))
      .where(
        and(
          eq(interviewComments.postType, postType),
          eq(interviewComments.postId, parseInt(postId))
        )
      )
      .orderBy(desc(interviewComments.createdAt));

    // 获取评论总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviewComments)
      .where(
        and(
          eq(interviewComments.postType, postType),
          eq(interviewComments.postId, parseInt(postId))
        )
      );

    const total = totalResult[0]?.count || 0;

    console.log('✅ [评论API] 查询成功:', { total, commentsCount: comments.length });

    return NextResponse.json({
      success: true,
      data: {
        comments,
        total,
      },
    });
  } catch (error: any) {
    console.error('❌ [评论API] 获取评论失败:', error);
    
    // 检查是否是表不存在的错误
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.log('⚠️ [评论API] interview_comments 表不存在，返回空数据');
      // 返回空数据而不是错误，让页面能正常显示
      return NextResponse.json({
        success: true,
        data: {
          comments: [],
          total: 0,
        },
        warning: '评论功能尚未启用',
      });
    }
    
    // 其他错误也返回空数据，避免阻塞页面
    return NextResponse.json({
      success: true,
      data: {
        comments: [],
        total: 0,
      },
      error: '获取评论失败',
    });
  }
}

