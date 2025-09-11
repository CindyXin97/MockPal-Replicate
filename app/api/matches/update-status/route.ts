import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { matches } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    
    const { matchId, contactStatus } = body;

    // 验证必需字段
    if (!matchId || !contactStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 验证状态值
    const validStatuses = ['not_contacted', 'contacted', 'scheduled', 'completed', 'no_response'];
    if (!validStatuses.includes(contactStatus)) {
      return NextResponse.json(
        { error: 'Invalid contact status' },
        { status: 400 }
      );
    }

    // 验证用户是否有权限更新此匹配
    const match = await db.query.matches.findFirst({
      where: and(
        eq(matches.id, parseInt(matchId)),
        eq(matches.status, 'accepted') // 只有成功匹配才能更新
      )
    });

    // 验证用户是否参与此匹配
    if (!match) {
      console.log(`Match ${matchId} not found`);
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }
    
    if (match.user1Id !== userId && match.user2Id !== userId) {
      console.log(`User ${userId} has no permission for match ${matchId}. Match user1Id: ${match.user1Id}, user2Id: ${match.user2Id}`);
      return NextResponse.json(
        { error: `No permission. Your ID: ${userId}, Match users: ${match.user1Id}, ${match.user2Id}` },
        { status: 403 }
      );
    }

    // 更新匹配状态
    const updatedMatch = await db
      .update(matches)
      .set({
        contactStatus,
        contactUpdatedAt: new Date(),
        updatedAt: new Date(),
        // 如果状态是已安排面试，也更新面试安排时间
        ...(contactStatus === 'scheduled' && { interviewScheduledAt: new Date() }),
      })
      .where(eq(matches.id, parseInt(matchId)))
      .returning();

    return NextResponse.json({
      success: true,
      match: updatedMatch[0],
    });

  } catch (error) {
    console.error('Error updating match status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 