#!/usr/bin/env tsx

/**
 * 为现有用户批量生成邀请码
 * 用于数据库迁移完成后，为所有老用户生成邀请码
 */

import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { db } from '../lib/db';
import { users, userInviteCodes } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getOrCreateUserInviteCode } from '../lib/invite-codes';

async function generateInviteCodesForAllUsers() {
  console.log('🚀 开始为现有用户生成邀请码...');
  
  try {
    // 查询所有用户
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`📊 找到 ${allUsers.length} 个用户`);

    // 查询已有邀请码的用户
    const usersWithCodes = await db.query.userInviteCodes.findMany({
      columns: {
        userId: true,
      },
    });

    const existingUserIds = new Set(usersWithCodes.map(u => u.userId));
    console.log(`✅ 已有邀请码的用户: ${existingUserIds.size} 个`);

    // 为没有邀请码的用户生成
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      if (existingUserIds.has(user.id)) {
        skipCount++;
        continue;
      }

      try {
        await getOrCreateUserInviteCode(user.id);
        successCount++;
        console.log(`✅ 为用户 ${user.name || user.email} (ID: ${user.id}) 生成邀请码`);
      } catch (error) {
        errorCount++;
        console.error(`❌ 为用户 ${user.name || user.email} (ID: ${user.id}) 生成邀请码失败:`, error);
      }
    }

    console.log('\n📊 统计信息：');
    console.log(`✅ 成功生成: ${successCount} 个`);
    console.log(`⏭️  已存在跳过: ${skipCount} 个`);
    console.log(`❌ 失败: ${errorCount} 个`);

    console.log('\n✅ 邀请码生成完成！');
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 运行脚本
generateInviteCodesForAllUsers()
  .then(() => {
    console.log('✨ 脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 未捕获的错误:', error);
    process.exit(1);
  });

