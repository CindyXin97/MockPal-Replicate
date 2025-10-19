import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// 加载环境变量
config();

async function runMigration() {
  try {
    console.log('🚀 开始运行社区功能数据库迁移...');

    // 读取迁移文件
    const migrationPath = path.join(process.cwd(), 'lib/db/migrations/0012_add_community_features.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // 执行迁移
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ 社区功能数据库迁移完成！');
    console.log('');
    console.log('已创建以下表：');
    console.log('  - user_interview_posts (用户发布的面试题目)');
    console.log('  - interview_comments (评论表)');
    console.log('  - interview_votes (点赞/踩表)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

runMigration();

