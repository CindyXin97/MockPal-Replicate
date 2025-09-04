import { NextResponse } from 'next/server';
import { sendVerificationRequest } from '@/lib/email-service';

export async function GET() {
  try {
    console.log('🧪 生产环境邮件发送测试开始...');
    
    const testEmail = 'xincindy924@gmail.com';
    const testUrl = 'https://www.mockpals.com/api/auth/callback/email?callbackUrl=https://www.mockpals.com&token=test123&email=' + encodeURIComponent(testEmail);
    
    console.log('📧 测试邮箱:', testEmail);
    console.log('🔗 测试链接:', testUrl);
    console.log('🌐 环境:', process.env.NODE_ENV);
    console.log('🔑 Resend API Key 存在:', !!process.env.RESEND_API_KEY);
    
    await sendVerificationRequest({
      identifier: testEmail,
      url: testUrl
    });
    
    console.log('✅ 生产环境邮件发送测试完成');
    
    return NextResponse.json({
      success: true,
      message: '生产环境邮件发送测试完成',
      email: testEmail,
      url: testUrl,
      environment: process.env.NODE_ENV,
      hasApiKey: !!process.env.RESEND_API_KEY
    });
  } catch (error) {
    console.error('❌ 生产环境邮件发送测试失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV,
      hasApiKey: !!process.env.RESEND_API_KEY
    }, { status: 500 });
  }
}
