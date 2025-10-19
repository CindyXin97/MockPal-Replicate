import 'dotenv/config';
import { db } from '../lib/db';
import { users, userInterviewPosts } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 创建多个假用户，并将现有的分享随机分配给他们
 */

// 真实感的用户名字
const fakeUsers = [
  { name: '张晓明', email: 'xiaoming.zhang@gmail.com' },
  { name: 'Sarah Chen', email: 'sarah.chen@outlook.com' },
  { name: '李思远', email: 'siyuan.li@hotmail.com' },
  { name: 'Kevin Wu', email: 'kevin.wu@yahoo.com' },
  { name: '王雨欣', email: 'yuxin.wang@gmail.com' },
  { name: 'Emily Liu', email: 'emily.liu@gmail.com' },
  { name: '陈浩然', email: 'haoran.chen@163.com' },
  { name: 'Michael Zhang', email: 'michael.zhang@outlook.com' },
  { name: '林婉婷', email: 'wanting.lin@qq.com' },
  { name: 'David Huang', email: 'david.huang@gmail.com' },
];

async function createDiverseUsers() {
  try {
    console.log('🚀 开始创建多样化的用户...\n');

    // 1. 创建假用户
    const createdUserIds: number[] = [];
    
    for (const user of fakeUsers) {
      // 检查用户是否已存在
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`⚠️  用户已存在: ${user.name} (${user.email})`);
        createdUserIds.push(existingUser[0].id);
      } else {
        const newUser = await db
          .insert(users)
          .values({
            email: user.email,
            name: user.name,
            passwordHash: 'dummy_hash_' + Math.random(),
            emailVerified: new Date(),
          })
          .returning();
        
        createdUserIds.push(newUser[0].id);
        console.log(`✅ 创建用户: ${user.name} (ID: ${newUser[0].id})`);
      }
    }

    console.log(`\n📊 共有 ${createdUserIds.length} 个用户\n`);

    // 2. 获取所有现有的用户发布
    const allPosts = await db
      .select()
      .from(userInterviewPosts)
      .where(eq(userInterviewPosts.status, 'active'));

    console.log(`📝 找到 ${allPosts.length} 条现有分享\n`);

    // 3. 随机分配给不同的用户
    let updatedCount = 0;
    for (const post of allPosts) {
      // 随机选择一个用户
      const randomUserId = createdUserIds[Math.floor(Math.random() * createdUserIds.length)];
      
      // 更新帖子的用户ID
      await db
        .update(userInterviewPosts)
        .set({ userId: randomUserId })
        .where(eq(userInterviewPosts.id, post.id));

      updatedCount++;
      
      // 找到用户名
      const userName = fakeUsers.find((u, idx) => createdUserIds[idx] === randomUserId)?.name || 'Unknown';
      console.log(`✅ ${post.company} - ${post.position} → 分配给: ${userName}`);
    }

    console.log(`\n🎉 成功将 ${updatedCount} 条分享随机分配给 ${createdUserIds.length} 个用户！`);
    console.log('\n💡 提示：现在刷新页面，你会看到不同的分享者名字！\n');

  } catch (error) {
    console.error('❌ 操作失败:', error);
    throw error;
  }
}

// 运行脚本
createDiverseUsers()
  .then(() => {
    console.log('✅ 脚本执行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });

