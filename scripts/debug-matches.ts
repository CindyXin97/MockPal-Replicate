import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function debugMatches() {
  console.log('🔍 调试 matches 页面加载问题...\n');
  
  try {
    // 1. 检查测试用户
    console.log('1. 检查测试用户:');
    const testUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, 'test1@gmail.com'));
    
    if (testUsers.length === 0) {
      console.log('❌ 找不到测试用户 test1@gmail.com');
      console.log('💡 请先运行: npm run create-batch-users');
      return;
    }
    
    const testUser = testUsers[0];
    console.log(`✅ 找到测试用户: ${testUser.email} (ID: ${testUser.id})`);
    
    // 2. 检查用户profile
    console.log('\n2. 检查用户profile:');
    const profiles = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, testUser.id));
    
    if (profiles.length === 0) {
      console.log('❌ 测试用户没有完整的profile');
      console.log('💡 这可能是加载卡住的原因');
      console.log('💡 请先登录并完善个人资料');
      return;
    }
    
    const profile = profiles[0];
    console.log('✅ 找到用户profile:');
    console.log(`   - 姓名: ${profile.name}`);
    console.log(`   - 职位: ${profile.jobType}`);
    console.log(`   - 经验: ${profile.experienceLevel}`);
    console.log(`   - 目标公司: ${profile.targetCompany}`);
    console.log(`   - 目标行业: ${profile.targetIndustry}`);
    
    // 检查profile完整性
    const isComplete = !!(
      profile.name && 
      profile.jobType && 
      profile.experienceLevel && 
      profile.targetCompany && 
      profile.targetIndustry &&
      (profile.technicalInterview || profile.behavioralInterview || profile.caseAnalysis) &&
      (profile.email || profile.wechat || profile.linkedin)
    );
    
    console.log(`   - Profile完整性: ${isComplete ? '✅ 完整' : '❌ 不完整'}`);
    
    if (!isComplete) {
      console.log('💡 Profile不完整可能导致页面一直加载');
      console.log('💡 请确保以下字段都有值:');
      if (!profile.name) console.log('   - 姓名');
      if (!profile.jobType) console.log('   - 职位类型');
      if (!profile.experienceLevel) console.log('   - 经验水平');
      if (!profile.targetCompany) console.log('   - 目标公司');
      if (!profile.targetIndustry) console.log('   - 目标行业');
      if (!(profile.technicalInterview || profile.behavioralInterview || profile.caseAnalysis)) {
        console.log('   - 面试偏好（至少选择一项）');
      }
      if (!(profile.email || profile.wechat || profile.linkedin)) {
        console.log('   - 联系方式（至少填写一项）');
      }
    }
    
    // 3. 检查其他用户数量
    console.log('\n3. 检查可匹配用户数量:');
    const allUsers = await db.select().from(users);
    console.log(`✅ 总用户数: ${allUsers.length}`);
    
    if (allUsers.length < 2) {
      console.log('⚠️  用户数量太少，可能影响匹配功能');
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  }
}

debugMatches().catch(console.error); 