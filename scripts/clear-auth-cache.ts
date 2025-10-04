import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function clearAuthCache() {
  try {
    console.log('🧹 清除所有认证缓存...\n');
    
    // 1. 清除所有sessions
    console.log('🔐 清除用户sessions...');
    const sessionsResult = await sql`DELETE FROM sessions`;
    console.log(`   ✅ 删除了 ${sessionsResult.length} 条session记录`);
    
    // 2. 清除所有accounts
    console.log('👤 清除用户accounts...');
    const accountsResult = await sql`DELETE FROM accounts`;
    console.log(`   ✅ 删除了 ${accountsResult.length} 条account记录`);
    
    // 3. 清除所有verification tokens
    console.log('🔑 清除验证tokens...');
    const tokensResult = await sql`DELETE FROM verification_tokens`;
    console.log(`   ✅ 删除了 ${tokensResult.length} 条token记录`);
    
    console.log('\n✅ 所有认证缓存已清除！');
    console.log('\n💡 现在请：');
    console.log('1. 清除浏览器缓存和cookies');
    console.log('2. 或者使用无痕模式测试');
    console.log('3. 重新访问登录页面');
    
  } catch (error) {
    console.error('❌ 清除失败:', error);
    process.exit(1);
  }
}

// 运行清理
clearAuthCache().then(() => {
  console.log('✨ 脚本执行完成');
  process.exit(0);
});
