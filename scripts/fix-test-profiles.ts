import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function fixTestProfiles() {
  console.log('🔧 修复测试用户profile数据...\n');
  
  const testUsers = [
    { email: 'test1@gmail.com', name: '测试用户1' },
    { email: 'test2@gmail.com', name: '测试用户2' },
    { email: 'test3@gmail.com', name: '测试用户3' },
    { email: 'test4@gmail.com', name: '测试用户4' },
    { email: 'test5@gmail.com', name: '测试用户5' }
  ];

  try {
    for (const testUser of testUsers) {
      // 查找用户
      const users_result = await db
        .select()
        .from(users)
        .where(eq(users.email, testUser.email));
      
      if (users_result.length === 0) {
        console.log(`⚠️  找不到用户: ${testUser.email}`);
        continue;
      }

      const user = users_result[0];
      
      // 更新用户名
      await db
        .update(users)
        .set({ name: testUser.name })
        .where(eq(users.id, user.id));
      
      // 检查并更新profile
      const profiles = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id));
      
      if (profiles.length > 0) {
        // 更新现有profile
        await db
          .update(userProfiles)
          .set({
            email: testUser.email  // 确保联系方式不为空
          })
          .where(eq(userProfiles.userId, user.id));

        console.log(`✅ 更新用户profile: ${testUser.email} -> ${testUser.name}`);
      } else {
        console.log(`⚠️  用户 ${testUser.email} 没有profile记录`);
      }
    }
    
    console.log('\n🎉 修复完成！现在可以正常访问matches页面了');
    console.log('💡 请刷新浏览器页面试试');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

fixTestProfiles().catch(console.error); 