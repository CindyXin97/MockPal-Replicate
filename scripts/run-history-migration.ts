/**
 * 运行历史记录模式迁移
 * 只执行 0010_add_action_type_history.sql
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  console.log('🚀 开始运行历史记录模式迁移...\n');
  console.log('='.repeat(80));
  
  try {
    // 读取迁移文件
    const migrationPath = path.join(
      process.cwd(), 
      'lib/db/migrations/0010_add_action_type_history.sql'
    );
    
    console.log(`\n📄 读取迁移文件: ${migrationPath}\n`);
    
    const migration = fs.readFileSync(migrationPath, 'utf-8');
    
    // 显示将要执行的 SQL
    console.log('将要执行的 SQL:\n');
    console.log(migration.split('\n').slice(0, 10).join('\n'));
    console.log('...\n');
    
    // 执行迁移 - 分步执行每条 SQL
    console.log('⏳ 执行迁移中...\n');
    
    // 步骤 1: 添加 action_type 字段
    console.log('步骤 1/6: 添加 action_type 字段...');
    await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS action_type VARCHAR(20)`;
    console.log('✅ 完成\n');
    
    // 步骤 2: 填充历史数据
    console.log('步骤 2/6: 填充历史数据的 action_type...');
    await sql`
      UPDATE matches SET action_type = 
        CASE 
          WHEN status = 'pending' THEN 'like'
          WHEN status = 'rejected' THEN 'dislike'
          WHEN status = 'accepted' THEN 'like'
          ELSE 'like'
        END
      WHERE action_type IS NULL
    `;
    console.log('✅ 完成\n');
    
    // 步骤 3: 移除 UNIQUE 约束
    console.log('步骤 3/6: 移除 UNIQUE 约束...');
    try {
      await sql`ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user1_id_user2_id_key`;
      console.log('✅ 完成 (matches_user1_id_user2_id_key)\n');
    } catch (e) {
      console.log('⚠️  约束可能不存在\n');
    }
    
    try {
      await sql`ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user1_id_user2_id_unique`;
      console.log('✅ 完成 (matches_user1_id_user2_id_unique)\n');
    } catch (e) {
      console.log('⚠️  约束可能不存在\n');
    }
    
    // 步骤 4: 添加索引
    console.log('步骤 4/6: 添加索引...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_matches_users_action ON matches(user1_id, user2_id, action_type)`;
    console.log('  ✅ idx_matches_users_action');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_matches_created_desc ON matches(created_at DESC)`;
    console.log('  ✅ idx_matches_created_desc');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_matches_user1_created ON matches(user1_id, created_at DESC)`;
    console.log('  ✅ idx_matches_user1_created');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_matches_status_users ON matches(status, user1_id, user2_id)`;
    console.log('  ✅ idx_matches_status_users\n');
    
    console.log('步骤 5/6: 添加注释...');
    await sql`COMMENT ON COLUMN matches.action_type IS '用户的实际操作: like, dislike, cancel'`;
    await sql`COMMENT ON COLUMN matches.status IS '匹配状态: pending(等待), accepted(成功), rejected(拒绝)'`;
    console.log('✅ 完成\n');
    
    console.log('✅ 所有迁移步骤执行成功！\n');
    console.log('='.repeat(80));
    
    // 验证迁移结果
    console.log('\n🔍 验证迁移结果:\n');
    
    // 1. 检查 action_type 字段
    const actionTypeCheck = await sql`
      SELECT action_type, COUNT(*) as count
      FROM matches
      GROUP BY action_type
      ORDER BY action_type;
    `;
    
    console.log('1. action_type 字段分布:');
    for (const row of actionTypeCheck) {
      console.log(`   ${row.action_type || 'NULL'}: ${row.count} 条记录`);
    }
    
    // 2. 检查 UNIQUE 约束是否已移除
    const constraintCheck = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'matches' 
        AND constraint_type = 'UNIQUE'
        AND constraint_schema = 'public';
    `;
    
    console.log('\n2. UNIQUE 约束:');
    if (constraintCheck.length === 0) {
      console.log('   ✅ UNIQUE 约束已成功移除');
    } else {
      console.log('   ⚠️  仍然存在 UNIQUE 约束:');
      for (const row of constraintCheck) {
        console.log(`   - ${row.constraint_name}`);
      }
    }
    
    // 3. 检查索引
    const indexCheck = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'matches'
        AND schemaname = 'public'
      ORDER BY indexname;
    `;
    
    console.log('\n3. 索引列表:');
    for (const row of indexCheck) {
      console.log(`   - ${row.indexname}`);
    }
    
    // 4. 检查总记录数
    const countCheck = await sql`
      SELECT COUNT(*) as total FROM matches;
    `;
    
    console.log(`\n4. 总记录数: ${countCheck[0].total} 条`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🎉 迁移完成！系统已切换到历史记录模式。\n');
    console.log('📝 所有用户操作都将被完整记录。\n');
    
  } catch (error: any) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error('\n详细错误:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigration();

