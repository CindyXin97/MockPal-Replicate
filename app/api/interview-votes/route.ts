import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { interviewVotes, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// POST - 点赞/踩
export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [投票API] 收到投票请求');
    
    const session = await getServerSession(authOptions);
    console.log('🔵 [投票API] Session:', session?.user?.email ? `用户: ${session.user.email}` : '未登录');

    if (!session?.user?.email) {
      console.log('❌ [投票API] 用户未登录');
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户ID
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!userResult.length) {
      console.log('❌ [投票API] 用户不存在:', session.user.email);
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const userId = userResult[0].id;
    console.log('🔵 [投票API] 用户ID:', userId);

    // 获取请求数据
    const body = await request.json();
    const { postType, postId, voteType } = body;
    console.log('🔵 [投票API] 请求参数:', { postType, postId, voteType });

    // 验证必填字段
    if (!postType || !postId || !voteType) {
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

    // 验证投票类型
    if (voteType !== 'up' && voteType !== 'down') {
      return NextResponse.json(
        { success: false, message: '无效的投票类型' },
        { status: 400 }
      );
    }

    // 检查是否已经投票
    console.log('🔵 [投票API] 检查是否已投票...');
    const existingVote = await db
      .select()
      .from(interviewVotes)
      .where(
        and(
          eq(interviewVotes.userId, userId),
          eq(interviewVotes.postType, postType),
          eq(interviewVotes.postId, parseInt(postId))
        )
      )
      .limit(1);

    console.log('🔵 [投票API] 已存在的投票:', existingVote.length > 0 ? existingVote[0] : '无');

    if (existingVote.length > 0) {
      // 如果投票类型相同，则取消投票
      if (existingVote[0].voteType === voteType) {
        console.log('🔵 [投票API] 取消投票');
        await db
          .delete(interviewVotes)
          .where(
            and(
              eq(interviewVotes.userId, userId),
              eq(interviewVotes.postType, postType),
              eq(interviewVotes.postId, parseInt(postId))
            )
          );

        console.log('✅ [投票API] 投票已取消');
        return NextResponse.json({
          success: true,
          message: '已取消投票',
          action: 'removed',
        });
      } else {
        // 如果投票类型不同，则更新投票
        console.log('🔵 [投票API] 更新投票:', voteType);
        await db
          .update(interviewVotes)
          .set({ voteType, updatedAt: new Date() })
          .where(
            and(
              eq(interviewVotes.userId, userId),
              eq(interviewVotes.postType, postType),
              eq(interviewVotes.postId, parseInt(postId))
            )
          );

        console.log('✅ [投票API] 投票已更新');
        return NextResponse.json({
          success: true,
          message: '投票已更新',
          action: 'updated',
        });
      }
    } else {
      // 插入新投票
      console.log('🔵 [投票API] 插入新投票:', { userId, postType, postId: parseInt(postId), voteType });
      const result = await db.insert(interviewVotes).values({
        userId,
        postType,
        postId: parseInt(postId),
        voteType,
      });

      console.log('✅ [投票API] 投票成功，返回结果');
      return NextResponse.json({
        success: true,
        message: '投票成功',
        action: 'created',
      });
    }
  } catch (error: any) {
    console.error('❌ [投票API] 错误:', error);
    console.error('❌ [投票API] 错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // 检查是否是表不存在的错误
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.error('❌ [投票API] 数据库表不存在');
      return NextResponse.json(
        { 
          success: false, 
          message: '投票功能尚未启用。请运行数据库迁移来创建必要的表。',
          hint: '请联系管理员在数据库中执行社区功能迁移脚本'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: '投票失败，请稍后重试', error: error.message },
      { status: 500 }
    );
  }
}

// GET - 获取投票统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postType = searchParams.get('postType');
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId'); // 可选，用于检查用户是否已投票

    if (!postType || !postId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取赞和踩的数量
    const upvotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviewVotes)
      .where(
        and(
          eq(interviewVotes.postType, postType),
          eq(interviewVotes.postId, parseInt(postId)),
          eq(interviewVotes.voteType, 'up')
        )
      );

    const downvotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviewVotes)
      .where(
        and(
          eq(interviewVotes.postType, postType),
          eq(interviewVotes.postId, parseInt(postId)),
          eq(interviewVotes.voteType, 'down')
        )
      );

    const upvotes = upvotesResult[0]?.count || 0;
    const downvotes = downvotesResult[0]?.count || 0;

    // 如果提供了userId，检查用户的投票状态
    let userVote = null;
    if (userId) {
      const userVoteResult = await db
        .select({ voteType: interviewVotes.voteType })
        .from(interviewVotes)
        .where(
          and(
            eq(interviewVotes.userId, parseInt(userId)),
            eq(interviewVotes.postType, postType),
            eq(interviewVotes.postId, parseInt(postId))
          )
        )
        .limit(1);

      if (userVoteResult.length > 0) {
        userVote = userVoteResult[0].voteType;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote,
      },
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { success: false, message: '获取投票统计失败' },
      { status: 500 }
    );
  }
}

