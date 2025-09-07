import { NextRequest, NextResponse } from 'next/server';
import { getUserAchievement, getBatchUserAchievements } from '@/lib/achievements';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userIds = searchParams.get('userIds');

    if (userIds) {
      // 批量获取多个用户的成就数据
      const userIdArray = userIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (userIdArray.length === 0) {
        return NextResponse.json({ success: false, message: '无效的用户ID列表' }, { status: 400 });
      }
      
      const achievements = await getBatchUserAchievements(userIdArray);
      return NextResponse.json({ success: true, achievements });
    } else if (userId) {
      // 获取单个用户的成就数据
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return NextResponse.json({ success: false, message: '无效的用户ID' }, { status: 400 });
      }
      
      const achievement = await getUserAchievement(userIdNum);
      return NextResponse.json({ success: true, achievement });
    } else {
      return NextResponse.json({ success: false, message: '缺少用户ID参数' }, { status: 400 });
    }
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json({ success: false, message: '获取成就数据失败' }, { status: 500 });
  }
} 