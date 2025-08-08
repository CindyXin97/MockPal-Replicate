import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, accounts } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    // 测试数据库连接
    const userCount = await db.select().from(users);
    const accountCount = await db.select().from(accounts);
    
    return NextResponse.json({
      success: true,
      userCount: userCount.length,
      accountCount: accountCount.length,
      dbConnection: 'OK'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}