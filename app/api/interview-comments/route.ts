import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { interviewComments, users } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

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

    // 获取用户ID
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const userId = userResult[0].id;

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

    return NextResponse.json({
      success: true,
      message: '评论发布成功！',
      data: newComment[0],
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

