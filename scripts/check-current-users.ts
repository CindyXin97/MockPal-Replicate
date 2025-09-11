import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

async function checkCurrentUsers() {
  try {
    console.log('👥 检查当前数据库中的用户...\n');

    // 检查所有用户
    const users = await sql`
      SELECT u.id, u.email, u.name, u.created_at, up.job_type
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.created_at DESC
    `;

    console.log(`📊 总用户数: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ 数据库中没有用户！');
      return;
    }

    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. 用户 #${user.id}:`);
      console.log(`   📧 邮箱: ${user.email}`);
      console.log(`   👤 姓名: ${user.name || '未设置'}`);
      console.log(`   💼 岗位: ${user.job_type || '未设置'}`);
      console.log(`   📅 注册时间: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

    // 检查是否有目标用户
    const targetUser = users.find((u: any) => u.email === '931114366@qq.com');
    if (targetUser) {
      console.log('✅ 找到目标用户 931114366@qq.com');
      console.log(`   👤 用户ID: ${targetUser.id}`);
    } else {
      console.log('❌ 未找到目标用户 931114366@qq.com');
      console.log('💡 可能原因：');
      console.log('   1. 用户数据在清理过程中被删除');
      console.log('   2. 用户使用了不同的邮箱注册');
      console.log('   3. 用户还没有重新注册');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkCurrentUsers().then(() => {
  console.log('\n✨ 用户检查完成');
  process.exit(0);
});
