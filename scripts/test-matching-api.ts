import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, userProfiles, matches } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { createMatch } from '@/lib/matching';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function testMatchingAPI() {
  console.log('🧪 测试匹配API功能...\n');
  
  try {
    // 1. 查找567@gmail.com用户
    const user567 = await db
      .select()
      .from(users)
      .where(eq(users.email, '567@gmail.com'))
      .limit(1);
    
    if (user567.length === 0) {
      console.log('❌ 找不到用户 567@gmail.com');
      return;
    }
    
    const currentUser = user567[0];
    console.log(`✅ 找到用户: ${currentUser.email} (ID: ${currentUser.id})`);
    
    // 2. 查找一个可以匹配的用户（test1@gmail.com）
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'test1@gmail.com'))
      .limit(1);
    
    if (testUser.length === 0) {
      console.log('❌ 找不到测试用户 test1@gmail.com');
      return;
    }
    
    const targetUser = testUser[0];
    console.log(`✅ 找到目标用户: ${targetUser.email} (ID: ${targetUser.id})`);
    
    // 3. 检查是否已经有匹配记录
    const existingMatch = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.user1Id, currentUser.id),
          eq(matches.user2Id, currentUser.id)
        )
      );
    
    console.log(`\n📊 现有匹配记录数: ${existingMatch.length}`);
    existingMatch.forEach(match => {
      console.log(`   - 匹配ID: ${match.id}, 状态: ${match.status}, 用户: ${match.user1Id} <-> ${match.user2Id}`);
    });
    
    // 4. 测试匹配API
    console.log(`\n🎯 测试匹配: ${currentUser.id} -> ${targetUser.id}`);
    
    const result = await createMatch(currentUser.id, targetUser.id);
    
    console.log('\n📋 API返回结果:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      if ('match' in result && result.match) {
        console.log('🎉 匹配成功！双方互相喜欢');
      } else {
        console.log('👍 单方面喜欢，等待对方回应');
      }
    } else {
      console.log(`❌ 匹配失败: ${result.message}`);
    }
    
    // 5. 再次检查匹配记录
    const updatedMatches = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.user1Id, currentUser.id),
          eq(matches.user2Id, currentUser.id)
        )
      );
    
    console.log(`\n📊 更新后的匹配记录数: ${updatedMatches.length}`);
    updatedMatches.forEach(match => {
      console.log(`   - 匹配ID: ${match.id}, 状态: ${match.status}, 用户: ${match.user1Id} <-> ${match.user2Id}, 创建时间: ${match.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testMatchingAPI().catch(console.error); 