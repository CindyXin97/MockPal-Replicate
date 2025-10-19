import 'dotenv/config';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 更新用户名字为更网络化的昵称
 */

// 用户名映射：旧名字 -> 新名字
const nameUpdates = [
  { oldName: '张晓明', newName: 'DataDreamer' },
  { oldName: '李思远', newName: 'AnalyticsNinja' },
  { oldName: '王雨欣', newName: 'StatsGeek' },
  { oldName: '陈浩然', newName: 'CodeWizard' },
  { oldName: '林婉婷', newName: 'DataQueen' },
];

async function updateUserNames() {
  try {
    console.log('🔄 更新用户名字...\n');

    let updatedCount = 0;

    for (const update of nameUpdates) {
      // 查找用户
      const user = await db
        .select()
        .from(users)
        .where(eq(users.name, update.oldName))
        .limit(1);

      if (user.length === 0) {
        console.log(`⚠️  未找到用户: ${update.oldName}`);
        continue;
      }

      // 更新用户名
      await db
        .update(users)
        .set({ name: update.newName })
        .where(eq(users.id, user[0].id));

      updatedCount++;
      console.log(`✅ ${update.oldName} → ${update.newName}`);
    }

    console.log(`\n🎉 成功更新 ${updatedCount} 个用户名！`);
    console.log('\n📋 现在的用户列表：');
    
    // 显示更新后的所有用户
    const allUsers = await db.select().from(users);
    const relevantUsers = allUsers.filter(u => 
      u.name && (
        u.name.includes('Sarah') || 
        u.name.includes('Kevin') || 
        u.name.includes('Emily') || 
        u.name.includes('Michael') || 
        u.name.includes('David') ||
        u.name.includes('Data') ||
        u.name.includes('Analytics') ||
        u.name.includes('Stats') ||
        u.name.includes('Code')
      )
    );
    
    relevantUsers.forEach(u => {
      console.log(`   ${u.name} (${u.email})`);
    });
    
    console.log('\n💡 刷新页面即可看到新的用户名！\n');

  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  }
}

// 运行脚本
updateUserNames()
  .then(() => {
    console.log('✅ 脚本执行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });

