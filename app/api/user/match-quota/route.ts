import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { users, userDailyViews, userDailyBonus } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// GET - 获取用户今日配额信息
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

    const ET_TIMEZONE = 'America/New_York';
    const now = new Date();
    const etDate = toZonedTime(now, ET_TIMEZONE);
    const today = format(etDate, 'yyyy-MM-dd');

    // 获取今日已使用配额
    const todayViews = await db.query.userDailyViews.findMany({
      where: and(
        eq(userDailyViews.userId, user.id),
        eq(userDailyViews.date, today)
      ),
    });

    // 获取今日奖励配额信息
    let bonus = await db.query.userDailyBonus.findFirst({
      where: and(
        eq(userDailyBonus.userId, user.id),
        eq(userDailyBonus.date, today)
      ),
    });

    // 如果今天还没有记录，创建一个（继承昨天的bonus_balance）
    if (!bonus) {
      // 查询最近的bonus记录，获取余额
      const recentBonus = await db.query.userDailyBonus.findFirst({
        where: eq(userDailyBonus.userId, user.id),
        orderBy: (table, { desc }) => [desc(table.date)],
      });

      const inheritedBalance = recentBonus?.bonusBalance || 0;

      // 创建今天的记录
      const newBonus = await db.insert(userDailyBonus).values({
        userId: user.id,
        date: today,
        postsToday: 0,
        commentsToday: 0,
        bonusQuota: 0,
        bonusBalance: inheritedBalance, // 继承昨天的余额
      }).returning();

      bonus = newBonus[0];
    }

    const BASE_LIMIT = 4;
    const bonusBalance = bonus?.bonusBalance || 0; // 使用bonusBalance（当前剩余配额）
    const bonusQuota = bonus?.bonusQuota || 0; // 今日新增配额（用于显示任务奖励）
    const totalLimit = BASE_LIMIT + bonusBalance; // 当前实际能刷的总人数
    const used = todayViews.length;
    const remaining = Math.max(0, totalLimit - used);

    return NextResponse.json({
      success: true,
      data: {
        base: BASE_LIMIT,
        bonus: bonusBalance, // 显示当前剩余的奖励配额
        total: totalLimit,
        used: used,
        remaining: remaining,
        progress: {
          posts: {
            current: bonus?.postsToday || 0,
            required: 1,
            reward: 2,
          },
          comments: {
            current: bonus?.commentsToday || 0,
            required: 3,
            reward: 1,
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting match quota:', error);
    return NextResponse.json(
      { success: false, message: '获取配额信息失败' },
      { status: 500 }
    );
  }
}

