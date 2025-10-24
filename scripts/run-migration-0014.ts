import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 开始运行数据库迁移 0014...\n');

  try {
    console.log('📄 创建表 user_daily_bonus...');

    // 创建表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_daily_bonus (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        posts_today INTEGER DEFAULT 0 NOT NULL,
        comments_today INTEGER DEFAULT 0 NOT NULL,
        bonus_quota INTEGER DEFAULT 0 NOT NULL,
        bonus_balance INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, date)
      )
    `);

    console.log('✅ 表创建成功！');
    console.log('📄 创建索引...');

    // 创建索引
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_daily_bonus_user_date ON user_daily_bonus(user_id, date)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_daily_bonus_date ON user_daily_bonus(date)
    `);

    console.log('✅ 索引创建成功！');
    console.log('✅ 迁移执行成功！');
    console.log('\n验证表是否创建...');

    // 验证表是否存在
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_daily_bonus'
    `);

    if (result.rows && result.rows.length > 0) {
      console.log('✅ 表 user_daily_bonus 已成功创建！');
    } else {
      console.log('❌ 表创建可能失败，请检查');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

runMigration();

