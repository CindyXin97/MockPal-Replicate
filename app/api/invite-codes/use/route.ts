import { NextRequest, NextResponse } from 'next/server';
import { useInviteCode } from '@/lib/invite-codes';

// POST - 使用邀请码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode, userId } = body;

    if (!inviteCode || !userId) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const result = await useInviteCode(inviteCode, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error using invite code:', error);
    return NextResponse.json(
      { success: false, message: '使用邀请码失败' },
      { status: 500 }
    );
  }
}

