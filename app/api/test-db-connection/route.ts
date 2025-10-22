import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('🧪 [测试API] 检查数据库连接...');

    // 检查 interview_votes 表是否存在
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'interview_votes'
      ) AS exists;
    `);

    const tableExists = tableCheck.rows[0]?.exists;
    console.log('🧪 [测试API] interview_votes 表存在:', tableExists);

    // 如果表存在，查询记录数
    let voteCount = 0;
    let recentVotes: any[] = [];

    if (tableExists) {
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM interview_votes;
      `);
      voteCount = parseInt(countResult.rows[0]?.count || '0');
      console.log('🧪 [测试API] 投票记录数:', voteCount);

      // 获取最近5条记录
      const recentResult = await db.execute(sql`
        SELECT * FROM interview_votes 
        ORDER BY created_at DESC 
        LIMIT 5;
      `);
      recentVotes = recentResult.rows;
      console.log('🧪 [测试API] 最近的投票:', recentVotes);
    }

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        tableExists,
        voteCount,
        recentVotes,
      },
      message: tableExists 
        ? `数据库连接正常，共有 ${voteCount} 条投票记录` 
        : 'interview_votes 表不存在，请运行数据库迁移',
    });
  } catch (error: any) {
    console.error('🧪 [测试API] 数据库连接失败:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    }, { status: 500 });
  }
}

