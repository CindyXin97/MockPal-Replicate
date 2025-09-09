import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth-config';
import { getUserPendingFeedback, getMatchPartnerInfo } from '@/lib/feedback-checker';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    
    // 检查是否有待反馈的匹配
    const pendingMatch = await getUserPendingFeedback(userId);
    
    if (!pendingMatch) {
      return NextResponse.json({ hasPendingFeedback: false });
    }

    // 获取匹配对方的信息
    const partnerInfo = await getMatchPartnerInfo(pendingMatch.id, userId);
    
    return NextResponse.json({
      hasPendingFeedback: true,
      match: {
        id: pendingMatch.id,
        createdAt: pendingMatch.createdAt,
        partner: partnerInfo,
      },
    });

  } catch (error) {
    console.error('Error checking pending feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 