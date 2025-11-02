import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateUserInviteCode, getInviteCodeStats } from '@/lib/invite-codes';

// GET - 获取用户的邀请码信息
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const stats = await getInviteCodeStats(user.id);

    if (!stats) {
      return NextResponse.json(
        { success: false, message: '获取邀请码信息失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting invite code:', error);
    return NextResponse.json(
      { success: false, message: '获取邀请码信息失败' },
      { status: 500 }
    );
  }
}

