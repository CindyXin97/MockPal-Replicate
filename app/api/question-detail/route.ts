import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { interviewQuestions, userInterviewPosts, users, interviewVotes, interviewComments } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const { searchParams } = new URL(request.url);
    
    const postType = searchParams.get('postType');
    const postId = searchParams.get('postId');

    if (!postType || !postId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (postType !== 'system' && postType !== 'user') {
      return NextResponse.json(
        { success: false, message: '无效的题目类型' },
        { status: 400 }
      );
    }

    // 获取当前用户ID
    let currentUserId: number | null = null;
    if (session?.user?.email) {
      const userResult = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);
      if (userResult.length > 0) {
        currentUserId = userResult[0].id;
      }
    }

    let question: any = null;

    // 根据类型查询题目
    if (postType === 'system') {
      const result = await db
        .select()
        .from(interviewQuestions)
        .where(eq(interviewQuestions.id, parseInt(postId)))
        .limit(1);

      if (result.length > 0) {
        question = {
          ...result[0],
          postType: 'system',
          isOwnPost: false,
        };
      }
    } else {
      try {
        const result = await db
          .select({
            id: userInterviewPosts.id,
            userId: userInterviewPosts.userId,
            company: userInterviewPosts.company,
            position: userInterviewPosts.position,
            questionType: userInterviewPosts.questionType,
            difficulty: userInterviewPosts.difficulty,
            question: userInterviewPosts.question,
            recommendedAnswer: userInterviewPosts.recommendedAnswer,
            isAnonymous: userInterviewPosts.isAnonymous,
            viewsCount: userInterviewPosts.viewsCount,
            createdAt: userInterviewPosts.createdAt,
            interviewDate: userInterviewPosts.interviewDate,
            status: userInterviewPosts.status,
            userName: users.name,
            userEmail: users.email,
          })
          .from(userInterviewPosts)
          .leftJoin(users, eq(userInterviewPosts.userId, users.id))
          .where(
            and(
              eq(userInterviewPosts.id, parseInt(postId)),
              eq(userInterviewPosts.status, 'active')
            )
          )
          .limit(1);

        if (result.length > 0) {
          question = {
            ...result[0],
            postType: 'user',
            year: new Date(result[0].interviewDate).getFullYear(),
            isOwnPost: currentUserId === result[0].userId,
          };
        }
      } catch (error) {
        console.error('查询用户题目失败:', error);
        return NextResponse.json(
          { success: false, message: '该功能暂未启用' },
          { status: 404 }
        );
      }
    }

    if (!question) {
      return NextResponse.json(
        { success: false, message: '题目不存在' },
        { status: 404 }
      );
    }

    // 获取统计信息（尝试，如果表不存在也不影响）
    let stats = {
      upvotes: 0,
      downvotes: 0,
      score: 0,
      comments: 0,
      views: question.viewsCount || 0,
    };

    let userVote = null;

    try {
      console.log('🔵 [题目详情API] 开始获取统计信息:', { postType, postId, currentUserId });
      
      let upvotes = 0;
      let downvotes = 0;
      let comments = 0;

      // 获取点赞数（使用独立的 try-catch）
      try {
        const upvotesResult = await db
          .select({ count: sql<string>`cast(count(*) as text)` })
          .from(interviewVotes)
          .where(
            and(
              eq(interviewVotes.postType, postType),
              eq(interviewVotes.postId, parseInt(postId)),
              eq(interviewVotes.voteType, 'up')
            )
          );
        upvotes = Number(upvotesResult[0]?.count || 0);
        console.log('🔵 [题目详情API] upvotesResult:', upvotesResult, '→ upvotes:', upvotes);
      } catch (error) {
        console.log('⚠️ [题目详情API] 获取点赞数失败:', error);
      }

      // 获取踩数（使用独立的 try-catch）
      try {
        const downvotesResult = await db
          .select({ count: sql<string>`cast(count(*) as text)` })
          .from(interviewVotes)
          .where(
            and(
              eq(interviewVotes.postType, postType),
              eq(interviewVotes.postId, parseInt(postId)),
              eq(interviewVotes.voteType, 'down')
            )
          );
        downvotes = Number(downvotesResult[0]?.count || 0);
        console.log('🔵 [题目详情API] downvotesResult:', downvotesResult, '→ downvotes:', downvotes);
      } catch (error) {
        console.log('⚠️ [题目详情API] 获取踩数失败:', error);
      }

      // 获取评论数（使用独立的 try-catch，允许失败）
      try {
        const commentsResult = await db
          .select({ count: sql<string>`cast(count(*) as text)` })
          .from(interviewComments)
          .where(
            and(
              eq(interviewComments.postType, postType),
              eq(interviewComments.postId, parseInt(postId))
            )
          );
        comments = Number(commentsResult[0]?.count || 0);
        console.log('🔵 [题目详情API] commentsResult:', commentsResult, '→ comments:', comments);
      } catch (error) {
        console.log('⚠️ [题目详情API] 获取评论数失败（表可能不存在）:', error);
        // 评论表不存在是预期的，不影响其他数据
      }

      // 获取当前用户的投票状态（使用独立的 try-catch）
      if (currentUserId) {
        try {
          const userVoteResult = await db
            .select({ voteType: interviewVotes.voteType })
            .from(interviewVotes)
            .where(
              and(
                eq(interviewVotes.userId, currentUserId),
                eq(interviewVotes.postType, postType),
                eq(interviewVotes.postId, parseInt(postId))
              )
            )
            .limit(1);

          if (userVoteResult.length > 0) {
            userVote = userVoteResult[0].voteType;
          }
          console.log('🔵 [题目详情API] 用户投票状态:', userVote);
        } catch (error) {
          console.log('⚠️ [题目详情API] 获取用户投票状态失败:', error);
        }
      }

      // 组合统计信息
      stats = {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        comments,
        views: question.viewsCount || 0,
      };
      
      console.log('✅ [题目详情API] 最终统计信息:', stats);
    } catch (error) {
      console.log('❌ [题目详情API] 获取统计信息失败:', error);
      // 使用默认的空统计信息
    }

    return NextResponse.json({
      success: true,
      data: {
        ...question,
        stats,
        userVote,
      },
    });
  } catch (error) {
    console.error('Error fetching question detail:', error);
    return NextResponse.json(
      { success: false, message: '获取题目详情失败' },
      { status: 500 }
    );
  }
}

