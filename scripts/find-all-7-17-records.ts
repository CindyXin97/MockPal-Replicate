/**
 * 查找用户7和17之间的所有记录（包括rejected）
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { matches } from '@/lib/db/schema';
import { or, and, eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function findAllRecords() {
  console.log('🔍 查找用户7和用户17之间的所有记录\n');
  console.log('='.repeat(80));
  
  try {
    // 查询所有状态的记录
    const allMatches = await db.select()
      .from(matches)
      .where(
        or(
          and(eq(matches.user1Id, 7), eq(matches.user2Id, 17)),
          and(eq(matches.user1Id, 17), eq(matches.user2Id, 7))
        )
      );
    
    console.log(`\n找到 ${allMatches.length} 条记录:\n`);
    
    for (const match of allMatches) {
      console.log(`记录 ${match.id}:`);
      console.log(`  方向: User ${match.user1Id} → User ${match.user2Id}`);
      console.log(`  状态: ${match.status}`);
      console.log(`  联系状态: ${match.contactStatus}`);
      console.log(`  创建时间: ${match.createdAt?.toLocaleString('zh-CN', { timeZone: 'America/New_York' })}`);
      console.log(`  更新时间: ${match.updatedAt?.toLocaleString('zh-CN', { timeZone: 'America/New_York' })}`);
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('\n💡 重现可能的场景:\n');
    console.log('时间线推测：');
    console.log('');
    console.log('10-09 15:44:');
    console.log('  ✅ User 17 like User 7');
    console.log('  → 创建记录 53 (17→7, pending)');
    console.log('');
    console.log('10-10 06:10:');
    console.log('  ✅ User 7 like User 17');
    console.log('  → 应该：找到记录53，更新为accepted');
    console.log('  → 实际：创建了新记录75 (7→17, pending)');
    console.log('  → ❌ BUG: matchBetweenUsers 查询失败！');
    console.log('');
    console.log('10-12 17:26:');
    console.log('  ⚠️  记录53被更新（但状态仍为pending）');
    console.log('  → 可能是某个API或脚本操作');
    console.log('');
    console.log('='.repeat(80));
    console.log('\n🔧 问题根源:\n');
    console.log('1. 数据库唯一约束问题：');
    console.log('   UNIQUE (user1_id, user2_id) 无法防止双向重复');
    console.log('   (7, 17) 和 (17, 7) 可以同时存在');
    console.log('');
    console.log('2. matchBetweenUsers 查询在某些情况下可能失败');
    console.log('   或者在10-10那个时刻，数据库连接/事务有问题');
    console.log('');
    
  } catch (error) {
    console.error('❌ 查询出错:', error);
  } finally {
    process.exit(0);
  }
}

findAllRecords();

