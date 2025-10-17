/**
 * 运行 email_send_logs 表迁移
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

async function runMigration() {
  console.log('🚀 开始运行邮件日志表迁移\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ 未找到 DATABASE_URL 环境变量');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('📋 步骤1：检查表是否已存在');
    
    const checkTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_send_logs'
      );
    `;
    
    if (checkTable[0]?.exists) {
      console.log('⚠️ 表 email_send_logs 已存在，跳过创建\n');
    } else {
      console.log('✅ 表不存在，开始创建\n');
      
      // 创建表
      console.log('📋 步骤2：创建 email_send_logs 表');
      await sql`
        CREATE TABLE email_send_logs (
          id SERIAL PRIMARY KEY,
          recipient_email VARCHAR(255) NOT NULL,
          email_type VARCHAR(50) NOT NULL,
          subject VARCHAR(255),
          status VARCHAR(20) NOT NULL DEFAULT 'sent',
          error_message TEXT,
          sent_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;
      console.log('✅ 表创建成功\n');

      // 创建索引
      console.log('📋 步骤3：创建索引');
      await sql`
        CREATE INDEX idx_email_send_logs_recipient_sent_at 
        ON email_send_logs(recipient_email, sent_at);
      `;
      console.log('✅ 索引 idx_email_send_logs_recipient_sent_at 创建成功');

      await sql`
        CREATE INDEX idx_email_send_logs_email_type 
        ON email_send_logs(email_type);
      `;
      console.log('✅ 索引 idx_email_send_logs_email_type 创建成功\n');

      // 添加注释
      console.log('📋 步骤4：添加表注释');
      await sql`
        COMMENT ON TABLE email_send_logs IS '邮件发送记录表 - 用于频率限制和审计';
      `;
      await sql`
        COMMENT ON COLUMN email_send_logs.recipient_email IS '收件人邮箱地址';
      `;
      await sql`
        COMMENT ON COLUMN email_send_logs.email_type IS '邮件类型：login, password_setup, match_success';
      `;
      await sql`
        COMMENT ON COLUMN email_send_logs.subject IS '邮件主题';
      `;
      await sql`
        COMMENT ON COLUMN email_send_logs.status IS '发送状态：sent(成功), failed(失败), skipped(跳过-超出限制)';
      `;
      await sql`
        COMMENT ON COLUMN email_send_logs.error_message IS '错误信息（如果发送失败）';
      `;
      await sql`
        COMMENT ON COLUMN email_send_logs.sent_at IS '发送时间';
      `;
      console.log('✅ 注释添加成功\n');
    }

    // 验证表结构
    console.log('📋 步骤5：验证表结构');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'email_send_logs'
      ORDER BY ordinal_position;
    `;
    
    console.log('✅ 表结构：');
    console.log('┌─────────────────────┬─────────────────────┬─────────────┐');
    console.log('│ 字段名              │ 数据类型            │ 可为空      │');
    console.log('├─────────────────────┼─────────────────────┼─────────────┤');
    columns.forEach((col: any) => {
      const name = col.column_name.padEnd(19, ' ');
      const type = col.data_type.padEnd(19, ' ');
      const nullable = col.is_nullable === 'YES' ? '是' : '否';
      console.log(`│ ${name} │ ${type} │ ${nullable}          │`);
    });
    console.log('└─────────────────────┴─────────────────────┴─────────────┘\n');

    // 验证索引
    console.log('📋 步骤6：验证索引');
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'email_send_logs';
    `;
    
    console.log('✅ 索引列表：');
    indexes.forEach((idx: any) => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 迁移完成！\n');
    
    console.log('💡 下一步：');
    console.log('   1. 运行测试：npx tsx scripts/test-email-rate-limit.ts');
    console.log('   2. 提交代码：git add . && git commit -m "feat: 添加邮件频率限制"\n');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

runMigration();

