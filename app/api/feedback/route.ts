import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/lib/matching';

export async function POST(req: NextRequest) {
  try {
    const { matchId, userId, interviewStatus, content } = await req.json();
    if (!matchId || !userId || !interviewStatus) {
      return NextResponse.json({ success: false, message: '参数不完整' }, { status: 400 });
    }
    const result = await saveFeedback({ matchId, userId, interviewStatus, content });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
} 