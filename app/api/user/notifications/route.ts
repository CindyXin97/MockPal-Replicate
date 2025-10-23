import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { userNotifications, users } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// GET - 获取通知列表
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询条件
    const conditions = [
      eq(userNotifications.userId, userId),
      eq(userNotifications.isDeleted, false),
    ];

    if (unreadOnly) {
      conditions.push(eq(userNotifications.isRead, false));
    }

    // 查询通知列表
    const notifications = await db
      .select()
      .from(userNotifications)
      .where(and(...conditions))
      .orderBy(desc(userNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userNotifications)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // 获取未读数
    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, false),
          eq(userNotifications.isDeleted, false)
        )
      );

    const unreadCount = unreadResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('❌ [通知API] 获取通知失败:', error);
    return NextResponse.json(
      { success: false, message: '获取通知失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// POST - 标记通知为已读/删除
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
    const { action, notificationId, notificationIds } = body;

    if (!action || (!notificationId && !notificationIds && action !== 'mark_all_read')) {
      return NextResponse.json(
        { success: false, message: '参数错误' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'mark_read':
        // 标记单个通知为已读
        result = await db
          .update(userNotifications)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(userNotifications.id, notificationId),
              eq(userNotifications.userId, userId)
            )
          );
        break;

      case 'mark_all_read':
        // 标记所有未读通知为已读
        result = await db
          .update(userNotifications)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(userNotifications.userId, userId),
              eq(userNotifications.isRead, false),
              eq(userNotifications.isDeleted, false)
            )
          );
        break;

      case 'delete':
        // 软删除通知
        if (notificationIds && Array.isArray(notificationIds)) {
          // 批量删除
          result = await db
            .update(userNotifications)
            .set({ isDeleted: true })
            .where(
              and(
                eq(userNotifications.userId, userId),
                sql`${userNotifications.id} = ANY(${notificationIds})`
              )
            );
        } else {
          // 单个删除
          result = await db
            .update(userNotifications)
            .set({ isDeleted: true })
            .where(
              and(
                eq(userNotifications.id, notificationId),
                eq(userNotifications.userId, userId)
              )
            );
        }
        break;

      default:
        return NextResponse.json(
          { success: false, message: '未知操作' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: '操作成功',
    });
  } catch (error: any) {
    console.error('❌ [通知API] 操作失败:', error);
    return NextResponse.json(
      { success: false, message: '操作失败，请稍后重试' },
      { status: 500 }
    );
  }
}

