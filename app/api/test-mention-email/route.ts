import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actorName, content, postType, postId, recipientEmail } = body;

    // 验证必填字段
    if (!actorName || !content || !recipientEmail) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 构建评论链接
    const commentUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/matches?tab=questions&postType=${postType}&postId=${postId}`;

    // 发送@提及邮件
    const result = await emailService.sendMentionEmail(recipientEmail, {
      actorName,
      content,
      postType: postType || 'system',
      postId: parseInt(postId) || 1,
      commentUrl,
    });

    return NextResponse.json({
      success: true,
      message: '测试邮件发送成功',
      data: result,
    });

  } catch (error) {
    console.error('测试@提及邮件失败:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '发送失败' 
      },
      { status: 500 }
    );
  }
}
