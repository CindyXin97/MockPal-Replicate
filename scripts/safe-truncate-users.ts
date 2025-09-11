import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function safeTruncateUsers() {
  try {
    console.log('🚨 安全清理用户数据 - 按依赖顺序删除\n');
    
    // 安全检查
    const args = process.argv.slice(2);
    if (!args.includes('--confirm-delete-all-users')) {
      console.log('❌ 安全检查失败！');
      console.log('⚠️  此操作将删除所有用户数据！');
      console.log('💡 如确认要删除所有用户，请添加 --confirm-delete-all-users 参数');
      console.log('   示例: npm run safe-truncate-users -- --confirm-delete-all-users');
      console.log('\n🔒 题库数据将被保留，不会受到影响');
      return;
    }

    // 显示当前数据统计
    console.log('📊 删除前的数据统计:');
    const beforeStats = await sql`
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
      SELECT 'accounts', COUNT(*) FROM accounts
      UNION ALL
      SELECT 'sessions', COUNT(*) FROM sessions
      UNION ALL
      SELECT 'verification_tokens', COUNT(*) FROM verification_tokens
      UNION ALL
      SELECT 'interview_questions', COUNT(*) FROM interview_questions
    `;
    
    beforeStats.forEach((stat: any) => {
      const icon = stat.table_name === 'interview_questions' ? '📚' : '  ';
      console.log(`   ${icon} ${stat.table_name}: ${stat.count} 条记录`);
    });

    console.log('\n🔄 开始按依赖顺序删除数据...\n');

    // 第1步：删除验证令牌（独立表）
    console.log('1️⃣ 清理验证令牌...');
    await sql`DELETE FROM verification_tokens`;
    console.log('   ✅ verification_tokens 已清空');

    // 第2步：删除会话（引用users）
    console.log('2️⃣ 清理用户会话...');
    await sql`DELETE FROM sessions`;
    console.log('   ✅ sessions 已清空');

    // 第3步：删除OAuth账户（引用users）
    console.log('3️⃣ 清理OAuth账户...');
    await sql`DELETE FROM accounts`;
    console.log('   ✅ accounts 已清空');

    // 第4步：删除反馈（引用matches和users）
    console.log('4️⃣ 清理用户反馈...');
    await sql`DELETE FROM feedbacks`;
    console.log('   ✅ feedbacks 已清空');

    // 第5步：删除每日浏览记录（引用users）
    console.log('5️⃣ 清理浏览记录...');
    await sql`DELETE FROM user_daily_views`;
    console.log('   ✅ user_daily_views 已清空');

    // 第6步：删除用户成就（引用users）
    console.log('6️⃣ 清理用户成就...');
    await sql`DELETE FROM user_achievements`;
    console.log('   ✅ user_achievements 已清空');

    // 第7步：删除匹配记录（引用users）
    console.log('7️⃣ 清理匹配记录...');
    await sql`DELETE FROM matches`;
    console.log('   ✅ matches 已清空');

    // 第8步：删除用户资料（引用users）
    console.log('8️⃣ 清理用户资料...');
    await sql`DELETE FROM user_profiles`;
    console.log('   ✅ user_profiles 已清空');

    // 第9步：最后删除用户表（现在没有外键引用了）
    console.log('9️⃣ 清理用户基础数据...');
    await sql`DELETE FROM users`;
    console.log('   ✅ users 已清空');

    // 可选：重置自增ID
    if (args.includes('--reset-sequences')) {
      console.log('\n🔄 重置自增序列...');
      
      await sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE matches_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE feedbacks_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE user_achievements_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE user_daily_views_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE accounts_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE sessions_id_seq RESTART WITH 1`;
      
      console.log('   ✅ 所有自增序列已重置');
    }

    // 显示清理后的统计
    console.log('\n📊 清理后的数据统计:');
    const afterStats = await sql`
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
      SELECT 'accounts', COUNT(*) FROM accounts
      UNION ALL
      SELECT 'sessions', COUNT(*) FROM sessions
      UNION ALL
      SELECT 'verification_tokens', COUNT(*) FROM verification_tokens
      UNION ALL
      SELECT 'interview_questions', COUNT(*) FROM interview_questions
    `;
    
    afterStats.forEach((stat: any) => {
      const icon = stat.table_name === 'interview_questions' ? '📚' : '  ';
      console.log(`   ${icon} ${stat.table_name}: ${stat.count} 条记录`);
    });

    // 确认题库完好
    const questionCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
    console.log(`\n✅ 题库安全检查: ${questionCount[0].count} 道题目完好无损！`);

    console.log('\n🎉 安全清理完成！所有用户数据已删除，题库完整保留。');
    console.log('\n💡 使用参数:');
    console.log('   --confirm-delete-all-users  必需：确认删除所有用户');
    console.log('   --reset-sequences           可选：重置自增ID序列');
    console.log('\n   示例: npm run safe-truncate-users -- --confirm-delete-all-users --reset-sequences');

  } catch (error) {
    console.error('❌ 清理失败:', error);
    console.log('\n🔧 如果遇到外键约束错误，可能的解决方案:');
    console.log('   1. 检查是否有其他表引用了users表');
    console.log('   2. 确保按正确顺序删除数据');
    console.log('   3. 使用CASCADE删除（谨慎使用）');
    process.exit(1);
  }
}

// 运行清理
safeTruncateUsers().then(() => {
  console.log('✨ 安全清理脚本执行完成');
  process.exit(0);
}); 