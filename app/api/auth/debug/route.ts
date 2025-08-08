import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const env = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***配置正确***' : '未配置',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '***配置正确***' : '未配置',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '***配置正确***' : '未配置',
    DATABASE_URL: process.env.DATABASE_URL ? '***配置正确***' : '未配置',
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    status: 'NextAuth Debug Info',
    environment: env,
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    timestamp: new Date().toISOString(),
  });
}