import { db } from '@/lib/db';
import { users, userInviteCodes, inviteCodeUsage, userDailyBonus } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * 生成12位邀请码
 * 格式：MP + 10位随机字符（大写字母+数字）
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from({ length: 10 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  return `MP${randomPart}`;
}

/**
 * 获取或创建用户的邀请码
 */
export async function getOrCreateUserInviteCode(userId: number) {
  try {
    // 先查询是否已存在
    const existingCode = await db.query.userInviteCodes.findFirst({
      where: eq(userInviteCodes.userId, userId),
    });

    if (existingCode) {
      return existingCode;
    }

    // 生成新的邀请码（确保唯一）
    let code: string | undefined;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = generateInviteCode();
      
      const duplicate = await db.query.userInviteCodes.findFirst({
        where: eq(userInviteCodes.inviteCode, code),
      });

      if (!duplicate) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique || !code) {
      throw new Error('生成唯一邀请码失败');
    }

    // 插入新邀请码
    const newCode = await db.insert(userInviteCodes).values({
      userId,
      inviteCode: code,
      timesUsed: 0,
      totalReferrals: 0,
    }).returning();

    return newCode[0];
  } catch (error) {
    console.error('Error getting/creating invite code:', error);
    throw error;
  }
}

/**
 * 验证邀请码并记录使用
 */
export async function useInviteCode(inviteCode: string, newUserId: number) {
  try {
    // 1. 查找邀请码
    const code = await db.query.userInviteCodes.findFirst({
      where: eq(userInviteCodes.inviteCode, inviteCode),
    });

    if (!code) {
      return { success: false, message: '邀请码不存在' };
    }

    // 2. 检查是否自己邀请自己
    if (code.userId === newUserId) {
      return { success: false, message: '不能使用自己的邀请码' };
    }

    // 3. 检查该用户是否已经使用过邀请码
    const existingUsage = await db.query.inviteCodeUsage.findFirst({
      where: eq(inviteCodeUsage.referredUserId, newUserId),
    });

    if (existingUsage) {
      return { success: false, message: '你已经使用过邀请码了' };
    }

    // 4. 检查是否已经使用过这个邀请码
    const duplicateUsage = await db.query.inviteCodeUsage.findFirst({
      where: and(
        eq(inviteCodeUsage.inviteCode, inviteCode),
        eq(inviteCodeUsage.referredUserId, newUserId)
      ),
    });

    if (duplicateUsage) {
      return { success: false, message: '该邀请码已被使用' };
    }

    // 5. 记录使用情况
    await db.insert(inviteCodeUsage).values({
      inviteCode: inviteCode,
      referrerUserId: code.userId,
      referredUserId: newUserId,
      rewardType: 'quota',
      rewardAmount: 2,
    });

    // 6. 更新邀请码统计
    await db
      .update(userInviteCodes)
      .set({
        timesUsed: code.timesUsed + 1,
        totalReferrals: code.totalReferrals + 1,
        updatedAt: new Date(),
      })
      .where(eq(userInviteCodes.id, code.id));

    // 7. 给邀请人增加配额奖励
    const ET_TIMEZONE = 'America/New_York';
    const now = new Date();
    const etDate = toZonedTime(now, ET_TIMEZONE);
    const today = format(etDate, 'yyyy-MM-dd');

    let bonus = await db.query.userDailyBonus.findFirst({
      where: and(
        eq(userDailyBonus.userId, code.userId),
        eq(userDailyBonus.date, today)
      ),
    });

    if (bonus) {
      // 更新今天的记录
      const newBalance = Math.min(6, bonus.bonusBalance + 2); // 上限6个
      await db
        .update(userDailyBonus)
        .set({
          bonusBalance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(userDailyBonus.id, bonus.id));
    } else {
      // 创建今天的记录
      const recentBonus = await db.query.userDailyBonus.findFirst({
        where: eq(userDailyBonus.userId, code.userId),
        orderBy: (table, { desc }) => [desc(table.date)],
      });
      
      const inheritedBalance = recentBonus?.bonusBalance || 0;
      const newBalance = Math.min(6, inheritedBalance + 2);
      
      await db.insert(userDailyBonus).values({
        userId: code.userId,
        date: today,
        postsToday: 0,
        commentsToday: 0,
        bonusQuota: 2,
        bonusBalance: newBalance,
      });
    }

    return { 
      success: true, 
      message: '邀请码验证成功，邀请人已获得2个额外配额！' 
    };
  } catch (error) {
    console.error('Error using invite code:', error);
    return { 
      success: false, 
      message: '使用邀请码失败，请稍后再试' 
    };
  }
}

/**
 * 获取邀请码统计信息
 */
export async function getInviteCodeStats(userId: number) {
  try {
    const code = await db.query.userInviteCodes.findFirst({
      where: eq(userInviteCodes.userId, userId),
    });

    if (!code) {
      // 为老用户生成邀请码
      const newCode = await getOrCreateUserInviteCode(userId);
      return {
        inviteCode: newCode.inviteCode,
        timesUsed: newCode.timesUsed,
        totalReferrals: newCode.totalReferrals,
      };
    }

    return {
      inviteCode: code.inviteCode,
      timesUsed: code.timesUsed,
      totalReferrals: code.totalReferrals,
    };
  } catch (error) {
    console.error('Error getting invite stats:', error);
    return null;
  }
}

