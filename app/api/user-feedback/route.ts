import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { feedbacks } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    
    const { action, timestamp, context } = body;

    // 验证必需字段
    if (!action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 记录用户反馈数据
    const feedback = await db.insert(feedbacks).values({
      userId,
      matchId: null, // 这不是特定匹配的反馈
      interviewStatus: 'system_feedback', // 标记为系统反馈
      content: JSON.stringify({
        action,
        timestamp: timestamp || new Date().toISOString(),
        context: context || 'unknown'
      }),
      createdAt: new Date(),
    }).returning();

    console.log(`User ${userId} performed action: ${action} in context: ${context}`);

    return NextResponse.json({
      success: true,
      feedbackId: feedback[0].id,
    });

  } catch (error) {
    console.error('Error collecting user feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 