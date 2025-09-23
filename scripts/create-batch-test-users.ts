import { db } from '../lib/db';
import { users, userProfiles } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 测试用户模板
const testUserTemplates = [
  {
    email: 'test1@gmail.com',
    password: '123456',
    name: '测试用户1',
    profile: {
      jobType: 'Software Engineer',
      experienceLevel: 'Entry Level',
      targetCompany: 'Google',
      targetIndustry: 'Technology',
      technicalInterview: true,
      behavioralInterview: true,
      caseAnalysis: false,
      email: 'test1@gmail.com',
      wechat: 'test1_wechat',
      linkedin: 'https://linkedin.com/in/test1',
      bio: '刚毕业的软件工程师，正在寻找第一份工作。对前端开发很感兴趣，希望找到志同道合的练习伙伴。'
    }
  },
  {
    email: 'test2@gmail.com',
    password: '123456',
    name: '测试用户2',
    profile: {
      jobType: 'Data Scientist',
      experienceLevel: 'Mid Level',
      targetCompany: 'Meta',
      targetIndustry: 'Technology',
      technicalInterview: true,
      behavioralInterview: true,
      caseAnalysis: true,
      email: 'test2@gmail.com',
      wechat: 'test2_wechat',
      linkedin: 'https://linkedin.com/in/test2',
      bio: '有3年数据科学经验，正在准备跳槽到更大的公司。擅长机器学习和数据分析。'
    }
  },
  {
    email: 'test3@gmail.com',
    password: '123456',
    name: '测试用户3',
    profile: {
      jobType: 'Product Manager',
      experienceLevel: 'Senior Level',
      targetCompany: 'Apple',
      targetIndustry: 'Technology',
      technicalInterview: false,
      behavioralInterview: true,
      caseAnalysis: true,
      email: 'test3@gmail.com',
      wechat: 'test3_wechat',
      linkedin: 'https://linkedin.com/in/test3',
      bio: '资深产品经理，有丰富的产品设计和团队管理经验。正在寻找新的职业机会。'
    }
  },
  {
    email: 'test4@gmail.com',
    password: '123456',
    name: '测试用户4',
    profile: {
      jobType: 'UX Designer',
      experienceLevel: 'Mid Level',
      targetCompany: 'Netflix',
      targetIndustry: 'Entertainment',
      technicalInterview: false,
      behavioralInterview: true,
      caseAnalysis: true,
      email: 'test4@gmail.com',
      wechat: 'test4_wechat',
      linkedin: 'https://linkedin.com/in/test4',
      bio: '用户体验设计师，专注于移动应用和网页设计。希望找到设计思维练习伙伴。'
    }
  },
  {
    email: 'test5@gmail.com',
    password: '123456',
    name: '测试用户5',
    profile: {
      jobType: 'DevOps Engineer',
      experienceLevel: 'Senior Level',
      targetCompany: 'Amazon',
      targetIndustry: 'Cloud Computing',
      technicalInterview: true,
      behavioralInterview: false,
      caseAnalysis: false,
      email: 'test5@gmail.com',
      wechat: 'test5_wechat',
      linkedin: 'https://linkedin.com/in/test5',
      bio: 'DevOps专家，精通AWS、Docker和Kubernetes。正在准备系统设计面试。'
    }
  }
];

async function createOrUpdateUser(userData: typeof testUserTemplates[0]) {
  try {
    // 检查用户是否已存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userData.email),
      with: { profile: true }
    });

    if (existingUser) {
      // 更新现有用户
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await db.update(users)
        .set({
          name: userData.name,
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id));

      // 更新用户资料
      await db.update(userProfiles)
        .set({
          ...userData.profile,
          updatedAt: new Date()
        })
        .where(eq(userProfiles.userId, existingUser.id));

      console.log(`✅ 更新用户: ${userData.email}`);
      return existingUser.id;
    } else {
      // 创建新用户
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const [newUser] = await db.insert(users).values({
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // 创建用户资料
      await db.insert(userProfiles).values({
        userId: newUser.id,
        ...userData.profile,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ 创建用户: ${userData.email} (ID: ${newUser.id})`);
      return newUser.id;
    }
  } catch (error) {
    console.error(`❌ 处理用户 ${userData.email} 时出错:`, error);
    throw error;
  }
}

async function createBatchTestUsers() {
  console.log('🚀 开始批量创建测试用户...\n');

  try {
    const userIds = [];
    
    for (const userData of testUserTemplates) {
      const userId = await createOrUpdateUser(userData);
      userIds.push(userId);
    }

    console.log('\n🎉 批量创建完成！');
    console.log('\n📋 测试账号列表:');
    testUserTemplates.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} / ${user.password} (${user.name})`);
    });

    console.log('\n💡 使用方法:');
    console.log('1. 访问 http://localhost:3000/auth');
    console.log('2. 选择"邮箱+密码登录"');
    console.log('3. 使用任意测试账号登录');
    console.log('4. 开始测试匹配功能');

    return userIds;
  } catch (error) {
    console.error('❌ 批量创建失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createBatchTestUsers()
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { createBatchTestUsers, testUserTemplates };
