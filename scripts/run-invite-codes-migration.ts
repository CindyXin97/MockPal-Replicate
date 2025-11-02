#!/usr/bin/env tsx

/**
 * 运行邀请码系统迁移
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function runInviteCodesMigration() {
  console.log('🚀 开始运行邀请码系统迁移...\n');
  console.log('='.repeat(80));
  
  try {
    // 步骤1: 创建 user_invite_codes 表
    console.log('📄 步骤 1/7: 创建 user_invite_codes 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_invite_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invite_code VARCHAR(12) NOT NULL UNIQUE,
        times_used INTEGER DEFAULT 0,
        total_referrals INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id)
      )
    `;
    console.log('✅ 完成\n');
    
    // 步骤2: 创建 invite_code_usage 表
    console.log('📄 步骤 2/7: 创建 invite_code_usage 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS invite_code_usage (
        id SERIAL PRIMARY KEY,
        invite_code VARCHAR(12) NOT NULL REFERENCES user_invite_codes(invite_code),
        referrer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reward_type VARCHAR(20) DEFAULT 'quota',
        reward_amount INTEGER DEFAULT 2,
        used_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(referred_user_id)
      )
    `;
    console.log('✅ 完成\n');
    
    // 步骤3: 创建索引
    console.log('📄 步骤 3/7: 创建 user_invite_codes 索引...');
    await sql`CREATE INDEX IF NOT EXISTS idx_invite_code_user ON user_invite_codes(user_id)`;
    console.log('✅ 完成\n');
    
    console.log('📄 步骤 4/7: 创建 invite_code 索引...');
    await sql`CREATE INDEX IF NOT EXISTS idx_invite_code_code ON user_invite_codes(invite_code)`;
    console.log('✅ 完成\n');
    
    console.log('📄 步骤 5/7: 创建 usage 表索引...');
    await sql`CREATE INDEX IF NOT EXISTS idx_invite_usage_code ON invite_code_usage(invite_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invite_usage_referrer ON invite_code_usage(referrer_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invite_usage_referred ON invite_code_usage(referred_user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invite_usage_date ON invite_code_usage(used_at)`;
    console.log('✅ 完成\n');
    
    // 步骤4: 添加注释（如果数据库支持）
    console.log('📄 步骤 6/7: 添加表注释...');
    try {
      await sql`COMMENT ON TABLE user_invite_codes IS '用户邀请码表 - 每个用户都有一个专属邀请码'`;
      await sql`COMMENT ON COLUMN user_invite_codes.invite_code IS '邀请码，唯一标识'`;
      await sql`COMMENT ON COLUMN user_invite_codes.times_used IS '邀请码被使用的次数'`;
      await sql`COMMENT ON COLUMN user_invite_codes.total_referrals IS '总邀请成功人数'`;
      await sql`COMMENT ON TABLE invite_code_usage IS '邀请码使用记录表 - 记录每次邀请的详细信息'`;
      await sql`COMMENT ON COLUMN invite_code_usage.reward_type IS '奖励类型'`;
      await sql`COMMENT ON COLUMN invite_code_usage.reward_amount IS '奖励数量（配额）'`;
      console.log('✅ 完成\n');
    } catch (error) {
      console.log('⚠️  注释添加失败（可能数据库不支持），继续...\n');
    }
    
    // 步骤5: 验证表是否创建成功
    console.log('📄 步骤 7/7: 验证表是否创建成功...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name = 'user_invite_codes' OR table_name = 'invite_code_usage')
      ORDER BY table_name
    `;
    
    console.log('已创建的表:');
    tables.forEach((row: any) => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    if (tables.length === 2) {
      console.log('\n🎉 邀请码系统迁移成功！所有表已创建。');
    } else {
      console.log('\n⚠️  警告：表数量不符合预期');
    }
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 运行脚本
runInviteCodesMigration()
  .then(() => {
    console.log('\n✨ 脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 未捕获的错误:', error);
    process.exit(1);
  });

