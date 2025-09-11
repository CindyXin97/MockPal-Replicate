import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

async function testFeedbackInsert() {
  try {
    console.log('🧪 测试"期待看到更多"按钮点击数据插入...\n');

    const userId = 39; // 931114366@qq.com 的用户ID
    console.log(`🎯 测试用户ID: ${userId} (931114366@qq.com)\n`);

    // 1. 测试插入"期待看到更多"点击记录
    console.log('1️⃣ 插入"期待看到更多"点击记录:');
    const feedbackRecord = await sql`
      INSERT INTO feedbacks (
        user_id, 
        match_id, 
        interview_status, 
        content, 
        created_at, 
        updated_at
      ) VALUES (
        ${userId},
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
    
    console.log(`   ✅ 成功插入记录，ID: ${feedbackRecord[0].id}`);

    // 2. 查询验证
    console.log('\n2️⃣ 查询验证:');
    const verifyRecord = await sql`
      SELECT * FROM feedbacks WHERE id = ${feedbackRecord[0].id}
    `;
    
    console.log(`   📝 面试状态: ${verifyRecord[0].interview_status}`);
    console.log(`   📄 内容: ${verifyRecord[0].content}`);
    console.log(`   📅 创建时间: ${new Date(verifyRecord[0].created_at).toLocaleString()}`);

    // 3. 解析JSON内容
    console.log('\n3️⃣ 解析JSON内容:');
    const content = JSON.parse(verifyRecord[0].content);
    console.log(`   🎯 操作: ${content.action}`);
    console.log(`   🌐 上下文: ${content.context}`);
    console.log(`   ⏰ 时间戳: ${content.timestamp}`);

    // 4. 查询该用户的所有反馈记录
    console.log('\n4️⃣ 查询用户所有反馈记录:');
    const userFeedbacks = await sql`
      SELECT * FROM feedbacks 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    console.log(`   📊 用户总反馈记录数: ${userFeedbacks.length}`);
    userFeedbacks.forEach((feedback: any, index: number) => {
      console.log(`   ${index + 1}. 记录 #${feedback.id}: ${feedback.interview_status} (${new Date(feedback.created_at).toLocaleString()})`);
    });

    // 5. 测试查询"期待看到更多"点击
    console.log('\n5️⃣ 查询"期待看到更多"点击记录:');
    const expectMoreClicks = await sql`
      SELECT * FROM feedbacks 
      WHERE user_id = ${userId}
        AND interview_status = 'system_feedback'
        AND content LIKE '%expect_more_matches%'
      ORDER BY created_at DESC
    `;
    
    console.log(`   📊 找到 ${expectMoreClicks.length} 次"期待看到更多"点击`);
    expectMoreClicks.forEach((click: any, index: number) => {
      const clickContent = JSON.parse(click.content);
      console.log(`   ${index + 1}. 点击 #${click.id}: ${clickContent.action} (${new Date(click.created_at).toLocaleString()})`);
    });

    console.log('\n🎉 测试完成！');
    console.log('✅ "期待看到更多"按钮点击数据现在可以正常存储了');
    console.log('💡 问题已解决：interview_status字段长度已从10扩展到50');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFeedbackInsert().then(() => {
  console.log('\n✨ 反馈插入测试完成');
  process.exit(0);
});
