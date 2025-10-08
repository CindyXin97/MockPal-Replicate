import { db } from '../lib/db';
import { users, userProfiles, matches, userDailyViews } from '../lib/db/schema';
import { eq, and, gte, inArray, or } from 'drizzle-orm';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 重置用户每日浏览额度
async function resetUserDailyViews() {
  console.log('🔄 重置用户每日浏览额度...');
  
  try {
    // 删除今天的浏览记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await db.delete(userDailyViews).where(
      gte(userDailyViews.date, today.toISOString().split('T')[0])
    );
    
    console.log('✅ 每日浏览额度已重置');
  } catch (error) {
    console.error('❌ 重置每日浏览额度失败:', error);
    throw error;
  }
}

// 清理测试用户的匹配记录
async function clearTestUserMatches() {
  console.log('🔄 清理测试用户匹配记录...');
  
  const testEmails = [
    'test1@gmail.com',
    'test2@gmail.com', 
    'test3@gmail.com',
    'test4@gmail.com',
    'test5@gmail.com',
    '123@gmail.com',
    '456@gmail.com',
    '1234@gmail.com',
    '12345@gmail.com'
  ];
  
  try {
    // 获取测试用户ID
    const testUsers = await db.query.users.findMany({
      where: inArray(users.email, testEmails)
    });
    
    const testUserIds = testUsers.map(user => user.id);
    
    if (testUserIds.length === 0) {
      console.log('⚠️ 没有找到测试用户');
      return;
    }
    
    // 删除测试用户的所有匹配记录
    await db.delete(matches).where(
      or(
        inArray(matches.user1Id, testUserIds),
        inArray(matches.user2Id, testUserIds)
      )
    );
    
    console.log(`✅ 已清理 ${testUserIds.length} 个测试用户的匹配记录`);
  } catch (error) {
    console.error('❌ 清理匹配记录失败:', error);
    throw error;
  }
}

// 显示测试用户状态
async function showTestUserStatus() {
  console.log('📊 测试用户状态:');
  
  const testEmails = [
    'test1@gmail.com',
    'test2@gmail.com', 
    'test3@gmail.com',
    'test4@gmail.com',
    'test5@gmail.com',
    '123@gmail.com',
    '456@gmail.com',
    '1234@gmail.com',
    '12345@gmail.com'
  ];
  
  try {
    const testUsers = await db.query.users.findMany({
      where: inArray(users.email, testEmails),
      with: { profile: true }
    });
    
    console.log(`\n👥 找到 ${testUsers.length} 个测试用户:`);
    testUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - ID: ${user.id}`);
    });
    
    // 显示今日浏览记录
    const today = new Date().toISOString().split('T')[0];
    const todayViews = await db.query.userDailyViews.findMany({
      where: eq(userDailyViews.date, today)
    });
    
    console.log(`\n📅 今日浏览记录 (${today}):`);
    if (todayViews.length === 0) {
      console.log('  - 无浏览记录');
    } else {
      const viewCounts = todayViews.reduce((acc, view) => {
        acc[view.userId] = (acc[view.userId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      Object.entries(viewCounts).forEach(([userId, count]) => {
        const user = testUsers.find(u => u.id === parseInt(userId));
        console.log(`  - ${user?.email || userId}: ${count}/4 次浏览`);
      });
    }
    
  } catch (error) {
    console.error('❌ 获取用户状态失败:', error);
  }
}

// 一键重置测试环境
async function resetTestEnvironment() {
  console.log('🚀 一键重置测试环境...\n');
  
  try {
    await resetUserDailyViews();
    await clearTestUserMatches();
    await showTestUserStatus();
    
    console.log('\n✅ 测试环境重置完成！');
    console.log('\n💡 现在可以重新开始测试了:');
    console.log('1. 所有测试用户的每日浏览额度已重置');
    console.log('2. 所有匹配记录已清理');
    console.log('3. 可以重新进行匹配测试');
  } catch (error) {
    console.error('❌ 重置测试环境失败:', error);
    process.exit(1);
  }
}

// 命令行参数处理
const command = process.argv[2];

switch (command) {
  case 'reset-views':
    resetUserDailyViews();
    break;
  case 'clear-matches':
    clearTestUserMatches();
    break;
  case 'status':
    showTestUserStatus();
    break;
  case 'reset-all':
  default:
    resetTestEnvironment();
    break;
}

export { resetUserDailyViews, clearTestUserMatches, showTestUserStatus, resetTestEnvironment };
