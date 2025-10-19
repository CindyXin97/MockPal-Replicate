import 'dotenv/config';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { like, or, eq } from 'drizzle-orm';

/**
 * 查找 cindy 相关的用户账号
 */

async function findCindyUser() {
  try {
    console.log('🔍 查找 Cindy 用户...\n');

    // 查找所有可能的 cindy 账号
    const allUsers = await db
      .select()
      .from(users)
      .where(
        or(
          like(users.email, '%cindy%'),
          like(users.name, '%cindy%'),
          like(users.name, '%Cindy%')
        )
      );

    if (allUsers.length === 0) {
      console.log('❌ 未找到包含 "cindy" 的用户');
      console.log('\n📋 显示所有用户：\n');
      
      const all = await db.select().from(users);
      all.forEach(u => {
        console.log(`   ${u.name} (${u.email}) - ID: ${u.id}`);
      });
    } else {
      console.log('✅ 找到以下用户：\n');
      allUsers.forEach(u => {
        console.log(`   ${u.name} (${u.email}) - ID: ${u.id}`);
      });
    }

  } catch (error) {
    console.error('❌ 查找失败:', error);
    throw error;
  }
}

// 运行脚本
findCindyUser()
  .then(() => {
    console.log('\n✅ 查找完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });

