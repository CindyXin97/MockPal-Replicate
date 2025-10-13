import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function simulateRecommendations() {
  console.log('\n🔮 模拟 User 7 的推荐逻辑\n');
  console.log('='.repeat(80));

  try {
    const userId = 7;
    const today = new Date().toISOString().split('T')[0];

    // Step 1: 检查今天的浏览次数
    console.log('\n📅 Step 1: 检查今天的浏览次数\n');
    
    const todayViews = await sql`
      SELECT * FROM user_daily_views 
      WHERE user_id = ${userId} AND date = ${today}
    `;

    console.log(`今天日期: ${today}`);
    console.log(`今天已浏览: ${todayViews.length} 人`);
    console.log(`每日限制: 4 人\n`);

    if (todayViews.length >= 4) {
      console.log('❌ 今天的浏览次数已用完！\n');
      console.log('这就是为什么显示"刷完了"的原因！\n');
      console.log('='.repeat(80));
      return;
    }

    const todayViewedIds = todayViews.map((v: any) => v.viewed_user_id);

    // Step 2: 查询所有历史浏览记录
    console.log('='.repeat(80));
    console.log('\n📖 Step 2: 查询历史浏览记录\n');
    
    const allViews = await sql`
      SELECT * FROM user_daily_views 
      WHERE user_id = ${userId}
    `;

    const allViewedUserIds = [...new Set(allViews.map((v: any) => v.viewed_user_id))];
    
    console.log(`历史已浏览: ${allViewedUserIds.length} 人\n`);

    // Step 3: 查询总用户数
    console.log('='.repeat(80));
    console.log('\n👥 Step 3: 查询总用户数\n');
    
    const allUsersWithProfiles = await sql`
      SELECT u.id, u.email, u.name
      FROM users u
      INNER JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.created_at DESC
    `;

    const totalUsersCount = allUsersWithProfiles.length;
    
    console.log(`总用户数: ${totalUsersCount}`);
    console.log(`自己: 1`);
    console.log(`其他用户: ${totalUsersCount - 1}\n`);

    // Step 4: 判断是否浏览完所有人
    console.log('='.repeat(80));
    console.log('\n🔄 Step 4: 判断第一轮 vs 第二轮\n');
    
    const hasViewedAll = allViewedUserIds.length >= totalUsersCount - 1;
    
    console.log(`已浏览人数: ${allViewedUserIds.length}`);
    console.log(`需要浏览人数: ${totalUsersCount - 1} （排除自己）`);
    console.log(`是否浏览完: ${hasViewedAll ? '✅ 是（第二轮）' : '❌ 否（第一轮）'}\n`);

    // Step 5: 获取所有 match 记录
    console.log('='.repeat(80));
    console.log('\n🔍 Step 5: 查询匹配记录\n');
    
    const existingMatches = await sql`
      SELECT * FROM matches
      WHERE user1_id = ${userId} OR user2_id = ${userId}
      ORDER BY created_at DESC
    `;

    console.log(`总匹配记录: ${existingMatches.length}\n`);

    // 按用户对分组，找到每个用户的最新状态
    const latestStatusByUser = new Map();
    
    for (const match of existingMatches) {
      const partnerId = match.user1_id === userId ? match.user2_id : match.user1_id;
      
      if (!latestStatusByUser.has(partnerId)) {
        latestStatusByUser.set(partnerId, match);
      }
    }

    console.log(`唯一用户对数: ${latestStatusByUser.size}\n`);

    // Step 6: 构建排除列表
    console.log('='.repeat(80));
    console.log('\n🚫 Step 6: 构建排除列表\n');
    
    let excludedIds: number[] = [userId]; // 永远排除自己

    if (hasViewedAll) {
      // 第二轮：只排除 accepted 用户
      console.log('第二轮逻辑: 只排除 accepted 用户\n');
      
      const acceptedUsers: number[] = [];
      for (const [partnerId, latestMatch] of latestStatusByUser.entries()) {
        if (latestMatch.status === 'accepted') {
          acceptedUsers.push(partnerId);
        }
      }
      
      console.log(`Accepted 用户: ${acceptedUsers.length} 人`);
      if (acceptedUsers.length > 0) {
        console.log(`  排除: ${acceptedUsers.join(', ')}`);
      }
      console.log('');
      
      excludedIds = [...excludedIds, ...acceptedUsers, ...todayViewedIds];
      
    } else {
      // 第一轮：排除所有有view记录的用户
      console.log('第一轮逻辑: 排除所有已浏览的用户\n');
      
      console.log(`已浏览用户: ${allViewedUserIds.length} 人`);
      console.log(`今天已浏览: ${todayViewedIds.length} 人\n`);
      
      excludedIds = [...excludedIds, ...allViewedUserIds, ...todayViewedIds];
      
      // 但对方最新操作是 like（发出邀请）的不排除（优先展示）
      const pendingInvitationsToMe: number[] = [];
      
      for (const [partnerId, latestMatch] of latestStatusByUser.entries()) {
        // 对方最新操作是 like，且是对方→我的方向
        if (latestMatch.user1_id === partnerId && 
            latestMatch.user2_id === userId && 
            latestMatch.action_type === 'like' &&
            latestMatch.status !== 'accepted') {
          pendingInvitationsToMe.push(partnerId);
        }
      }
      
      console.log(`对方发出的 pending 邀请: ${pendingInvitationsToMe.length} 人`);
      if (pendingInvitationsToMe.length > 0) {
        console.log(`  不排除: ${pendingInvitationsToMe.join(', ')} （会优先显示）`);
      }
      console.log('');
      
      // 从排除列表中移除对方的pending邀请
      excludedIds = excludedIds.filter((id: number) => !pendingInvitationsToMe.includes(id));
    }

    const uniqueExcludedIds = [...new Set(excludedIds)];
    
    console.log(`排除用户数: ${uniqueExcludedIds.length} 人`);
    console.log(`  - 自己: 1`);
    console.log(`  - 其他排除: ${uniqueExcludedIds.length - 1}`);
    console.log('');

    // Step 7: 计算可推荐用户
    console.log('='.repeat(80));
    console.log('\n✅ Step 7: 计算可推荐用户\n');
    
    const potentialUsers = allUsersWithProfiles.filter((u: any) => 
      !uniqueExcludedIds.includes(u.id)
    );

    console.log(`总用户数: ${totalUsersCount}`);
    console.log(`排除用户: ${uniqueExcludedIds.length}`);
    console.log(`可推荐用户: ${potentialUsers.length}\n`);

    if (potentialUsers.length > 0) {
      console.log('可推荐的用户:\n');
      potentialUsers.forEach((u: any, index: number) => {
        console.log(`  ${index + 1}. User ${u.id} - ${u.email}`);
      });
      console.log('');
    } else {
      console.log('❌ 没有可推荐的用户！\n');
      console.log('可能原因:');
      console.log('  1. 所有用户都已浏览过（第一轮）');
      console.log('  2. 或者所有未浏览的用户今天已经看过了\n');
    }

    // 最终结论
    console.log('='.repeat(80));
    console.log('\n🎯 最终结论\n');

    if (todayViews.length >= 4) {
      console.log('❌ 显示"刷完了"的原因: 今天的浏览次数已用完\n');
    } else if (potentialUsers.length === 0) {
      console.log('❌ 显示"刷完了"的原因: 没有可推荐的用户\n');
      console.log('具体情况:\n');
      console.log(`  - 总用户数: ${totalUsersCount - 1} 人（排除自己）`);
      console.log(`  - 已浏览: ${allViewedUserIds.length} 人`);
      console.log(`  - 未浏览: ${totalUsersCount - 1 - allViewedUserIds.length} 人`);
      console.log(`  - 今天已浏览: ${todayViewedIds.length} 人\n`);
      
      if (hasViewedAll) {
        console.log('  第二轮模式: 所有未 accepted 的用户都被今天的浏览限制排除了\n');
      } else {
        console.log('  第一轮模式: 虽然有未浏览的用户，但都被排除了\n');
      }
    } else {
      console.log(`✅ 应该有 ${potentialUsers.length} 个推荐用户\n`);
      console.log('如果前端显示"刷完了"，可能是:');
      console.log('  1. 前端缓存问题');
      console.log('  2. API 返回数据问题');
      console.log('  3. 或者其他前端逻辑\n');
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ 模拟失败:', error);
    process.exit(1);
  }
}

simulateRecommendations();

