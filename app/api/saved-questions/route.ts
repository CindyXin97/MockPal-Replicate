import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { userSavedQuestions, users, interviewQuestions, userInterviewPosts, interviewVotes, interviewComments } from '@/lib/db/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';

// 获取用户收藏的题目列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 获取当前用户ID
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const currentUserId = userResult[0].id;

    // 获取筛选参数
    const { searchParams } = new URL(request.url);
    const questionType = searchParams.get('questionType'); // all, system, user
    const company = searchParams.get('company');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [eq(userSavedQuestions.userId, currentUserId)];
    
    // 如果有类型筛选
    if (questionType && questionType !== 'all') {
      conditions.push(eq(userSavedQuestions.questionType, questionType));
    }

    // 获取用户所有收藏的题目ID
    const savedQuestions = await db
      .select()
      .from(userSavedQuestions)
      .where(and(...conditions))
      .orderBy(desc(userSavedQuestions.createdAt));

    // 分别获取系统题目和用户发布的题目
    const systemQuestionIds = savedQuestions
      .filter(sq => sq.questionType === 'system')
      .map(sq => sq.questionId);
    
    const userQuestionIds = savedQuestions
      .filter(sq => sq.questionType === 'user')
      .map(sq => sq.questionId);

    let allQuestions: any[] = [];

    // 获取系统题目详情
    if (systemQuestionIds.length > 0) {
      const systemQuestions = await db
        .select()
        .from(interviewQuestions)
        .where(sql`${interviewQuestions.id} IN ${systemQuestionIds}`);

      // 为每个系统题目添加统计信息
      const systemQuestionsWithStats = await Promise.all(
        systemQuestions.map(async (question) => {
          // 获取投票统计
          const votesResult = await db
            .select({
              voteType: interviewVotes.voteType,
              count: sql<number>`count(*)::int`,
            })
            .from(interviewVotes)
            .where(
              and(
                eq(interviewVotes.postType, 'system'),
                eq(interviewVotes.postId, question.id)
              )
            )
            .groupBy(interviewVotes.voteType);

          const upvotes = votesResult.find(v => v.voteType === 'up')?.count || 0;
          const downvotes = votesResult.find(v => v.voteType === 'down')?.count || 0;

          // 获取评论数
          const commentsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(interviewComments)
            .where(
              and(
                eq(interviewComments.postType, 'system'),
                eq(interviewComments.postId, question.id)
              )
            );

          const comments = commentsResult[0]?.count || 0;

          // 获取用户的投票状态
          const userVoteResult = await db
            .select({ voteType: interviewVotes.voteType })
            .from(interviewVotes)
            .where(
              and(
                eq(interviewVotes.userId, currentUserId),
                eq(interviewVotes.postType, 'system'),
                eq(interviewVotes.postId, question.id)
              )
            )
            .limit(1);

          const userVote = userVoteResult[0]?.voteType || null;

          // 找到对应的收藏记录
          const savedRecord = savedQuestions.find(
            sq => sq.questionType === 'system' && sq.questionId === question.id
          );

          return {
            ...question,
            postType: 'system' as const,
            isOwnPost: false,
            savedAt: savedRecord?.createdAt,
            stats: {
              upvotes,
              downvotes,
              score: upvotes - downvotes,
              comments,
              views: 0,
            },
            userVote,
          };
        })
      );

      allQuestions.push(...systemQuestionsWithStats);
    }

    // 获取用户发布的题目详情
    if (userQuestionIds.length > 0) {
      const userQuestions = await db
        .select()
        .from(userInterviewPosts)
        .where(sql`${userInterviewPosts.id} IN ${userQuestionIds}`);

      // 为每个用户题目添加统计信息
      const userQuestionsWithStats = await Promise.all(
        userQuestions.map(async (question) => {
          // 获取投票统计
          const votesResult = await db
            .select({
              voteType: interviewVotes.voteType,
              count: sql<number>`count(*)::int`,
            })
            .from(interviewVotes)
            .where(
              and(
                eq(interviewVotes.postType, 'user'),
                eq(interviewVotes.postId, question.id)
              )
            )
            .groupBy(interviewVotes.voteType);

          const upvotes = votesResult.find(v => v.voteType === 'up')?.count || 0;
          const downvotes = votesResult.find(v => v.voteType === 'down')?.count || 0;

          // 获取评论数
          const commentsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(interviewComments)
            .where(
              and(
                eq(interviewComments.postType, 'user'),
                eq(interviewComments.postId, question.id)
              )
            );

          const comments = commentsResult[0]?.count || 0;

          // 获取用户的投票状态
          const userVoteResult = await db
            .select({ voteType: interviewVotes.voteType })
            .from(interviewVotes)
            .where(
              and(
                eq(interviewVotes.userId, currentUserId),
                eq(interviewVotes.postType, 'user'),
                eq(interviewVotes.postId, question.id)
              )
            )
            .limit(1);

          const userVote = userVoteResult[0]?.voteType || null;

          // 获取发布者信息（如果不是匿名）
          let userEmail = null;
          if (!question.isAnonymous) {
            const postUserResult = await db
              .select({ email: users.email })
              .from(users)
              .where(eq(users.id, question.userId))
              .limit(1);
            userEmail = postUserResult[0]?.email || null;
          }

          // 找到对应的收藏记录
          const savedRecord = savedQuestions.find(
            sq => sq.questionType === 'user' && sq.questionId === question.id
          );

          return {
            ...question,
            postType: 'user' as const,
            isOwnPost: question.userId === currentUserId,
            savedAt: savedRecord?.createdAt,
            userEmail,
            stats: {
              upvotes,
              downvotes,
              score: upvotes - downvotes,
              comments,
              views: question.viewsCount || 0,
            },
            userVote,
          };
        })
      );

      allQuestions.push(...userQuestionsWithStats);
    }

    // 按收藏时间排序
    allQuestions.sort((a, b) => {
      const dateA = new Date(a.savedAt).getTime();
      const dateB = new Date(b.savedAt).getTime();
      return dateB - dateA;
    });

    // 应用筛选
    let filteredQuestions = allQuestions;

    if (company && company !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.company === company);
    }

    if (difficulty && difficulty !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }

    // 分页
    const total = filteredQuestions.length;
    const paginatedQuestions = filteredQuestions.slice(offset, offset + limit);

    // 获取筛选选项（公司列表）
    const companies = [...new Set(allQuestions.map(q => q.company))];

    return NextResponse.json({
      success: true,
      data: {
        questions: paginatedQuestions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          companies: companies.sort(),
          questionTypes: ['technical', 'behavioral', 'case_study', 'stats'],
          difficulties: ['easy', 'medium', 'hard'],
        },
        stats: {
          total,
          systemCount: allQuestions.filter(q => q.postType === 'system').length,
          userCount: allQuestions.filter(q => q.postType === 'user').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching saved questions:', error);
    return NextResponse.json(
      { success: false, message: '获取收藏题目失败' },
      { status: 500 }
    );
  }
}

// 收藏题目
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 获取当前用户ID
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const currentUserId = userResult[0].id;

    // 获取请求参数
    const body = await request.json();
    const { questionType, questionId } = body;

    // 验证参数
    if (!questionType || !questionId) {
      return NextResponse.json(
        { success: false, message: '参数不完整' },
        { status: 400 }
      );
    }

    if (!['system', 'user'].includes(questionType)) {
      return NextResponse.json(
        { success: false, message: '题目类型无效' },
        { status: 400 }
      );
    }

    // 检查题目是否存在
    if (questionType === 'system') {
      const questionExists = await db
        .select({ id: interviewQuestions.id })
        .from(interviewQuestions)
        .where(eq(interviewQuestions.id, questionId))
        .limit(1);

      if (questionExists.length === 0) {
        return NextResponse.json(
          { success: false, message: '题目不存在' },
          { status: 404 }
        );
      }
    } else {
      const questionExists = await db
        .select({ id: userInterviewPosts.id })
        .from(userInterviewPosts)
        .where(eq(userInterviewPosts.id, questionId))
        .limit(1);

      if (questionExists.length === 0) {
        return NextResponse.json(
          { success: false, message: '题目不存在' },
          { status: 404 }
        );
      }
    }

    // 检查是否已经收藏
    const existingSave = await db
      .select()
      .from(userSavedQuestions)
      .where(
        and(
          eq(userSavedQuestions.userId, currentUserId),
          eq(userSavedQuestions.questionType, questionType),
          eq(userSavedQuestions.questionId, questionId)
        )
      )
      .limit(1);

    if (existingSave.length > 0) {
      return NextResponse.json(
        { success: false, message: '已经收藏过该题目' },
        { status: 400 }
      );
    }

    // 添加收藏
    await db.insert(userSavedQuestions).values({
      userId: currentUserId,
      questionType,
      questionId,
    });

    return NextResponse.json({
      success: true,
      message: '收藏成功',
    });
  } catch (error) {
    console.error('Error saving question:', error);
    return NextResponse.json(
      { success: false, message: '收藏失败' },
      { status: 500 }
    );
  }
}

// 取消收藏题目
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 获取当前用户ID
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const currentUserId = userResult[0].id;

    // 获取请求参数
    const { searchParams } = new URL(request.url);
    const questionType = searchParams.get('questionType');
    const questionId = searchParams.get('questionId');

    // 验证参数
    if (!questionType || !questionId) {
      return NextResponse.json(
        { success: false, message: '参数不完整' },
        { status: 400 }
      );
    }

    // 删除收藏
    const result = await db
      .delete(userSavedQuestions)
      .where(
        and(
          eq(userSavedQuestions.userId, currentUserId),
          eq(userSavedQuestions.questionType, questionType),
          eq(userSavedQuestions.questionId, parseInt(questionId))
        )
      );

    return NextResponse.json({
      success: true,
      message: '取消收藏成功',
    });
  } catch (error) {
    console.error('Error unsaving question:', error);
    return NextResponse.json(
      { success: false, message: '取消收藏失败' },
      { status: 500 }
    );
  }
}

