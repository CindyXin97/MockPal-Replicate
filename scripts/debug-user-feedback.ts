import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function debugUserFeedback() {
  try {
    console.log('🔍 调试用户反馈数据收集问题...\n');

    const targetEmail = '931114366@qq.com';
    console.log(`🎯 目标用户邮箱: ${targetEmail}\n`);

    // 1. 检查用户是否存在
    console.log('1️⃣ 检查用户是否存在:');
    const user = await sql`
      SELECT u.id, u.email, u.name, u.created_at, up.*
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.email = ${targetEmail}
    `;

    if (user.length === 0) {
      console.log('   ❌ 用户不存在！');
      console.log('   💡 可能原因：');
      console.log('      - 用户还没有注册');
      console.log('      - 邮箱地址不正确');
      console.log('      - 用户数据被清理了');
      return;
    } else {
      console.log('   ✅ 用户存在');
      console.log(`   👤 用户ID: ${user[0].id}`);
      console.log(`   📧 邮箱: ${user[0].email}`);
      console.log(`   👤 姓名: ${user[0].name || '未设置'}`);
      console.log(`   📅 注册时间: ${new Date(user[0].created_at).toLocaleString()}`);
      console.log(`   💼 岗位类型: ${user[0].job_type || '未设置'}`);
    }

    // 2. 检查用户的所有反馈记录
    console.log('\n2️⃣ 检查用户的所有反馈记录:');
    const userFeedbacks = await sql`
      SELECT * FROM feedbacks 
      WHERE user_id = ${user[0].id}
      ORDER BY created_at DESC
    `;

    if (userFeedbacks.length === 0) {
      console.log('   ❌ 该用户没有任何反馈记录');
    } else {
      console.log(`   ✅ 找到 ${userFeedbacks.length} 条反馈记录:`);
      userFeedbacks.forEach((feedback: any, index: number) => {
        console.log(`\n   ${index + 1}. 反馈记录 #${feedback.id}:`);
        console.log(`      📝 面试状态: ${feedback.interview_status}`);
        console.log(`      📅 创建时间: ${new Date(feedback.created_at).toLocaleString()}`);
        console.log(`      📄 内容: ${feedback.content?.substring(0, 100)}...`);
      });
    }

    // 3. 检查用户的行为记录
    console.log('\n3️⃣ 检查用户的行为记录:');
    const userViews = await sql`
      SELECT * FROM user_daily_views 
      WHERE user_id = ${user[0].id}
      ORDER BY created_at DESC
    `;

    if (userViews.length === 0) {
      console.log('   ❌ 该用户没有任何浏览记录');
    } else {
      console.log(`   ✅ 找到 ${userViews.length} 条浏览记录:`);
      userViews.forEach((view: any, index: number) => {
        console.log(`   ${index + 1}. 浏览记录 #${view.id}: 浏览了用户 ${view.viewed_user_id} (${view.date})`);
      });
    }

    // 4. 检查用户的匹配记录
    console.log('\n4️⃣ 检查用户的匹配记录:');
    const userMatches = await sql`
      SELECT * FROM matches 
      WHERE user1_id = ${user[0].id} OR user2_id = ${user[0].id}
      ORDER BY created_at DESC
    `;

    if (userMatches.length === 0) {
      console.log('   ❌ 该用户没有任何匹配记录');
    } else {
      console.log(`   ✅ 找到 ${userMatches.length} 条匹配记录:`);
      userMatches.forEach((match: any, index: number) => {
        console.log(`   ${index + 1}. 匹配记录 #${match.id}: 用户${match.user1_id} ↔ 用户${match.user2_id} (状态: ${match.status})`);
      });
    }

    // 5. 检查API接口是否正常工作
    console.log('\n5️⃣ 检查API接口状态:');
    try {
      const response = await fetch('http://localhost:3001/api/user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_api',
          timestamp: new Date().toISOString(),
          context: 'debug_test'
        }),
      });
      
      if (response.ok) {
        console.log('   ✅ API接口正常工作');
      } else {
        console.log(`   ❌ API接口返回错误: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ API接口连接失败: ${error}`);
    }

    // 6. 检查前端代码中的问题
    console.log('\n6️⃣ 可能的问题分析:');
    console.log('   🔍 检查前端代码中的问题:');
    console.log('   1. 用户是否已登录？');
    console.log('   2. handleExpectMore函数是否被正确调用？');
    console.log('   3. API请求是否成功发送？');
    console.log('   4. 是否有JavaScript错误阻止了请求？');
    console.log('   5. 网络请求是否被拦截？');

    // 7. 检查数据库连接和权限
    console.log('\n7️⃣ 检查数据库状态:');
    const dbTest = await sql`SELECT NOW() as current_time, COUNT(*) as total_users FROM users`;
    console.log(`   🕐 数据库时间: ${dbTest[0].current_time}`);
    console.log(`   👥 总用户数: ${dbTest[0].total_users}`);

    // 8. 模拟一次点击记录
    console.log('\n8️⃣ 模拟添加点击记录:');
    try {
      const testFeedback = await sql`
        INSERT INTO feedbacks (
          user_id, 
          match_id, 
          interview_status, 
          content, 
          created_at, 
          updated_at
        ) VALUES (
          ${user[0].id},
          NULL,
          'system_feedback',
          ${JSON.stringify({
            action: 'expect_more_matches',
            timestamp: new Date().toISOString(),
            context: 'debug_test'
          })},
          NOW(),
          NOW()
        ) RETURNING id
      `;
      
      console.log(`   ✅ 成功添加测试记录，ID: ${testFeedback[0].id}`);
      
      // 立即查询验证
      const verifyFeedback = await sql`
        SELECT * FROM feedbacks WHERE id = ${testFeedback[0].id}
      `;
      console.log(`   ✅ 验证成功，记录内容: ${verifyFeedback[0].content}`);
      
    } catch (error) {
      console.log(`   ❌ 添加测试记录失败: ${error}`);
    }

    console.log('\n🎯 调试建议:');
    console.log('   1. 检查浏览器开发者工具的Network标签，看API请求是否发送');
    console.log('   2. 检查浏览器控制台是否有JavaScript错误');
    console.log('   3. 确认用户已登录且session有效');
    console.log('   4. 检查API接口的认证逻辑');
    console.log('   5. 验证数据库连接和权限');

  } catch (error) {
    console.error('❌ 调试失败:', error);
    process.exit(1);
  }
}

// 运行调试
debugUserFeedback().then(() => {
  console.log('\n✨ 用户反馈调试完成');
  process.exit(0);
});
