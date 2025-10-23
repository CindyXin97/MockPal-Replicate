import { config } from 'dotenv';
import * as path from 'path';

// 加载环境变量
config({ path: path.join(process.cwd(), '.env.local') });

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function runMigration() {
  try {
    console.log('🚀 开始运行通知系统迁移...\n');

    // 读取迁移SQL文件
    const migrationPath = path.join(process.cwd(), 'migrations', '0015_add_notifications_and_stats.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // 执行迁移
    console.log('📝 执行 SQL 迁移...');
    await db.execute(sql.raw(migrationSQL));

    console.log('\n✅ 迁移执行成功！\n');

    // 验证表是否创建成功
    console.log('🔍 验证表结构...');

    const checkTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('user_notifications', 'user_notification_settings')
      ORDER BY table_name;
    `);

    console.log('✓ 表验证结果:');
    for (const row of checkTables as any[]) {
      console.log(`  ✓ ${row.table_name}`);
    }

    // 验证字段是否添加
    console.log('\n🔍 验证 user_achievements 新增字段...');
    const checkColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'user_achievements'
        AND column_name IN ('total_views', 'total_matches', 'successful_matches', 'posts_count', 'comments_count', 'votes_given')
      ORDER BY column_name;
    `);

    console.log('✓ 新增字段:');
    for (const row of checkColumns as any[]) {
      console.log(`  ✓ ${row.column_name}`);
    }

    // 获取统计信息
    console.log('\n📊 系统统计:');
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const notificationSettingsCount = await db.execute(sql`SELECT COUNT(*) as count FROM user_notification_settings`);
    
    console.log(`  • 用户总数: ${(userCount as any[])[0].count}`);
    console.log(`  • 已创建通知设置: ${(notificationSettingsCount as any[])[0].count}`);

    console.log('\n✨ 迁移完成！通知系统已准备就绪。\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    console.error('\n请检查：');
    console.error('1. 数据库连接是否正常');
    console.error('2. 数据库用户是否有足够权限');
    console.error('3. 迁移文件路径是否正确\n');
    process.exit(1);
  }
}

runMigration();

