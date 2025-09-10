import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function clearProductionTestData() {
  try {
    console.log('🔒 生产环境安全测试数据清理...\n');
    console.log('⚠️  注意：此脚本专为生产环境设计，绝不会删除题库数据！\n');
    
    // 安全检查：确认当前环境
    const args = process.argv.slice(2);
    if (!args.includes('--confirm-production')) {
      console.log('❌ 安全检查失败！');
      console.log('💡 如要在生产环境执行，请添加 --confirm-production 参数');
      console.log('   示例: npm run clear-prod-data -- --confirm-production');
      return;
    }
    
    // 显示当前题库统计（确保不会被删除）
    console.log('📚 当前题库统计（将被保留）:');
    const questionStats = await sql`
      SELECT 
        COUNT(*) as total_questions,
        COUNT(DISTINCT company) as companies,
        COUNT(DISTINCT position) as positions
      FROM interview_questions
    `;
    console.log(`   总题目数: ${questionStats[0].total_questions}`);
    console.log(`   公司数: ${questionStats[0].companies}`);
    console.log(`   职位数: ${questionStats[0].positions}\n`);
    
    // 1. 清理用户反馈数据（测试产生的）
    console.log('📝 清理用户反馈数据...');
    const feedbackResult = await sql`DELETE FROM feedbacks`;
    console.log(`   ✅ 删除了 ${feedbackResult.length} 条反馈记录`);
    
    // 2. 清理匹配数据（测试产生的）
    console.log('🤝 清理匹配数据...');
    const matchesResult = await sql`DELETE FROM matches`;
    console.log(`   ✅ 删除了 ${matchesResult.length} 条匹配记录`);
    
    // 3. 清理用户浏览记录（测试产生的）
    console.log('👀 清理浏览记录...');
    const viewsResult = await sql`DELETE FROM user_daily_views`;
    console.log(`   ✅ 删除了 ${viewsResult.length} 条浏览记录`);
    
    // 4. 清理用户成就数据（测试产生的）
    console.log('🏆 清理成就数据...');
    const achievementsResult = await sql`DELETE FROM user_achievements`;
    console.log(`   ✅ 删除了 ${achievementsResult.length} 条成就记录`);
    
    // 5. 可选：清理测试用户资料（需要额外确认）
    if (args.includes('--clear-test-profiles')) {
      console.log('👤 清理测试用户资料...');
      console.log('⚠️  正在识别测试账户...');
      
      // 识别明显的测试账户（可以根据需要调整条件）
      const testProfiles = await sql`
        SELECT up.id, u.name, u.email 
        FROM user_profiles up 
        JOIN users u ON up.user_id = u.id 
        WHERE 
          u.email LIKE '%test%' OR 
          u.email LIKE '%demo%' OR 
          u.name LIKE '%测试%' OR
          u.name LIKE '%test%'
      `;
      
      if (testProfiles.length > 0) {
        console.log(`   发现 ${testProfiles.length} 个疑似测试账户:`);
        testProfiles.forEach((profile: any) => {
          console.log(`     - ${profile.name} (${profile.email})`);
        });
        
        // 删除这些测试账户的资料
        for (const profile of testProfiles) {
          await sql`DELETE FROM user_profiles WHERE user_id = ${profile.user_id}`;
        }
        console.log(`   ✅ 清理了 ${testProfiles.length} 个测试账户资料`);
      } else {
        console.log('   ℹ️  未发现明显的测试账户');
      }
    }
    
    // 6. 绝对不清理用户账户（除非明确指定测试账户）
    if (args.includes('--clear-test-users')) {
      console.log('🔑 清理测试用户账户...');
      
      // 只清理明显的测试账户
      const testUsers = await sql`
        SELECT id, name, email 
        FROM users 
        WHERE 
          email LIKE '%test%' OR 
          email LIKE '%demo%' OR 
          name LIKE '%测试%' OR
          name LIKE '%test%'
      `;
      
      if (testUsers.length > 0) {
        console.log(`   发现 ${testUsers.length} 个测试账户:`);
        testUsers.forEach((user: any) => {
          console.log(`     - ${user.name} (${user.email})`);
        });
        
        // 删除相关的认证数据和用户账户
        for (const user of testUsers) {
          await sql`DELETE FROM sessions WHERE user_id = ${user.id}`;
          await sql`DELETE FROM accounts WHERE user_id = ${user.id}`;
          await sql`DELETE FROM users WHERE id = ${user.id}`;
        }
        console.log(`   ✅ 清理了 ${testUsers.length} 个测试账户`);
      } else {
        console.log('   ℹ️  未发现明显的测试账户');
      }
    }
    
    // 7. 显示清理后的统计（确认题库完好）
    console.log('\n📊 清理后的数据库统计:');
    const stats = await sql`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'user_profiles', COUNT(*) FROM user_profiles  
      UNION ALL
      SELECT 'matches', COUNT(*) FROM matches
      UNION ALL
      SELECT 'feedbacks', COUNT(*) FROM feedbacks
      UNION ALL
      SELECT 'user_achievements', COUNT(*) FROM user_achievements
      UNION ALL
      SELECT 'user_daily_views', COUNT(*) FROM user_daily_views
      UNION ALL
      SELECT 'interview_questions', COUNT(*) FROM interview_questions
    `;
    
    stats.forEach((stat: any) => {
      const icon = stat.table_name === 'interview_questions' ? '📚' : '  ';
      console.log(`   ${icon} ${stat.table_name}: ${stat.count} 条记录`);
    });
    
    // 再次确认题库完好
    const finalQuestionCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
    console.log(`\n✅ 题库安全检查: ${finalQuestionCount[0].count} 道题目完好无损！`);
    
    console.log('\n🎉 生产环境测试数据清理完成！');
    console.log('\n💡 使用参数:');
    console.log('   --confirm-production     必需：确认在生产环境执行');
    console.log('   --clear-test-profiles    清理测试用户资料');
    console.log('   --clear-test-users       清理测试用户账户');
    console.log('\n   示例: npm run clear-prod-data -- --confirm-production --clear-test-profiles');
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }
}

// 运行清理
clearProductionTestData().then(() => {
  console.log('✨ 生产环境清理脚本执行完成');
  process.exit(0);
}); 