import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { matches, feedbacks } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 查询所有匹配记录
    const allMatches = await db.select().from(matches).limit(20);
    
    // 查询所有反馈记录
    const allFeedbacks = await db.select().from(feedbacks).limit(20);

    return NextResponse.json({
      matches: allMatches.map(match => ({
        id: match.id,
        user1Id: match.user1Id,
        user2Id: match.user2Id,
        status: match.status,
        contactStatus: match.contactStatus,
        createdAt: match.createdAt?.toISOString(),
      })),
      feedbacks: allFeedbacks.map(feedback => ({
        id: feedback.id,
        matchId: feedback.matchId,
        userId: feedback.userId,
        interviewStatus: feedback.interviewStatus,
        content: feedback.content,
        createdAt: feedback.createdAt?.toISOString(),
      })),
    });

  } catch (error) {
    console.error('Debug DB error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 