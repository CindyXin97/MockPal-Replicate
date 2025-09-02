import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles, matches, userDailyViews, feedbacks } from '@/lib/db/schema';

export async function POST() {
  try {
    // 清空相关数据表，但保留用户账户和会话
    await db.delete(feedbacks);
    await db.delete(matches);
    await db.delete(userDailyViews);
    await db.delete(userProfiles);
    
    return NextResponse.json({
      success: true,
      message: '数据库清空成功！保留了用户账户信息，可以重新完善资料。',
      clearedTables: ['feedbacks', 'matches', 'userDailyViews', 'userProfiles']
    });
  } catch (error) {
    console.error('Clear database error:', error);
    return NextResponse.json({
      success: false,
      message: '清空数据库失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}