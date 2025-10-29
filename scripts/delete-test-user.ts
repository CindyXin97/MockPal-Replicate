/**
 * 删除测试用户 931114366@qq.com (ID: 55)
 */

import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/db/schema';
import { 
  users, 
  userProfiles, 
  matches, 
  userDailyViews, 
  userDailyBonus,
  feedbacks,
  userAchievements,
  posts,
  comments,
  votes,
  savedQuestions,
  notifications
} from '../lib/db/schema';
import { eq, or } from 'drizzle-orm';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 初始化数据库连接
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function deleteTestUser() {
  try {
    const targetEmail = '931114366@qq.com';
    
    console.log('🗑️  准备删除测试用户...\n');
    console.log(`目标邮箱: ${targetEmail}\n`);
    
    // 1. 查找用户
    console.log('步骤1: 查找用户');
    const user = await db.query.users.findFirst({
      where: eq(users.email, targetEmail),
    });
    
    if (!user) {
      console.log('❌ 未找到该用户');
      return;
    }
    
    const userId = user.id;
    console.log(`✅ 找到用户: ID ${userId}, 昵称: ${user.name || '未设置'}\n`);
    
    // 2. 显示将要删除的数据
    console.log('步骤2: 检查相关数据\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 查询各表的记录数
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    console.log(`- user_profiles: ${profile ? '1条记录' : '0条记录'}`);
    
    const matchesData = await db.select()
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));
    console.log(`- matches: ${matchesData.length}条记录`);
    
    const viewsAsViewer = await db.query.userDailyViews.findMany({
      where: eq(userDailyViews.userId, userId),
    });
    console.log(`- user_daily_views (作为浏览者): ${viewsAsViewer.length}条记录`);
    
    const viewsAsViewed = await db.query.userDailyViews.findMany({
      where: eq(userDailyViews.viewedUserId, userId),
    });
    console.log(`- user_daily_views (被浏览): ${viewsAsViewed.length}条记录`);
    
    const bonusData = await db.query.userDailyBonus.findMany({
      where: eq(userDailyBonus.userId, userId),
    });
    console.log(`- user_daily_bonus: ${bonusData.length}条记录`);
    
    const achievementsData = await db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, userId),
    });
    console.log(`- user_achievements: ${achievementsData.length}条记录`);
    
    const feedbacksData = await db.query.feedbacks.findMany({
      where: eq(feedbacks.userId, userId),
    });
    console.log(`- feedbacks: ${feedbacksData.length}条记录`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 3. 开始删除（按照外键依赖顺序）
    console.log('步骤3: 开始删除数据\n');
    
    let deletedCount = 0;
    
    // 3.1 删除 feedbacks
    if (feedbacksData.length > 0) {
      const result = await db.delete(feedbacks)
        .where(eq(feedbacks.userId, userId));
      console.log(`✅ 删除 feedbacks: ${feedbacksData.length}条`);
      deletedCount += feedbacksData.length;
    }
    
    // 3.2 删除 user_daily_views (作为浏览者)
    if (viewsAsViewer.length > 0) {
      const result = await db.delete(userDailyViews)
        .where(eq(userDailyViews.userId, userId));
      console.log(`✅ 删除 user_daily_views (作为浏览者): ${viewsAsViewer.length}条`);
      deletedCount += viewsAsViewer.length;
    }
    
    // 3.3 删除 user_daily_views (被浏览) - 这会影响其他用户的浏览记录
    if (viewsAsViewed.length > 0) {
      const result = await db.delete(userDailyViews)
        .where(eq(userDailyViews.viewedUserId, userId));
      console.log(`✅ 删除 user_daily_views (被浏览): ${viewsAsViewed.length}条`);
      deletedCount += viewsAsViewed.length;
    }
    
    // 3.4 删除 user_daily_bonus
    if (bonusData.length > 0) {
      const result = await db.delete(userDailyBonus)
        .where(eq(userDailyBonus.userId, userId));
      console.log(`✅ 删除 user_daily_bonus: ${bonusData.length}条`);
      deletedCount += bonusData.length;
    }
    
    // 3.5 删除 user_achievements
    if (achievementsData.length > 0) {
      const result = await db.delete(userAchievements)
        .where(eq(userAchievements.userId, userId));
      console.log(`✅ 删除 user_achievements: ${achievementsData.length}条`);
      deletedCount += achievementsData.length;
    }
    
    // 3.6 删除 matches
    if (matchesData.length > 0) {
      const result = await db.delete(matches)
        .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));
      console.log(`✅ 删除 matches: ${matchesData.length}条`);
      deletedCount += matchesData.length;
    }
    
    // 3.7 删除 posts (如果有)
    try {
      const postsData = await db.delete(posts)
        .where(eq(posts.userId, userId))
        .returning();
      if (postsData.length > 0) {
        console.log(`✅ 删除 posts: ${postsData.length}条`);
        deletedCount += postsData.length;
      }
    } catch (error) {
      // 表可能不存在，忽略
    }
    
    // 3.8 删除 comments (如果有)
    try {
      const commentsData = await db.delete(comments)
        .where(eq(comments.userId, userId))
        .returning();
      if (commentsData.length > 0) {
        console.log(`✅ 删除 comments: ${commentsData.length}条`);
        deletedCount += commentsData.length;
      }
    } catch (error) {
      // 表可能不存在，忽略
    }
    
    // 3.9 删除 votes (如果有)
    try {
      const votesData = await db.delete(votes)
        .where(eq(votes.userId, userId))
        .returning();
      if (votesData.length > 0) {
        console.log(`✅ 删除 votes: ${votesData.length}条`);
        deletedCount += votesData.length;
      }
    } catch (error) {
      // 表可能不存在，忽略
    }
    
    // 3.10 删除 saved_questions (如果有)
    try {
      const savedData = await db.delete(savedQuestions)
        .where(eq(savedQuestions.userId, userId))
        .returning();
      if (savedData.length > 0) {
        console.log(`✅ 删除 saved_questions: ${savedData.length}条`);
        deletedCount += savedData.length;
      }
    } catch (error) {
      // 表可能不存在，忽略
    }
    
    // 3.11 删除 notifications (如果有)
    try {
      const notificationsData = await db.delete(notifications)
        .where(eq(notifications.userId, userId))
        .returning();
      if (notificationsData.length > 0) {
        console.log(`✅ 删除 notifications: ${notificationsData.length}条`);
        deletedCount += notificationsData.length;
      }
    } catch (error) {
      // 表可能不存在，忽略
    }
    
    // 3.12 删除 user_profiles
    if (profile) {
      const result = await db.delete(userProfiles)
        .where(eq(userProfiles.userId, userId));
      console.log(`✅ 删除 user_profiles: 1条`);
      deletedCount += 1;
    }
    
    // 3.13 最后删除 users 表的记录
    const result = await db.delete(users)
      .where(eq(users.id, userId))
      .returning();
    
    if (result.length > 0) {
      console.log(`✅ 删除 users: 1条`);
      deletedCount += 1;
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 删除完成！总共删除了 ${deletedCount} 条记录`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 4. 验证删除结果
    console.log('步骤4: 验证删除结果\n');
    const verifyUser = await db.query.users.findFirst({
      where: eq(users.email, targetEmail),
    });
    
    if (!verifyUser) {
      console.log('✅ 验证成功：用户已完全删除\n');
    } else {
      console.log('⚠️  警告：用户仍然存在\n');
    }
    
    // 5. 检查是否影响"蓬松的头发"
    console.log('步骤5: 检查对"蓬松的头发"的影响\n');
    
    const pengSongUserId = 4;
    const pengSongViews = await db.query.userDailyViews.findMany({
      where: eq(userDailyViews.userId, pengSongUserId),
    });
    const uniqueViewed = [...new Set(pengSongViews.map(v => v.viewedUserId))];
    
    console.log(`"蓬松的头发"当前已浏览: ${uniqueViewed.length} 个不同用户`);
    
    // 检查总用户数
    const totalUsers = await db.query.users.findMany();
    const usersWithProfile = totalUsers.filter(async (u) => {
      const p = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, u.id),
      });
      return p !== undefined;
    });
    
    console.log(`系统当前总用户数: ${totalUsers.length}`);
    console.log(`需要浏览数: ${totalUsers.length - 1} 人`);
    
    const isSecondRound = uniqueViewed.length >= totalUsers.length - 1;
    console.log(`"蓬松的头发"当前轮次: ${isSecondRound ? '第二轮 ✅' : '第一轮'}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 测试用户删除成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ 删除过程出错:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

// 运行删除
deleteTestUser();

