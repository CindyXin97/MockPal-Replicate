import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { and, eq, gte, lte, sql, countDistinct } from 'drizzle-orm';
import { users, userDailyViews, matches, feedbacks } from '@/lib/db/schema';

function parseDateToRange(dateStr?: string) {
  const tzOffsetMs = 0; // DB timestamps assumed UTC; adjust here if needed
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 23, 59, 59, 999));
  return { start: new Date(start.getTime() - tzOffsetMs), end: new Date(end.getTime() - tzOffsetMs) };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined; // YYYY-MM-DD
    const { start, end } = parseDateToRange(date);

    // 新增注册用户（当天）
    const newUsers = await db.select({ cnt: sql<number>`count(*)` })
      .from(users)
      .where(and(gte(users.createdAt, start), lte(users.createdAt, end)));

    // DAU：当天在 user_daily_views 有行为的去重用户数
    const dauRows = await db.select({ cnt: sql<number>`COUNT(DISTINCT ${userDailyViews.userId})` })
      .from(userDailyViews)
      .where(eq(userDailyViews.date, date ?? sql`to_char(${start}::timestamp, 'YYYY-MM-DD')`));

    // 当天浏览总次数
    const viewsRows = await db.select({ cnt: sql<number>`count(*)` })
      .from(userDailyViews)
      .where(eq(userDailyViews.date, date ?? sql`to_char(${start}::timestamp, 'YYYY-MM-DD')`));

    // 匹配相关（创建、成功、联系）
    const matchesCreated = await db.select({ cnt: sql<number>`count(*)` })
      .from(matches)
      .where(and(gte(matches.createdAt, start), lte(matches.createdAt, end)));

    const matchesAccepted = await db.select({ cnt: sql<number>`count(*)` })
      .from(matches)
      .where(and(eq(matches.status, 'accepted'), gte(matches.createdAt, start), lte(matches.createdAt, end)));

    // 联系相关：以 contactStatus 更新为主；如无时间戳则以 createdAt 兜底
    const contactedToday = await db.select({ cnt: sql<number>`count(*)` })
      .from(matches)
      .where(and(eq(matches.contactStatus, 'contacted'), gte(matches.contactUpdatedAt, start), lte(matches.contactUpdatedAt, end)));

    // 反馈（当天新提交）
    const feedbacksCreated = await db.select({ cnt: sql<number>`count(*)` })
      .from(feedbacks)
      .where(and(gte(feedbacks.createdAt, start), lte(feedbacks.createdAt, end)));

    const interviewsDone = await db.select({ cnt: sql<number>`count(*)` })
      .from(feedbacks)
      .where(and(eq(feedbacks.interviewStatus, 'yes'), gte(feedbacks.createdAt, start), lte(feedbacks.createdAt, end)));

    const safeVal = (rows: { cnt: number }[]) => Number(rows?.[0]?.cnt || 0);

    const data = {
      date: date ?? new Date(start).toISOString().slice(0, 10),
      users: {
        newUsers: safeVal(newUsers),
        dau: safeVal(dauRows),
      },
      views: {
        totalViews: safeVal(viewsRows),
      },
      matches: {
        created: safeVal(matchesCreated),
        accepted: safeVal(matchesAccepted),
        contacteds: safeVal(contactedToday),
      },
      feedbacks: {
        created: safeVal(feedbacksCreated),
        interviewsDone: safeVal(interviewsDone),
      },
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Internal error' }, { status: 500 });
  }
}


