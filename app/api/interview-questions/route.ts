import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { interviewQuestions } from '@/lib/db/schema';
import { and, eq, like, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取筛选参数
    const company = searchParams.get('company');
    const position = searchParams.get('position');
    const questionType = searchParams.get('questionType');
    const difficulty = searchParams.get('difficulty');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    
    if (company && company !== 'all') {
      conditions.push(eq(interviewQuestions.company, company));
    }
    
    if (position && position !== 'all') {
      conditions.push(eq(interviewQuestions.position, position));
    }
    
    if (questionType && questionType !== 'all') {
      conditions.push(eq(interviewQuestions.questionType, questionType));
    }
    
    if (difficulty && difficulty !== 'all') {
      conditions.push(eq(interviewQuestions.difficulty, difficulty));
    }
    
    if (year && year !== 'all') {
      conditions.push(eq(interviewQuestions.year, parseInt(year)));
    }

    // 查询数据
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const questions = await db
      .select()
      .from(interviewQuestions)
      .where(whereClause)
      .orderBy(desc(interviewQuestions.year), desc(interviewQuestions.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviewQuestions)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    // 获取筛选选项数据
    const companiesResult = await db
      .selectDistinct({ company: interviewQuestions.company })
      .from(interviewQuestions)
      .orderBy(interviewQuestions.company);
    
    const positionsResult = await db
      .selectDistinct({ position: interviewQuestions.position })
      .from(interviewQuestions)
      .orderBy(interviewQuestions.position);
    
    const yearsResult = await db
      .selectDistinct({ year: interviewQuestions.year })
      .from(interviewQuestions)
      .orderBy(desc(interviewQuestions.year));

    const companies = companiesResult.map(r => r.company);
    const positions = positionsResult.map(r => r.position);
    const years = yearsResult.map(r => r.year);

    return NextResponse.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          companies,
          positions,
          years,
          questionTypes: ['technical', 'behavioral', 'case_study', 'stats'],
          difficulties: ['easy', 'medium', 'hard']
        }
      }
    });
  } catch (error) {
    console.error('Error fetching interview questions:', error);
    return NextResponse.json(
      { success: false, message: '获取面试真题失败' },
      { status: 500 }
    );
  }
} 