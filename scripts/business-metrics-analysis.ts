/**
 * 核心业务指标分析脚本
 * 分析MockPal平台的关键指标，并生成业务建议
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { 
  users, 
  userProfiles, 
  matches, 
  feedbacks, 
  userDailyViews,
  userAchievements,
  interviewQuestions,
  userInterviewPosts,
  interviewVotes,
  interviewComments
} from '@/lib/db/schema';
import { eq, and, gte, sql, count, desc } from 'drizzle-orm';

const dbClient = neon(process.env.DATABASE_URL!);
const db = drizzle(dbClient);

// 辅助函数：计算百分比
const percent = (num: number, total: number) => total > 0 ? ((num / total) * 100).toFixed(2) : '0.00';

// 辅助函数：格式化日期
const formatDate = (date: Date) => date.toISOString().split('T')[0];

async function analyzeBusinessMetrics() {
  console.log('📊 MockPal 核心业务指标分析');
  console.log('='.repeat(80));
  console.log(`分析时间: ${new Date().toLocaleString('zh-CN')}\n`);

  try {
    // ==================== 1. 用户指标 ====================
    console.log('👥 一、用户指标');
    console.log('-'.repeat(80));
    
    // 总用户数
    const allUsers = await db.select().from(users);
    const totalUsers = allUsers.length;
    console.log(`📈 总用户数: ${totalUsers}`);
    
    // 近7天新增用户
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= sevenDaysAgo);
    console.log(`🆕 7日新增用户: ${recentUsers.length} (${percent(recentUsers.length, totalUsers)}%)`);
    
    // 近30天新增用户
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthUsers = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo);
    console.log(`📅 30日新增用户: ${monthUsers.length} (${percent(monthUsers.length, totalUsers)}%)`);
    
    // 完成资料的用户
    const allProfiles = await db.select().from(userProfiles);
    const profilesWithContact = allProfiles.filter(p => p.email || p.wechat || p.linkedin);
    console.log(`✅ 已完成资料: ${allProfiles.length} (${percent(allProfiles.length, totalUsers)}%)`);
    console.log(`📞 提供联系方式: ${profilesWithContact.length} (${percent(profilesWithContact.length, totalUsers)}%)`);
    
    // 用户职位分布
    const jobTypeDistribution: Record<string, number> = {};
    allProfiles.forEach(p => {
      jobTypeDistribution[p.jobType] = (jobTypeDistribution[p.jobType] || 0) + 1;
    });
    console.log('\n职位类型分布:');
    Object.entries(jobTypeDistribution).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} (${percent(count, allProfiles.length)}%)`);
    });
    
    // 经验分布
    const expDistribution: Record<string, number> = {};
    allProfiles.forEach(p => {
      expDistribution[p.experienceLevel] = (expDistribution[p.experienceLevel] || 0) + 1;
    });
    console.log('\n经验水平分布:');
    Object.entries(expDistribution).forEach(([exp, count]) => {
      console.log(`  ${exp}: ${count} (${percent(count, allProfiles.length)}%)`);
    });
    
    // 练习偏好分布
    const technicalCount = allProfiles.filter(p => p.technicalInterview).length;
    const behavioralCount = allProfiles.filter(p => p.behavioralInterview).length;
    const caseCount = allProfiles.filter(p => p.caseAnalysis).length;
    const statsCount = allProfiles.filter(p => p.statsQuestions).length;
    console.log('\n练习偏好分布:');
    console.log(`  技术面试: ${technicalCount} (${percent(technicalCount, allProfiles.length)}%)`);
    console.log(`  行为面试: ${behavioralCount} (${percent(behavioralCount, allProfiles.length)}%)`);
    console.log(`  案例分析: ${caseCount} (${percent(caseCount, allProfiles.length)}%)`);
    console.log(`  统计问题: ${statsCount} (${percent(statsCount, allProfiles.length)}%)`);

    // ==================== 2. 匹配指标 ====================
    console.log('\n\n🤝 二、匹配指标');
    console.log('-'.repeat(80));
    
    const allMatches = await db.select().from(matches);
    const totalMatches = allMatches.length;
    console.log(`📊 总匹配数: ${totalMatches}`);
    
    // 匹配状态分布
    const matchStatusDist = {
      pending: allMatches.filter(m => m.status === 'pending').length,
      accepted: allMatches.filter(m => m.status === 'accepted').length,
      rejected: allMatches.filter(m => m.status === 'rejected').length,
    };
    console.log('\n匹配状态分布:');
    console.log(`  ⏳ 待回应 (pending): ${matchStatusDist.pending} (${percent(matchStatusDist.pending, totalMatches)}%)`);
    console.log(`  ✅ 已接受 (accepted): ${matchStatusDist.accepted} (${percent(matchStatusDist.accepted, totalMatches)}%)`);
    console.log(`  ❌ 已拒绝 (rejected): ${matchStatusDist.rejected} (${percent(matchStatusDist.rejected, totalMatches)}%)`);
    
    // 匹配成功率
    const matchSuccessRate = percent(matchStatusDist.accepted, totalMatches);
    console.log(`\n🎯 匹配成功率: ${matchSuccessRate}%`);
    
    // 联系状态分布（仅已接受的匹配）
    const acceptedMatches = allMatches.filter(m => m.status === 'accepted');
    const contactStatusDist = {
      not_contacted: acceptedMatches.filter(m => m.contactStatus === 'not_contacted').length,
      contacted: acceptedMatches.filter(m => m.contactStatus === 'contacted').length,
      scheduled: acceptedMatches.filter(m => m.contactStatus === 'scheduled').length,
      completed: acceptedMatches.filter(m => m.contactStatus === 'completed').length,
      no_response: acceptedMatches.filter(m => m.contactStatus === 'no_response').length,
    };
    console.log('\n联系状态分布（已接受的匹配）:');
    console.log(`  未联系: ${contactStatusDist.not_contacted} (${percent(contactStatusDist.not_contacted, acceptedMatches.length)}%)`);
    console.log(`  已联系: ${contactStatusDist.contacted} (${percent(contactStatusDist.contacted, acceptedMatches.length)}%)`);
    console.log(`  已安排: ${contactStatusDist.scheduled} (${percent(contactStatusDist.scheduled, acceptedMatches.length)}%)`);
    console.log(`  已完成: ${contactStatusDist.completed} (${percent(contactStatusDist.completed, acceptedMatches.length)}%)`);
    console.log(`  无回应: ${contactStatusDist.no_response} (${percent(contactStatusDist.no_response, acceptedMatches.length)}%)`);
    
    // 联系转化率
    const contactedCount = contactStatusDist.contacted + contactStatusDist.scheduled + contactStatusDist.completed;
    const contactConversionRate = percent(contactedCount, acceptedMatches.length);
    console.log(`\n📞 联系转化率: ${contactConversionRate}%`);
    
    // 近7天的匹配
    const recentMatches = allMatches.filter(m => m.createdAt && new Date(m.createdAt) >= sevenDaysAgo);
    console.log(`\n📈 7日内新增匹配: ${recentMatches.length}`);
    
    // 平均每用户匹配数
    const avgMatchesPerUser = (totalMatches / totalUsers).toFixed(2);
    console.log(`📊 人均匹配数: ${avgMatchesPerUser}`);

    // ==================== 3. 用户活跃度 ====================
    console.log('\n\n🔥 三、用户活跃度');
    console.log('-'.repeat(80));
    
    const allViews = await db.select().from(userDailyViews);
    const totalViews = allViews.length;
    console.log(`👀 总浏览次数: ${totalViews}`);
    
    // 近7天浏览
    const recentViews = allViews.filter(v => v.createdAt && new Date(v.createdAt) >= sevenDaysAgo);
    console.log(`📅 7日内浏览: ${recentViews.length}`);
    
    // 活跃用户（有浏览行为的用户）
    const activeUserIds = new Set(allViews.map(v => v.userId));
    const activeUsers = activeUserIds.size;
    console.log(`✅ 活跃用户数: ${activeUsers} (${percent(activeUsers, totalUsers)}%)`);
    
    // 近7天活跃用户
    const recentActiveUserIds = new Set(recentViews.map(v => v.userId));
    console.log(`🔥 7日活跃用户: ${recentActiveUserIds.size} (${percent(recentActiveUserIds.size, totalUsers)}%)`);
    
    // 人均浏览次数
    const avgViewsPerUser = (totalViews / totalUsers).toFixed(2);
    console.log(`📊 人均浏览次数: ${avgViewsPerUser}`);
    
    // 活跃用户人均浏览次数
    const avgViewsPerActiveUser = (totalViews / activeUsers).toFixed(2);
    console.log(`📈 活跃用户人均浏览: ${avgViewsPerActiveUser}`);

    // ==================== 4. 反馈与面试 ====================
    console.log('\n\n💬 四、反馈与面试完成情况');
    console.log('-'.repeat(80));
    
    const allFeedbacks = await db.select().from(feedbacks);
    const totalFeedbacks = allFeedbacks.length;
    console.log(`📝 总反馈数: ${totalFeedbacks}`);
    
    // 面试完成情况
    const interviewCompleted = allFeedbacks.filter(f => f.interviewStatus === 'yes').length;
    const interviewNotCompleted = allFeedbacks.filter(f => f.interviewStatus === 'no').length;
    console.log(`✅ 完成面试: ${interviewCompleted} (${percent(interviewCompleted, totalFeedbacks)}%)`);
    console.log(`❌ 未完成面试: ${interviewNotCompleted} (${percent(interviewNotCompleted, totalFeedbacks)}%)`);
    
    // 反馈率（相对于已接受的匹配）
    const feedbackRate = percent(totalFeedbacks, acceptedMatches.length);
    console.log(`📊 反馈率: ${feedbackRate}% (${totalFeedbacks}/${acceptedMatches.length} 已接受匹配)`);
    
    // 面试完成率（在提交反馈的用户中）
    const interviewCompletionRate = percent(interviewCompleted, totalFeedbacks);
    console.log(`🎯 面试完成率: ${interviewCompletionRate}%`);

    // ==================== 5. 内容指标 ====================
    console.log('\n\n📚 五、内容指标');
    console.log('-'.repeat(80));
    
    // 系统题库
    const systemQuestions = await db.select().from(interviewQuestions);
    console.log(`📖 系统题库数量: ${systemQuestions.length}`);
    
    // 题目类型分布
    const questionTypeDist: Record<string, number> = {};
    systemQuestions.forEach(q => {
      questionTypeDist[q.questionType] = (questionTypeDist[q.questionType] || 0) + 1;
    });
    console.log('\n系统题目类型分布:');
    Object.entries(questionTypeDist).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} (${percent(count, systemQuestions.length)}%)`);
    });
    
    // 难度分布
    const difficultyDist: Record<string, number> = {};
    systemQuestions.forEach(q => {
      difficultyDist[q.difficulty] = (difficultyDist[q.difficulty] || 0) + 1;
    });
    console.log('\n难度分布:');
    Object.entries(difficultyDist).forEach(([diff, count]) => {
      console.log(`  ${diff}: ${count} (${percent(count, systemQuestions.length)}%)`);
    });
    
    // 用户发布的题目
    const userPosts = await db.select().from(userInterviewPosts);
    console.log(`\n✍️  用户发布题目: ${userPosts.length}`);
    
    // 社区互动
    const allVotes = await db.select().from(interviewVotes);
    const allComments = await db.select().from(interviewComments);
    console.log(`👍 点赞总数: ${allVotes.length}`);
    console.log(`💬 评论总数: ${allComments.length}`);

    // ==================== 6. 转化漏斗 ====================
    console.log('\n\n🚀 六、用户转化漏斗');
    console.log('-'.repeat(80));
    
    const funnelData = {
      registered: totalUsers,
      completedProfile: allProfiles.length,
      hasView: activeUsers,
      hasMatch: new Set([...allMatches.map(m => m.user1Id), ...allMatches.map(m => m.user2Id)]).size,
      matchAccepted: new Set([...acceptedMatches.map(m => m.user1Id), ...acceptedMatches.map(m => m.user2Id)]).size,
      contacted: new Set(acceptedMatches.filter(m => m.contactStatus !== 'not_contacted').map(m => [m.user1Id, m.user2Id]).flat()).size,
      completedInterview: new Set(allFeedbacks.filter(f => f.interviewStatus === 'yes').map(f => f.userId)).size,
    };
    
    console.log('用户旅程转化率:');
    console.log(`  1️⃣  注册用户: ${funnelData.registered} (100%)`);
    console.log(`  2️⃣  完成资料: ${funnelData.completedProfile} (${percent(funnelData.completedProfile, funnelData.registered)}%) ⬇️ ${(100 - parseFloat(percent(funnelData.completedProfile, funnelData.registered))).toFixed(2)}% 流失`);
    console.log(`  3️⃣  开始浏览: ${funnelData.hasView} (${percent(funnelData.hasView, funnelData.completedProfile)}%) ⬇️ ${(100 - parseFloat(percent(funnelData.hasView, funnelData.completedProfile))).toFixed(2)}% 流失`);
    console.log(`  4️⃣  发起匹配: ${funnelData.hasMatch} (${percent(funnelData.hasMatch, funnelData.hasView)}%) ⬇️ ${(100 - parseFloat(percent(funnelData.hasMatch, funnelData.hasView))).toFixed(2)}% 流失`);
    console.log(`  5️⃣  匹配成功: ${funnelData.matchAccepted} (${percent(funnelData.matchAccepted, funnelData.hasMatch)}%) ⬇️ ${(100 - parseFloat(percent(funnelData.matchAccepted, funnelData.hasMatch))).toFixed(2)}% 流失`);
    console.log(`  6️⃣  建立联系: ${funnelData.contacted} (${percent(funnelData.contacted, funnelData.matchAccepted)}%) ⬇️ ${(100 - parseFloat(percent(funnelData.contacted, funnelData.matchAccepted))).toFixed(2)}% 流失 ⚠️ 关键瓶颈`);
    console.log(`  7️⃣  完成面试: ${funnelData.completedInterview} (${percent(funnelData.completedInterview, funnelData.contacted)}%)`);

    // ==================== 7. 用户活跃度分析 ====================
    console.log('\n\n📊 七、用户活跃度详细分析');
    console.log('-'.repeat(80));
    
    // 计算每个用户的活跃度得分
    interface UserActivity {
      userId: number;
      name: string | null;
      email: string | null;
      hasProfile: boolean;
      viewCount: number;
      matchCount: number;
      acceptedCount: number;
      feedbackCount: number;
      activityScore: number;
      lastActiveDate: Date | null;
    }
    
    const userActivities: UserActivity[] = [];
    
    for (const user of allUsers) {
      const profile = allProfiles.find(p => p.userId === user.id);
      const userViews = allViews.filter(v => v.userId === user.id);
      const userMatches = allMatches.filter(m => m.user1Id === user.id || m.user2Id === user.id);
      const userAccepted = acceptedMatches.filter(m => m.user1Id === user.id || m.user2Id === user.id);
      const userFeedbacks = allFeedbacks.filter(f => f.userId === user.id);
      
      // 计算活跃度得分
      const activityScore = 
        (profile ? 10 : 0) + // 完成资料
        userViews.length * 2 + // 每次浏览2分
        userMatches.length * 5 + // 每次匹配5分
        userAccepted.length * 15 + // 每次成功匹配15分
        userFeedbacks.length * 20; // 每次反馈20分
      
      // 最后活跃时间
      const lastDates = [
        user.createdAt ? new Date(user.createdAt) : null,
        ...userViews.map(v => v.createdAt ? new Date(v.createdAt) : null),
        ...userMatches.map(m => m.createdAt ? new Date(m.createdAt) : null),
      ].filter((d): d is Date => d !== null);
      
      const lastActiveDate = lastDates.length > 0 ? new Date(Math.max(...lastDates.map(d => d.getTime()))) : null;
      
      userActivities.push({
        userId: user.id,
        name: user.name,
        email: user.email,
        hasProfile: !!profile,
        viewCount: userViews.length,
        matchCount: userMatches.length,
        acceptedCount: userAccepted.length,
        feedbackCount: userFeedbacks.length,
        activityScore,
        lastActiveDate,
      });
    }
    
    // 按活跃度排序
    userActivities.sort((a, b) => b.activityScore - a.activityScore);
    
    // Top 10 最活跃用户
    console.log('🏆 Top 10 最活跃用户:');
    userActivities.slice(0, 10).forEach((ua, index) => {
      console.log(`  ${index + 1}. 用户${ua.userId} (${ua.name || '未设置'})`);
      console.log(`     活跃度: ${ua.activityScore}分 | 浏览: ${ua.viewCount} | 匹配: ${ua.matchCount} | 成功: ${ua.acceptedCount} | 反馈: ${ua.feedbackCount}`);
      console.log(`     最后活跃: ${ua.lastActiveDate ? formatDate(ua.lastActiveDate) : '未知'}`);
    });
    
    // 流失风险用户（有资料但7天未活跃）
    console.log('\n⚠️  流失风险用户（有资料但7天未活跃）:');
    const churnRiskUsers = userActivities.filter(ua => 
      ua.hasProfile && 
      ua.lastActiveDate && 
      ua.lastActiveDate < sevenDaysAgo
    );
    console.log(`  共 ${churnRiskUsers.length} 个用户`);
    churnRiskUsers.slice(0, 5).forEach(ua => {
      console.log(`  • 用户${ua.userId} (${ua.name || '未设置'}) - 最后活跃: ${ua.lastActiveDate ? formatDate(ua.lastActiveDate) : '未知'}`);
    });
    
    // 待激活用户（注册但未完成资料）
    console.log('\n💤 待激活用户（注册但未完成资料）:');
    const inactiveUsers = userActivities.filter(ua => !ua.hasProfile);
    console.log(`  共 ${inactiveUsers.length} 个用户 (${percent(inactiveUsers.length, totalUsers)}%)`);
    inactiveUsers.slice(0, 5).forEach(ua => {
      console.log(`  • 用户${ua.userId} (${ua.email || '未知'}) - 注册时间: ${allUsers.find(u => u.id === ua.userId)?.createdAt ? formatDate(new Date(allUsers.find(u => u.id === ua.userId)!.createdAt!)) : '未知'}`);
    });

    // ==================== 8. 近期增长潜力用户 ====================
    console.log('\n\n🌱 八、近期增长潜力用户');
    console.log('-'.repeat(80));
    
    // 定义潜力用户标准
    const potentialUsers = userActivities.filter(ua => 
      ua.hasProfile && // 有资料
      ua.viewCount > 0 && // 有浏览行为
      ua.acceptedCount === 0 && // 还没有成功匹配
      ua.lastActiveDate && ua.lastActiveDate >= sevenDaysAgo // 7天内活跃
    );
    
    console.log(`🎯 识别到 ${potentialUsers.length} 个潜力用户（有资料、有浏览、近期活跃、待成功匹配）:\n`);
    
    potentialUsers.forEach(ua => {
      console.log(`👤 用户${ua.userId} (${ua.name || '未设置'})`);
      console.log(`   邮箱: ${ua.email}`);
      console.log(`   浏览次数: ${ua.viewCount} | 发起匹配: ${ua.matchCount} | 最后活跃: ${ua.lastActiveDate ? formatDate(ua.lastActiveDate) : '未知'}`);
      
      // 获取该用户的资料详情
      const profile = allProfiles.find(p => p.userId === ua.userId);
      if (profile) {
        console.log(`   职位: ${profile.jobType} | 经验: ${profile.experienceLevel}`);
        const interests = [];
        if (profile.technicalInterview) interests.push('技术面试');
        if (profile.behavioralInterview) interests.push('行为面试');
        if (profile.caseAnalysis) interests.push('案例分析');
        if (profile.statsQuestions) interests.push('统计问题');
        console.log(`   练习偏好: ${interests.join(', ')}`);
      }
      console.log('');
    });

    // ==================== 9. 关键业务建议 ====================
    console.log('\n\n💡 九、关键业务建议');
    console.log('='.repeat(80));
    
    console.log('\n🔴 高优先级问题（立即处理）:');
    
    // 1. 资料完成率问题
    if (parseFloat(percent(allProfiles.length, totalUsers)) < 70) {
      console.log(`  1️⃣  资料完成率偏低 (${percent(allProfiles.length, totalUsers)}%)`);
      console.log(`     - 当前: ${allProfiles.length}/${totalUsers} 用户完成资料`);
      console.log(`     - 建议: 优化onboarding流程，增加资料完成引导`);
      console.log(`     - 行动: 对${inactiveUsers.length}个未完成资料用户发送提醒邮件`);
    }
    
    // 2. 联系转化率问题
    const contactConvRate = parseFloat(contactConversionRate);
    if (contactConvRate < 50 && acceptedMatches.length > 0) {
      console.log(`\n  2️⃣  联系转化率过低 (${contactConversionRate}%) ⚠️ 核心问题`);
      console.log(`     - 当前: ${contactedCount}/${acceptedMatches.length} 成功匹配后建立联系`);
      console.log(`     - 建议: `);
      console.log(`       • 匹配成功后立即发送邮件提醒，包含对方联系方式`);
      console.log(`       • 在匹配成功页面突出显示"下一步行动"指引`);
      console.log(`       • 3天后自动发送跟进提醒`);
      console.log(`       • 提供联系方式模板，降低用户联系门槛`);
    }
    
    // 3. 用户活跃度问题
    const activeRate = parseFloat(percent(activeUsers, totalUsers));
    if (activeRate < 50) {
      console.log(`\n  3️⃣  用户活跃度偏低 (${percent(activeUsers, totalUsers)}%)`);
      console.log(`     - 当前: ${activeUsers}/${totalUsers} 用户有浏览行为`);
      console.log(`     - 建议: `);
      console.log(`       • 每周发送推荐用户提醒邮件`);
      console.log(`       • 对${churnRiskUsers.length}个流失风险用户进行召回`);
      console.log(`       • 增加用户粘性功能（如每日签到、成就系统）`);
    }
    
    console.log('\n\n🟡 中优先级优化（近期处理）:');
    
    // 4. 匹配池规模
    if (totalUsers < 50) {
      console.log(`  4️⃣  用户池规模较小 (${totalUsers}人)`);
      console.log(`     - 建议: 加大推广力度，目标50+活跃用户`);
      console.log(`     - 渠道: 社交媒体、校友群、求职论坛、小红书`);
      console.log(`     - 激励: 推荐奖励机制（推荐1人解锁高级功能）`);
    }
    
    // 5. 内容丰富度
    if (systemQuestions.length < 100) {
      console.log(`\n  5️⃣  题库规模可扩展 (${systemQuestions.length}道题)`);
      console.log(`     - 建议: 持续扩充题库，目标200+题目`);
      console.log(`     - 方向: 增加更多公司和更新的题目`);
      console.log(`     - 激励: 鼓励用户贡献题目（已有${userPosts.length}个用户发布）`);
    }
    
    // 6. 社区活跃度
    if (allVotes.length + allComments.length < totalUsers * 2) {
      console.log(`\n  6️⃣  社区互动较少`);
      console.log(`     - 当前: ${allVotes.length}个点赞, ${allComments.length}条评论`);
      console.log(`     - 建议: 增加互动激励，如点赞/评论获得积分`);
    }
    
    console.log('\n\n🟢 长期增长策略:');
    console.log(`  📈 数据驱动增长:`);
    console.log(`     • 建立每日数据监控dashboard`);
    console.log(`     • 跟踪核心指标: DAU, 匹配成功率, 联系转化率`);
    console.log(`     • A/B测试优化关键流程`);
    console.log(`\n  💎 产品功能优化:`);
    console.log(`     • 智能匹配推荐算法优化`);
    console.log(`     • 移动端体验优化`);
    console.log(`     • 视频面试功能（未来）`);
    console.log(`\n  🎯 用户增长:`);
    console.log(`     • 校园大使计划`);
    console.log(`     • KOL合作推广`);
    console.log(`     • SEO优化（面试题目页面）`);
    
    // ==================== 10. 本周行动清单 ====================
    console.log('\n\n✅ 十、本周行动清单（优先级排序）');
    console.log('='.repeat(80));
    
    console.log('\n本周必做（Week 1 Priority）:');
    console.log(`  [ ] 1. 给${contactStatusDist.not_contacted}个已匹配但未联系的用户发送提醒`);
    console.log(`  [ ] 2. 给${churnRiskUsers.length}个流失风险用户发送召回邮件`);
    console.log(`  [ ] 3. 给${inactiveUsers.length}个未完成资料用户发送引导邮件`);
    console.log(`  [ ] 4. 优化匹配成功页面，增加"立即联系"引导`);
    console.log(`  [ ] 5. 设置自动化提醒邮件（匹配成功后第3天）`);
    
    console.log('\n下周计划（Week 2 Priority）:');
    console.log(`  [ ] 6. 在推广渠道发布新内容，目标获取20+新用户`);
    console.log(`  [ ] 7. 新增20-30道面试题到题库`);
    console.log(`  [ ] 8. 实施用户推荐奖励机制`);
    console.log(`  [ ] 9. 优化匹配算法，提高匹配精准度`);
    console.log(`  [ ] 10. 建立每日数据监控报表`);

    // ==================== 总结 ====================
    console.log('\n\n📌 分析总结');
    console.log('='.repeat(80));
    console.log(`\n✅ 优势：`);
    if (parseFloat(matchSuccessRate) > 40) {
      console.log(`  • 匹配成功率表现良好 (${matchSuccessRate}%)`);
    }
    if (parseFloat(interviewCompletionRate) > 60) {
      console.log(`  • 面试完成率较高 (${interviewCompletionRate}%)，产品价值得到验证`);
    }
    console.log(`  • 产品核心功能完整，技术架构稳定`);
    
    console.log(`\n⚠️  挑战：`);
    if (contactConvRate < 50) {
      console.log(`  • 联系转化率是最大瓶颈 (${contactConversionRate}%)`);
    }
    if (activeRate < 60) {
      console.log(`  • 用户活跃度需要提升`);
    }
    if (totalUsers < 50) {
      console.log(`  • 用户基数较小，需要加大推广`);
    }
    
    console.log(`\n🎯 近期目标（未来30天）：`);
    console.log(`  • 用户数: ${totalUsers} → ${Math.ceil(totalUsers * 1.5)} (+50%)`);
    console.log(`  • 活跃率: ${percent(activeUsers, totalUsers)}% → 70%+`);
    console.log(`  • 联系转化率: ${contactConversionRate}% → 50%+`);
    console.log(`  • 匹配成功率: 保持 ${matchSuccessRate}%+`);
    
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 分析完成！');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
    throw error;
  }
}

// 执行分析
analyzeBusinessMetrics().catch(console.error);

