import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function fixFeedbackSchema() {
  try {
    console.log('🔧 修复feedbacks表schema问题...\n');

    // 1. 检查当前字段长度
    console.log('1️⃣ 检查当前字段长度:');
    const columnInfo = await sql`
      SELECT column_name, character_maximum_length, data_type
      FROM information_schema.columns 
      WHERE table_name = 'feedbacks' 
        AND column_name = 'interview_status'
    `;
    
    console.log(`   当前interview_status字段长度: ${columnInfo[0]?.character_maximum_length || 'unknown'}`);

    // 2. 修改字段长度
    console.log('\n2️⃣ 修改字段长度:');
    await sql`ALTER TABLE feedbacks ALTER COLUMN interview_status TYPE VARCHAR(50)`;
    console.log('   ✅ 已将interview_status字段长度从10扩展到50');

    // 3. 验证修改
    console.log('\n3️⃣ 验证修改结果:');
    const newColumnInfo = await sql`
      SELECT column_name, character_maximum_length, data_type
      FROM information_schema.columns 
      WHERE table_name = 'feedbacks' 
        AND column_name = 'interview_status'
    `;
    
    console.log(`   新的interview_status字段长度: ${newColumnInfo[0]?.character_maximum_length}`);

    // 4. 测试插入system_feedback记录
    console.log('\n4️⃣ 测试插入system_feedback记录:');
    const testRecord = await sql`
      INSERT INTO feedbacks (
        user_id, 
        match_id, 
        interview_status, 
        content, 
        created_at, 
        updated_at
      ) VALUES (
        58,
        NULL,
        'system_feedback',
        ${JSON.stringify({
          action: 'expect_more_matches',
          timestamp: new Date().toISOString(),
          context: 'daily_limit_reached'
        })},
        NOW(),
        NOW()
      ) RETURNING id
    `;
    
    console.log(`   ✅ 成功插入测试记录，ID: ${testRecord[0].id}`);

    // 5. 查询验证
    console.log('\n5️⃣ 查询验证:');
    const verifyRecord = await sql`
      SELECT * FROM feedbacks WHERE id = ${testRecord[0].id}
    `;
    
    console.log(`   📝 记录内容: ${verifyRecord[0].interview_status}`);
    console.log(`   📄 JSON内容: ${verifyRecord[0].content}`);

    console.log('\n🎉 Schema修复完成！');
    console.log('💡 现在可以正常存储"期待看到更多"按钮的点击数据了');

  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}

// 运行修复
fixFeedbackSchema().then(() => {
  console.log('\n✨ Schema修复脚本执行完成');
  process.exit(0);
});
