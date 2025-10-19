#!/usr/bin/env tsx

/**
 * 创建测试用户并与指定用户匹配，用于演示首次匹配弹窗功能
 * 运行: npx tsx scripts/create-test-match-for-demo.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { db } from '../lib/db';
import { users, userProfiles, matches } from '../lib/db/schema';
import { hash } from 'bcryptjs';
import { eq, or } from 'drizzle-orm';

async function createTestMatchForDemo() {
  console.log('🚀 开始创建测试匹配场景...\n');

  try {
    // 1. 查找目标用户 (xincindy924@gmail.com)
    console.log('🔍 查找目标用户: xincindy924@gmail.com');
    const targetUsers = await db.select().from(users).where(eq(users.email, 'xincindy924@gmail.com')).limit(1);
    
    if (targetUsers.length === 0) {
      console.log('❌ 未找到用户 xincindy924@gmail.com');
      return;
    }
    
    const targetUser = targetUsers[0];
    console.log(`✅ 找到目标用户 (ID: ${targetUser.id})\n`);

    // 2. 创建或更新测试用户
    const testEmail = 'test-first-match@mockpal.com';
    const testPassword = 'Test123456';
    const testName = 'Demo User';
    
    console.log('📝 创建测试用户...');
    console.log('   📧 邮箱:', testEmail);
    console.log('   🔐 密码:', testPassword);
    console.log('   👤 姓名:', testName);
    
    // 检查测试用户是否已存在
    const existingTestUsers = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    
    let testUser;
    if (existingTestUsers.length > 0) {
      console.log('⚠️  测试用户已存在，正在更新...');
      testUser = existingTestUsers[0];
      
      const hashedPassword = await hash(testPassword, 12);
      await db.update(users)
        .set({
          passwordHash: hashedPassword,
          name: testName,
          updatedAt: new Date()
        })
        .where(eq(users.id, testUser.id));
    } else {
      console.log('📝 创建新测试用户...');
      const hashedPassword = await hash(testPassword, 12);
      
      const [newUser] = await db.insert(users).values({
        email: testEmail,
        name: testName,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      testUser = newUser;
    }
    
    console.log(`✅ 测试用户准备完成 (ID: ${testUser.id})\n`);

    // 3. 检查或创建用户资料
    console.log('📋 准备用户资料...');
    const existingProfiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, testUser.id)).limit(1);
    
    const profileData = {
      userId: testUser.id,
      jobType: 'Data Analyst',
      experienceLevel: '0-1年经验',
      targetCompany: 'Meta',
      targetIndustry: 'Tech',
      technicalInterview: true,
      behavioralInterview: true,
      caseAnalysis: true,
      statsQuestions: false,
      email: testEmail,
      wechat: 'demo_user_wechat',
      linkedin: 'https://linkedin.com/in/demo-user',
      bio: '测试账号 - 用于演示首次匹配功能',
      school: '测试大学',
      skills: null,
      updatedAt: new Date()
    };
    
    if (existingProfiles.length > 0) {
      await db.update(userProfiles)
        .set(profileData)
        .where(eq(userProfiles.userId, testUser.id));
      console.log('✅ 已更新用户资料');
    } else {
      await db.insert(userProfiles).values({
        ...profileData,
        createdAt: new Date()
      });
      console.log('✅ 已创建用户资料');
    }

    // 4. 清除旧的匹配记录
    console.log('\n🧹 清除旧的匹配记录...');
    await db.delete(matches).where(
      or(
        eq(matches.user1Id, testUser.id),
        eq(matches.user2Id, testUser.id)
      )
    );
    console.log('✅ 已清除旧记录');

    // 5. 创建双向匹配记录
    console.log('\n💕 创建匹配记录...');
    
    // 测试用户喜欢目标用户
    await db.insert(matches).values({
      user1Id: testUser.id,
      user2Id: targetUser.id,
      actionType: 'like',
      status: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ 记录1: 测试用户(${testUser.id}) -> 目标用户(${targetUser.id})`);
    
    // 目标用户喜欢测试用户
    await db.insert(matches).values({
      user1Id: targetUser.id,
      user2Id: testUser.id,
      actionType: 'like',
      status: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`✅ 记录2: 目标用户(${targetUser.id}) -> 测试用户(${testUser.id})`);

    console.log('\n🎉 测试场景设置完成！\n');
    console.log('═══════════════════════════════════════════');
    console.log('📝 测试步骤：');
    console.log('═══════════════════════════════════════════');
    console.log('1. 打开浏览器控制台，清除首次匹配标记：');
    console.log('   localStorage.removeItem("mockpal_first_match_shown");');
    console.log('');
    console.log('2. 使用测试账号登录：');
    console.log(`   📧 邮箱: ${testEmail}`);
    console.log(`   🔐 密码: ${testPassword}`);
    console.log('');
    console.log('3. 登录后访问 /matches 页面');
    console.log('   你会看到与 xincindy924@gmail.com 的匹配！');
    console.log('   并且会弹出首次匹配成功弹窗！');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 发生错误:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

createTestMatchForDemo();
