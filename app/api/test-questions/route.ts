import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interviewQuestions } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 测试1: 检查数据库连接
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviewQuestions);
    
    const total = totalResult[0]?.count || 0;

    // 测试2: 获取前3条数据
    const sampleQuestions = await db
      .select()
      .from(interviewQuestions)
      .limit(3);

    return NextResponse.json({
      success: true,
      message: '数据库连接正常',
      data: {
        totalQuestions: total,
        sampleQuestions: sampleQuestions.map(q => ({
          id: q.id,
          company: q.company,
          position: q.position,
          questionType: q.questionType,
          difficulty: q.difficulty,
          year: q.year,
          questionPreview: q.question.substring(0, 100) + '...'
        }))
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: '数据库查询失败',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

