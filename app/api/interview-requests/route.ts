import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, position, message } = body;

    // 验证必填字段
    if (!company?.trim() || !position?.trim()) {
      return NextResponse.json({
        success: false,
        message: '公司和职位信息不能为空'
      }, { status: 400 });
    }

    // 存储面经需求到数据库
    await db.execute(sql`
      INSERT INTO interview_requests (company, position, message, created_at)
      VALUES (${company.trim()}, ${position.trim()}, ${message?.trim() || ''}, NOW())
    `);

    return NextResponse.json({
      success: true,
      message: '需求提交成功！我们会尽快收集相关面经'
    });

  } catch (error) {
    console.error('Error submitting interview request:', error);
    return NextResponse.json({
      success: false,
      message: '提交失败，请稍后再试'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取面经需求统计信息
    const result = await db.execute(sql`
      SELECT 
        company,
        position,
        COUNT(*) as request_count,
        MAX(created_at) as latest_request
      FROM interview_requests 
      GROUP BY company, position 
      ORDER BY request_count DESC, latest_request DESC
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching interview requests:', error);
    return NextResponse.json({
      success: false,
      message: '获取数据失败'
    }, { status: 500 });
  }
} 