import { NextRequest, NextResponse } from 'next/server';
import { emailTokens } from '@/lib/email-tokens';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth?error=InvalidToken', request.url));
    }

    // 验证令牌
    const tokenData = emailTokens.get(token);
    
    if (!tokenData) {
      return NextResponse.redirect(new URL('/auth?error=InvalidToken', request.url));
    }

    if (Date.now() > tokenData.expires) {
      emailTokens.delete(token);
      return NextResponse.redirect(new URL('/auth?error=TokenExpired', request.url));
    }

    if (!tokenData.userId) {
      return NextResponse.redirect(new URL('/auth?error=UserNotFound', request.url));
    }

    // 删除使用过的令牌
    emailTokens.delete(token);

    // 创建一个临时的登录页面，让前端处理NextAuth登录
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('emailToken', token);
    loginUrl.searchParams.set('email', tokenData.email);
    loginUrl.searchParams.set('userId', tokenData.userId.toString());
    
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth?error=VerificationFailed', request.url));
  }
}