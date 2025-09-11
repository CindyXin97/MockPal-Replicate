import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';
import { submitFeedback } from '@/lib/feedback-checker';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    
    const { matchId, interviewCompleted, content } = body;

    // 验证必需字段
    if (!matchId || typeof interviewCompleted !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 提交反馈
    const feedback = await submitFeedback(
      parseInt(matchId),
      userId,
      interviewCompleted,
      content
    );

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        interviewStatus: feedback.interviewStatus,
        content: feedback.content,
        createdAt: feedback.createdAt,
      },
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 