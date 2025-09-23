import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/lib/matching';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Feedback API - 收到请求:', body);
    
    const { matchId, userId, contactStatus, interviewStatus, content } = body;
    
    if (!matchId || !userId || !interviewStatus) {
      console.log('Feedback API - 参数验证失败:', { matchId, userId, contactStatus, interviewStatus });
      return NextResponse.json({ success: false, message: '参数不完整' }, { status: 400 });
    }
    
    console.log('Feedback API - 调用saveFeedback:', { matchId, userId, contactStatus, interviewStatus, content });
    const result = await saveFeedback({ matchId, userId, contactStatus, interviewStatus, content });
    console.log('Feedback API - saveFeedback结果:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Feedback API - 错误:', error);
    return NextResponse.json({ 
      success: false, 
      message: '服务器错误',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 