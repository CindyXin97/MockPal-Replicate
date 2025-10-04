#!/usr/bin/env tsx

/**
 * 创建测试用户脚本
 * 运行: tsx scripts/create-test-user.ts [email] [password] [name]
 * 示例: tsx scripts/create-test-user.ts 456@gmail.com 123456 测试用户2
 */

import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { db } from '../lib/db';
import { users, userProfiles } from '../lib/db/schema';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createTestUser(email: string, password: string, name: string) {
  console.log('🚀 开始创建测试用户...');
  console.log('📧 邮箱:', email);
  console.log('🔐 密码:', password);
  console.log('👤 姓名:', name);

  try {
    // 检查用户是否已存在
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      console.log('⚠️ 用户已存在，正在更新密码...');
      
      // 更新密码
      const hashedPassword = await hash(password, 12);
      await db
        .update(users)
        .set({
          passwordHash: hashedPassword,
          name: name,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser[0].id));
      
      console.log('✅ 用户密码已更新！');
      console.log('🆔 用户ID:', existingUser[0].id);
      return existingUser[0];
    }

    // 创建新用户
    console.log('📝 创建新用户...');
    
    // 加密密码
    const hashedPassword = await hash(password, 12);
    
    // 插入用户
    const [newUser] = await db.insert(users).values({
      email,
      name,
      passwordHash: hashedPassword,
      emailVerified: new Date(), // 设置为已验证
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log('✅ 用户创建成功！');
    console.log('🆔 用户ID:', newUser.id);

    // 创建用户资料
    console.log('📋 创建用户资料...');
    
    // 根据邮箱生成不同的资料
    const profileData = getProfileByEmail(email);
    
    await db.insert(userProfiles).values({
      userId: newUser.id,
      ...profileData,
      email: email,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ 用户资料创建成功！');
    
    return newUser;

  } catch (error) {
    console.error('❌ 创建用户失败:', error);
    throw error;
  }
}

// 根据邮箱生成不同的用户资料
function getProfileByEmail(email: string) {
  const profiles = {
    '123@gmail.com': {
      jobType: 'DA',
      experienceLevel: '应届',
      targetCompany: '测试公司',
      targetIndustry: '科技',
      technicalInterview: true,
      behavioralInterview: true,
      caseAnalysis: true,
      statsQuestions: true,
      wechat: 'test_wechat_123',
      linkedin: '',
      bio: '这是第一个测试用户账号，用于开发环境测试。',
      school: 'Stanford University',
    },
    '456@gmail.com': {
      jobType: 'DS',
      experienceLevel: '1-3年',
      targetCompany: 'Google',
      targetIndustry: '互联网',
      technicalInterview: true,
      behavioralInterview: true,
      caseAnalysis: false,
      statsQuestions: true,
      wechat: 'test_wechat_456',
      linkedin: 'linkedin.com/in/test456',
      bio: '这是第二个测试用户账号，数据科学家背景，有1-3年工作经验。',
      school: 'MIT',
    }
  };

  return profiles[email as keyof typeof profiles] || {
    jobType: 'DA',
    experienceLevel: '应届',
    targetCompany: '测试公司',
    targetIndustry: '科技',
    technicalInterview: true,
    behavioralInterview: true,
    caseAnalysis: true,
    statsQuestions: true,
    wechat: 'test_wechat',
    linkedin: '',
    bio: '这是一个测试用户账号，用于开发环境测试。',
    school: 'UC Berkeley',
  };
}

async function main() {
  try {
    // 从命令行参数获取用户信息，或使用默认值
    const args = process.argv.slice(2);
    const email = args[0] || '123@gmail.com';
    const password = args[1] || '123456';
    const name = args[2] || '测试用户';

    const user = await createTestUser(email, password, name);
    
    console.log('\n🎉 测试用户创建完成！');
    console.log('📋 登录信息:');
    console.log(`   邮箱: ${email}`);
    console.log(`   密码: ${password}`);
    console.log('\n💡 使用方法:');
    console.log('1. 访问 http://localhost:3000/auth');
    console.log('2. 选择"邮箱+密码登录"');
    console.log('3. 输入上述邮箱和密码');
    console.log('4. 点击登录即可');
    
  } catch (error) {
    console.error('💥 脚本执行失败:', error);
    process.exit(1);
  }
}

// 执行脚本
main(); 