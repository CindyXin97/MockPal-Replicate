import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, userProfiles, matches } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function checkUserMatches(email: string) {
  console.log(`🔍 检查用户 ${email} 的匹配状态...\n`);
  
  try {
    // 1. 查找用户
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (user.length === 0) {
      console.log(`❌ 找不到用户: ${email}`);
      console.log('💡 可用的测试用户:');
      const allUsers = await db.select({ email: users.email, name: users.name }).from(users);
      allUsers.forEach(u => console.log(`   - ${u.email} (${u.name || '无名称'})`));
      return;
    }
    
    const currentUser = user[0];
    console.log(`✅ 找到用户: ${currentUser.email} (ID: ${currentUser.id}, 名称: ${currentUser.name || '无'})`);
    
    // 2. 检查用户profile
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);
    
    if (profile.length === 0) {
      console.log('❌ 用户没有profile，无法进行匹配');
      return;
    }
    
    console.log('\n📋 用户Profile信息:');
    const userProfile = profile[0];
    console.log(`   - 职位: ${userProfile.jobType || '未设置'}`);
    console.log(`   - 经验: ${userProfile.experienceLevel || '未设置'}`);
    console.log(`   - 目标公司: ${userProfile.targetCompany || '未设置'}`);
    console.log(`   - 面试偏好: ${[
      userProfile.technicalInterview && '技术面',
      userProfile.behavioralInterview && '行为面', 
      userProfile.caseAnalysis && '案例分析'
    ].filter(Boolean).join(', ') || '未设置'}`);
    console.log(`   - 联系方式: ${[
      userProfile.email && `邮箱(${userProfile.email})`,
      userProfile.wechat && `微信(${userProfile.wechat})`,
      userProfile.linkedin && `LinkedIn(${userProfile.linkedin})`
    ].filter(Boolean).join(', ') || '未设置'}`);
    
    // 3. 查找现有匹配记录
    console.log('\n🤝 现有匹配记录:');
    const existingMatches = await db
      .select({
        id: matches.id,
        user1Id: matches.user1Id,
        user2Id: matches.user2Id,
        status: matches.status,
        createdAt: matches.createdAt
      })
      .from(matches)
      .where(
        or(
          eq(matches.user1Id, currentUser.id),
          eq(matches.user2Id, currentUser.id)
        )
      );
    
    if (existingMatches.length === 0) {
      console.log('   📭 暂无匹配记录');
    } else {
      for (const match of existingMatches) {
        const partnerId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id;
        const partner = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, partnerId))
          .limit(1);
        
        const partnerInfo = partner[0] || { email: '未知', name: '未知' };
        const statusEmoji = match.status === 'accepted' ? '✅' : match.status === 'pending' ? '⏳' : '❌';
        console.log(`   ${statusEmoji} ${partnerInfo.email} (${partnerInfo.name}) - ${match.status} - ${match.createdAt?.toLocaleString()}`);
      }
    }
    
    // 4. 查找所有其他用户，看哪些可以匹配
    console.log('\n🎯 潜在匹配用户分析:');
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name
      })
      .from(users);
    
    for (const otherUser of allUsers) {
      // 跳过自己
      if (otherUser.id === currentUser.id) continue;
      
      const otherProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, otherUser.id))
        .limit(1);
      
      if (otherProfile.length === 0) continue;
      
      const otherUserProfile = otherProfile[0];
      
      // 检查是否已经有匹配记录
      const hasExistingMatch = existingMatches.some(match => 
        (match.user1Id === otherUser.id) || (match.user2Id === otherUser.id)
      );
      
      // 检查匹配兼容性
      const jobMatch = userProfile.jobType === otherUserProfile.jobType;
      const expMatch = userProfile.experienceLevel === otherUserProfile.experienceLevel;
      const practiceOverlap = 
        (userProfile.technicalInterview && otherUserProfile.technicalInterview) ||
        (userProfile.behavioralInterview && otherUserProfile.behavioralInterview) ||
        (userProfile.caseAnalysis && otherUserProfile.caseAnalysis);
      
      const hasContactInfo = !!(
        (otherUserProfile.email && otherUserProfile.email.trim() !== '') ||
        (otherUserProfile.wechat && otherUserProfile.wechat.trim() !== '') ||
        (otherUserProfile.linkedin && otherUserProfile.linkedin.trim() !== '')
      );
      
      let matchLevel = '🔴 不匹配';
      let reason = [];
      
      if (!hasContactInfo) {
        reason.push('无联系方式');
      }
      if (!otherUserProfile.jobType || !otherUserProfile.experienceLevel) {
        reason.push('资料不完整');
      }
      if (!(otherUserProfile.technicalInterview || otherUserProfile.behavioralInterview || otherUserProfile.caseAnalysis)) {
        reason.push('无面试偏好');
      }
      
      if (hasContactInfo && otherUserProfile.jobType && otherUserProfile.experienceLevel && 
          (otherUserProfile.technicalInterview || otherUserProfile.behavioralInterview || otherUserProfile.caseAnalysis)) {
        if (practiceOverlap && jobMatch && expMatch) {
          matchLevel = '🟢 高度匹配';
        } else if (practiceOverlap) {
          matchLevel = '🟡 中等匹配';
        } else if (jobMatch || expMatch) {
          matchLevel = '🟠 低度匹配';
        } else {
          matchLevel = '🔴 不匹配';
          reason.push('无共同点');
        }
      }
      
      const status = hasExistingMatch ? '(已有记录)' : '';
      console.log(`   ${matchLevel} ${otherUser.email} (${otherUser.name || '无名称'}) ${status}`);
      if (reason.length > 0) {
        console.log(`      原因: ${reason.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

// 从命令行参数获取邮箱，默认为567@gmail.com
const email = process.argv[2] || '567@gmail.com';
checkUserMatches(email).catch(console.error); 