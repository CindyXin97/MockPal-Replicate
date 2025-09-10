import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function clearTestData() {
  try {
    console.log('🧹 开始清理测试数据...\n');
    
    // 1. 清理用户反馈数据
    console.log('📝 清理反馈数据...');
    const feedbackResult = await sql`DELETE FROM feedbacks`;
    console.log(`   ✅ 删除了 ${feedbackResult.length} 条反馈记录`);
    
    // 2. 清理匹配数据
    console.log('🤝 清理匹配数据...');
    const matchesResult = await sql`DELETE FROM matches`;
    console.log(`   ✅ 删除了 ${matchesResult.length} 条匹配记录`);
    
    // 3. 清理用户浏览记录
    console.log('👀 清理浏览记录...');
    const viewsResult = await sql`DELETE FROM user_daily_views`;
    console.log(`   ✅ 删除了 ${viewsResult.length} 条浏览记录`);
    
    // 4. 清理用户成就数据
    console.log('🏆 清理成就数据...');
    const achievementsResult = await sql`DELETE FROM user_achievements`;
    console.log(`   ✅ 删除了 ${achievementsResult.length} 条成就记录`);
    
    // 5. 清理用户资料（可选）
    const args = process.argv.slice(2);
    if (args.includes('--clear-profiles')) {
      console.log('👤 清理用户资料...');
      const profilesResult = await sql`DELETE FROM user_profiles`;
      console.log(`   ✅ 删除了 ${profilesResult.length} 条用户资料`);
    }
    
    // 6. 清理用户账户（可选）
    if (args.includes('--clear-users')) {
      console.log('🔑 清理用户账户...');
      
      // 先清理相关的认证数据
      await sql`DELETE FROM sessions`;
      await sql`DELETE FROM accounts`;
      await sql`DELETE FROM verification_tokens`;
      
      const usersResult = await sql`DELETE FROM users`;
      console.log(`   ✅ 删除了 ${usersResult.length} 个用户账户`);
      console.log(`   ✅ 清理了相关的认证数据`);
    }
    
    // 7. 重置自增ID（可选）
    if (args.includes('--reset-ids')) {
      console.log('🔄 重置自增ID...');
      
      await sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE matches_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE feedbacks_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE user_achievements_id_seq RESTART WITH 1`;
      await sql`ALTER SEQUENCE user_daily_views_id_seq RESTART WITH 1`;
      
      console.log('   ✅ 所有自增ID已重置');
    }
    
    // 8. 显示清理后的统计
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
      console.log(`   ${stat.table_name}: ${stat.count} 条记录`);
    });
    
    console.log('\n🎉 数据清理完成！');
    console.log('\n💡 使用参数:');
    console.log('   --clear-profiles  清理用户资料');
    console.log('   --clear-users     清理用户账户（包含认证数据）');
    console.log('   --reset-ids       重置自增ID');
    console.log('\n   示例: npm run clear-data -- --clear-profiles --reset-ids');
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }
}

// 运行清理
clearTestData().then(() => {
  console.log('✨ 脚本执行完成');
  process.exit(0);
}); 