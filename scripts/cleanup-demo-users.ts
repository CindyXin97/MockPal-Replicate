#!/usr/bin/env tsx

/**
 * 清理演示测试用户和相关数据
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { db } from '../lib/db';
import { users, userProfiles, matches, userDailyViews, feedbacks, userAchievements } from '../lib/db/schema';
import { eq, or, inArray } from 'drizzle-orm';

async function cleanupDemoUsers() {
  console.log('🧹 开始清理演示测试用户...\n');

  try {
    const demoEmails = [
      'test-first-match@mockpal.com',
      'candidate-for-demo@mockpal.com'
    ];

    // 查找所有演示用户
    const demoUsers = await db.select().from(users).where(
      or(
        eq(users.email, demoEmails[0]),
        eq(users.email, demoEmails[1])
      )
    );

    if (demoUsers.length === 0) {
      console.log('✅ 没有找到演示用户，数据已清理\n');
      return;
    }

    const userIds = demoUsers.map(u => u.id);
    console.log(`📋 找到 ${demoUsers.length} 个演示用户\n`);

    // 1. 删除用户成就
    console.log('🗑️  删除用户成就...');
    await db.delete(userAchievements).where(inArray(userAchievements.userId, userIds));
    console.log('✅ 已删除');

    // 2. 删除反馈
    console.log('🗑️  删除反馈记录...');
    await db.delete(feedbacks).where(inArray(feedbacks.userId, userIds));
    console.log('✅ 已删除');

    // 3. 删除浏览记录
    console.log('🗑️  删除浏览记录...');
    await db.delete(userDailyViews).where(inArray(userDailyViews.userId, userIds));
    console.log('✅ 已删除');

    // 4. 删除匹配记录
    console.log('🗑️  删除匹配记录...');
    await db.delete(matches).where(
      or(
        inArray(matches.user1Id, userIds),
        inArray(matches.user2Id, userIds)
      )
    );
    console.log('✅ 已删除');

    // 5. 删除用户资料
    console.log('🗑️  删除用户资料...');
    await db.delete(userProfiles).where(inArray(userProfiles.userId, userIds));
    console.log('✅ 已删除');

    // 6. 删除用户
    console.log('🗑️  删除用户账号...');
    await db.delete(users).where(inArray(users.id, userIds));
    console.log('✅ 已删除');

    console.log('\n🎉 演示测试数据清理完成！\n');

  } catch (error) {
    console.error('❌ 发生错误:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

cleanupDemoUsers();

