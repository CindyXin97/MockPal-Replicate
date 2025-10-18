#!/usr/bin/env tsx

/**
 * 为测试账号准备一个新的可匹配用户
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { db } from '../lib/db';
import { users, userProfiles, matches } from '../lib/db/schema';
import { hash } from 'bcryptjs';
import { eq, or, and } from 'drizzle-orm';

async function setupNewMatchDemo() {
  console.log('🚀 准备新的匹配演示...\n');

  try {
    // 1. 查找测试用户
    const testUsers = await db.select().from(users).where(eq(users.email, 'test-first-match@mockpal.com')).limit(1);
    
    if (testUsers.length === 0) {
      console.log('❌ 未找到测试用户');
      return;
    }
    
    const testUser = testUsers[0];
    console.log(`✅ 找到测试用户 (ID: ${testUser.id})\n`);

    // 2. 创建一个新的候选用户
    const candidateEmail = 'candidate-for-demo@mockpal.com';
    const candidatePassword = 'Demo123456';
    const candidateName = 'Candidate User';
    
    console.log('📝 创建候选用户...');
    
    // 检查是否已存在
    const existingCandidate = await db.select().from(users).where(eq(users.email, candidateEmail)).limit(1);
    
    let candidateUser;
    if (existingCandidate.length > 0) {
      console.log('⚠️  候选用户已存在，正在更新...');
      candidateUser = existingCandidate[0];
      
      const hashedPassword = await hash(candidatePassword, 12);
      await db.update(users)
        .set({
          passwordHash: hashedPassword,
          name: candidateName,
          updatedAt: new Date()
        })
        .where(eq(users.id, candidateUser.id));
    } else {
      const hashedPassword = await hash(candidatePassword, 12);
      const [newUser] = await db.insert(users).values({
        email: candidateEmail,
        name: candidateName,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      candidateUser = newUser;
    }
    
    console.log(`✅ 候选用户准备完成 (ID: ${candidateUser.id})\n`);

    // 3. 创建用户资料
    console.log('📋 准备用户资料...');
    const existingProfiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, candidateUser.id)).limit(1);
    
    const profileData = {
      userId: candidateUser.id,
      jobType: 'Data Scientist',
      experienceLevel: '1-3年经验',
      targetCompany: 'Google',
      targetIndustry: 'Tech',
      technicalInterview: true,
      behavioralInterview: true,
      caseAnalysis: false,
      statsQuestions: true,
      email: candidateEmail,
      wechat: 'candidate_wechat',
      linkedin: 'https://linkedin.com/in/candidate',
      bio: '候选用户 - 用于演示匹配瞬间弹窗',
      updatedAt: new Date()
    };
    
    if (existingProfiles.length > 0) {
      await db.update(userProfiles)
        .set(profileData)
        .where(eq(userProfiles.userId, candidateUser.id));
      console.log('✅ 已更新用户资料');
    } else {
      await db.insert(userProfiles).values({
        ...profileData,
        createdAt: new Date()
      });
      console.log('✅ 已创建用户资料');
    }

    // 4. 清除这两个用户之间的旧匹配记录
    console.log('\n🧹 清除旧的匹配记录...');
    await db.delete(matches).where(
      or(
        and(eq(matches.user1Id, testUser.id), eq(matches.user2Id, candidateUser.id)),
        and(eq(matches.user1Id, candidateUser.id), eq(matches.user2Id, testUser.id))
      )
    );
    console.log('✅ 已清除旧记录');

    // 5. 候选用户先喜欢测试用户（准备好匹配）
    console.log('\n💝 设置候选用户喜欢测试用户...');
    await db.insert(matches).values({
      user1Id: candidateUser.id,
      user2Id: testUser.id,
      actionType: 'like',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ 候选用户已准备好');

    console.log('\n🎉 演示环境设置完成！\n');
    console.log('═══════════════════════════════════════════');
    console.log('📝 测试步骤：');
    console.log('═══════════════════════════════════════════');
    console.log('1. 清除标记（控制台）：');
    console.log('   localStorage.removeItem("mockpal_first_match_shown");');
    console.log('');
    console.log('2. 刷新页面');
    console.log('');
    console.log('3. 确保在"浏览候选人"标签页');
    console.log('');
    console.log('4. 浏览候选人，找到"Candidate User"');
    console.log('');
    console.log('5. 点击"匹配"按钮');
    console.log('');
    console.log('6. 🎊 弹窗会立即出现！');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 发生错误:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

setupNewMatchDemo();

