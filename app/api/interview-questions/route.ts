import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { interviewQuestions, userInterviewPosts, users, interviewVotes, interviewComments } from '@/lib/db/schema';
import { and, eq, like, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    const { searchParams } = new URL(request.url);
    
    // 获取筛选参数
    const company = searchParams.get('company');
    const position = searchParams.get('position');
    const questionType = searchParams.get('questionType');
    const difficulty = searchParams.get('difficulty');
    const year = searchParams.get('year');
    const includeUserPosts = searchParams.get('includeUserPosts') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
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

    // 构建查询条件
    const conditions = [];
    
    if (company && company !== 'all') {
      conditions.push(eq(interviewQuestions.company, company));
    }
    
    if (position && position !== 'all') {
      conditions.push(eq(interviewQuestions.position, position));
    }
    
    if (questionType && questionType !== 'all') {
      conditions.push(eq(interviewQuestions.questionType, questionType));
    }
    
    if (difficulty && difficulty !== 'all') {
      conditions.push(eq(interviewQuestions.difficulty, difficulty));
    }
    
    if (year && year !== 'all') {
      conditions.push(eq(interviewQuestions.year, parseInt(year)));
    }

    // 查询系统题目数据
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const systemQuestions = await db
      .select()
      .from(interviewQuestions)
      .where(whereClause)
      .orderBy(desc(interviewQuestions.year), desc(interviewQuestions.createdAt));
    
    console.log(`📊 查询到系统题目数: ${systemQuestions.length}`);

    // 如果包含用户发帖，查询用户发布的题目
    let userPosts: any[] = [];
    let ownPosts: any[] = [];
    
    if (includeUserPosts) {
      try {
        // 构建用户题目的查询条件
        const userPostConditions = [eq(userInterviewPosts.status, 'active')];
        
        if (company && company !== 'all') {
          userPostConditions.push(eq(userInterviewPosts.company, company));
        }
        
        if (position && position !== 'all') {
          userPostConditions.push(eq(userInterviewPosts.position, position));
        }
        
        if (questionType && questionType !== 'all') {
          userPostConditions.push(eq(userInterviewPosts.questionType, questionType));
        }
        
        if (difficulty && difficulty !== 'all') {
          userPostConditions.push(eq(userInterviewPosts.difficulty, difficulty));
        }

        const userPostWhereClause = userPostConditions.length > 0 ? and(...userPostConditions) : undefined;
        
        // 查询用户发布的题目
        const allUserPosts = await db
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
            userName: users.name,
            userEmail: users.email,
          })
          .from(userInterviewPosts)
          .leftJoin(users, eq(userInterviewPosts.userId, users.id))
          .where(userPostWhereClause)
          .orderBy(desc(userInterviewPosts.createdAt));

        // 分离当前用户的帖子和其他用户的帖子
        if (currentUserId) {
          ownPosts = allUserPosts
            .filter((post) => post.userId === currentUserId)
            .map((post) => ({
              ...post,
              postType: 'user',
              year: new Date(post.interviewDate).getFullYear(),
              isOwnPost: true,
            }));
          
          const otherUserPosts = allUserPosts
            .filter((post) => post.userId !== currentUserId)
            .map((post) => ({
              ...post,
              postType: 'user',
              year: new Date(post.interviewDate).getFullYear(),
              isOwnPost: false,
            }));
          
          // 对其他用户的帖子按热度排序
          const userPostsWithStats = await Promise.all(
            otherUserPosts.map(async (post) => {
              const postType = 'user';
              const postId = post.id;

              // 获取投票统计
              const upvotesResult = await db
                .select({ count: sql<number>`count(*)` })
                .from(interviewVotes)
                .where(
                  and(
                    eq(interviewVotes.postType, postType),
                    eq(interviewVotes.postId, postId),
                    eq(interviewVotes.voteType, 'up')
                  )
                );

              const downvotesResult = await db
                .select({ count: sql<number>`count(*)` })
                .from(interviewVotes)
                .where(
                  and(
                    eq(interviewVotes.postType, postType),
                    eq(interviewVotes.postId, postId),
                    eq(interviewVotes.voteType, 'down')
                  )
                );

              // 获取评论数
              const commentsResult = await db
                .select({ count: sql<number>`count(*)` })
                .from(interviewComments)
                .where(
                  and(
                    eq(interviewComments.postType, postType),
                    eq(interviewComments.postId, postId)
                  )
                );

              const upvotes = upvotesResult[0]?.count || 0;
              const downvotes = downvotesResult[0]?.count || 0;
              const comments = commentsResult[0]?.count || 0;
              const score = upvotes - downvotes;
              
              // 热度计算：score * 2 + comments（点赞权重更高）
              const hotness = score * 2 + comments;

              return {
                ...post,
                tempStats: { upvotes, downvotes, comments, score, hotness }
              };
            })
          );

          // 按热度排序用户帖子（热度高的在前）
          userPosts = userPostsWithStats.sort((a, b) => {
            return (b.tempStats?.hotness || 0) - (a.tempStats?.hotness || 0);
          });

          console.log('📊 其他用户发布的题目已按热度排序');
        } else {
          userPosts = allUserPosts.map((post) => ({
            ...post,
            postType: 'user',
            year: new Date(post.interviewDate).getFullYear(),
            isOwnPost: false,
          }));
        }
        
        console.log(`📊 查询到用户发布题目数: ${allUserPosts.length}`);
      } catch (error) {
        console.error('⚠️ 查询用户发布题目失败（表可能不存在，将只显示系统题目）:', error);
        // 如果查询失败（比如表不存在），继续使用空数组，不影响系统题目显示
      }
    }

    // 标记系统题目
    const systemQuestionsWithType = systemQuestions.map((q) => ({
      ...q,
      postType: 'system',
      isOwnPost: false,
    }));

    // 如果启用用户发帖，需要先获取所有题目的stats，然后对系统题目按热度排序
    let sortedSystemQuestions = systemQuestionsWithType;
    
    if (includeUserPosts) {
      try {
        // 获取所有系统题目的统计数据
        const systemQuestionsWithStats = await Promise.all(
          systemQuestionsWithType.map(async (question) => {
            const postType = 'system';
            const postId = question.id;

            // 获取投票统计
            const upvotesResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(interviewVotes)
              .where(
                and(
                  eq(interviewVotes.postType, postType),
                  eq(interviewVotes.postId, postId),
                  eq(interviewVotes.voteType, 'up')
                )
              );

            const downvotesResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(interviewVotes)
              .where(
                and(
                  eq(interviewVotes.postType, postType),
                  eq(interviewVotes.postId, postId),
                  eq(interviewVotes.voteType, 'down')
                )
              );

            // 获取评论数
            const commentsResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(interviewComments)
              .where(
                and(
                  eq(interviewComments.postType, postType),
                  eq(interviewComments.postId, postId)
                )
              );

            const upvotes = upvotesResult[0]?.count || 0;
            const downvotes = downvotesResult[0]?.count || 0;
            const comments = commentsResult[0]?.count || 0;
            const score = upvotes - downvotes;
            
            // 热度计算：score * 2 + comments（点赞权重更高）
            const hotness = score * 2 + comments;

            return {
              ...question,
              tempStats: { upvotes, downvotes, comments, score, hotness }
            };
          })
        );

        // 按热度排序系统题目（热度高的在前）
        sortedSystemQuestions = systemQuestionsWithStats.sort((a, b) => {
          return (b.tempStats?.hotness || 0) - (a.tempStats?.hotness || 0);
        });

        console.log('📊 系统题目已按热度排序');
      } catch (error) {
        console.error('⚠️ 获取系统题目统计失败，使用默认排序:', error);
      }
    }

    // 合并所有题目：我的发布 > 其他用户分享 > 系统精选（按热度）
    let allQuestions = [...ownPosts, ...userPosts, ...sortedSystemQuestions];

    // 获取投票和评论统计（为分页后的题目添加完整stats和userVote）
    let questionsWithStats = allQuestions.slice(offset, offset + limit);
    
    if (includeUserPosts) {
      // 只有启用用户发帖时才查询统计数据
      try {
        questionsWithStats = await Promise.all(
          allQuestions.slice(offset, offset + limit).map(async (question) => {
            const postType = question.postType;
            const postId = question.id;

            // 获取投票统计
            const upvotesResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(interviewVotes)
              .where(
                and(
                  eq(interviewVotes.postType, postType),
                  eq(interviewVotes.postId, postId),
                  eq(interviewVotes.voteType, 'up')
                )
              );

            const downvotesResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(interviewVotes)
              .where(
                and(
                  eq(interviewVotes.postType, postType),
                  eq(interviewVotes.postId, postId),
                  eq(interviewVotes.voteType, 'down')
                )
              );

            // 获取评论数
            const commentsResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(interviewComments)
              .where(
                and(
                  eq(interviewComments.postType, postType),
                  eq(interviewComments.postId, postId)
                )
              );

            // 获取当前用户的投票状态
            let userVote = null;
            if (currentUserId) {
              const userVoteResult = await db
                .select({ voteType: interviewVotes.voteType })
                .from(interviewVotes)
                .where(
                  and(
                    eq(interviewVotes.userId, currentUserId),
                    eq(interviewVotes.postType, postType),
                    eq(interviewVotes.postId, postId)
                  )
                )
                .limit(1);

              if (userVoteResult.length > 0) {
                userVote = userVoteResult[0].voteType;
              }
            }

            const upvotes = upvotesResult[0]?.count || 0;
            const downvotes = downvotesResult[0]?.count || 0;
            const comments = commentsResult[0]?.count || 0;

            // 移除临时stats
            const { tempStats, ...cleanQuestion } = question as any;

            return {
              ...cleanQuestion,
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
      } catch (error) {
        console.error('Error fetching stats:', error);
        // 如果统计查询失败，返回没有统计信息的题目
      }
    }

    const total = allQuestions.length;
    
    console.log(`📊 总题目数: ${total}, 当前页: ${page}, 返回题目数: ${questionsWithStats.length}`);

    // 获取筛选选项数据
    const companiesResult = await db
      .selectDistinct({ company: interviewQuestions.company })
      .from(interviewQuestions)
      .orderBy(interviewQuestions.company);
    
    const positionsResult = await db
      .selectDistinct({ position: interviewQuestions.position })
      .from(interviewQuestions)
      .orderBy(interviewQuestions.position);
    
    const yearsResult = await db
      .selectDistinct({ year: interviewQuestions.year })
      .from(interviewQuestions)
      .orderBy(desc(interviewQuestions.year));

    const companies = companiesResult.map(r => r.company);
    const positions = positionsResult.map(r => r.position);
    const years = yearsResult.map(r => r.year);

    return NextResponse.json({
      success: true,
      data: {
        questions: questionsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          companies,
          positions,
          years,
          questionTypes: ['technical', 'behavioral', 'case_study', 'stats'],
          difficulties: ['easy', 'medium', 'hard']
        },
        currentUserId,
      }
    });
  } catch (error) {
    console.error('Error fetching interview questions:', error);
    return NextResponse.json(
      { success: false, message: '获取面试真题失败' },
      { status: 500 }
    );
  }
} 