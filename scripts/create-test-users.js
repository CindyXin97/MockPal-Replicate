require('dotenv').config({ path: '.env.local' });
const { hash } = require('bcryptjs');
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function createTestUsers() {
  try {
    console.log('Creating test users...');
    
    // 测试用户数据
    const testUsers = [
      {
        email: 'alice@test.com',
        name: 'Alice Wang',
        password: '123456',
        profile: {
          jobType: 'DA',
          experienceLevel: '应届',
          targetCompany: 'Google',
          targetIndustry: '互联网',
          technicalInterview: true,
          behavioralInterview: true,
          caseAnalysis: false,
          email: 'alice@test.com',
          wechat: 'alice_wang_123',
          bio: '数据分析新人，希望找到小伙伴一起练习面试～'
        }
      },
      {
        email: 'bob@test.com', 
        name: 'Bob Chen',
        password: '123456',
        profile: {
          jobType: 'DS',
          experienceLevel: '1-3年',
          targetCompany: 'Microsoft',
          targetIndustry: '互联网',
          technicalInterview: true,
          behavioralInterview: false,
          caseAnalysis: true,
          email: 'bob@test.com',
          linkedin: 'https://linkedin.com/in/bobchen',
          bio: '有两年数据科学经验，专注机器学习'
        }
      },
      {
        email: 'carol@test.com',
        name: 'Carol Li', 
        password: '123456',
        profile: {
          jobType: 'DE',
          experienceLevel: '3-5年',
          targetCompany: 'Amazon',
          targetIndustry: '电商',
          technicalInterview: true,
          behavioralInterview: true,
          caseAnalysis: false,
          wechat: 'carol_data_eng',
          linkedin: 'https://linkedin.com/in/caroli',
          bio: '数据工程师，熟悉大数据处理和云平台'
        }
      },
      {
        email: 'david@test.com',
        name: 'David Zhang',
        password: '123456', 
        profile: {
          jobType: 'BA',
          experienceLevel: '应届',
          targetCompany: 'Uber',
          targetIndustry: '出行',
          technicalInterview: false,
          behavioralInterview: true,
          caseAnalysis: true,
          email: 'david@test.com',
          wechat: 'david_zhang_ba',
          bio: '商业分析应届生，善于数据可视化和业务洞察'
        }
      }
    ];

    // 创建用户并生成资料
    for (const userData of testUsers) {
      console.log(`Creating user: ${userData.email}`);
      
      // 哈希密码
      const passwordHash = await hash(userData.password, 10);
      
      // 插入用户到users表
      const userResult = await sql`
        INSERT INTO users (email, name, password_hash, email_verified, created_at, updated_at)
        VALUES (${userData.email}, ${userData.name}, ${passwordHash}, NOW(), NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `;
      
      if (userResult.length === 0) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      const userId = userResult[0].id;
      console.log(`Created user with ID: ${userId}`);
      
      // 插入用户资料到userProfiles表
      await sql`
        INSERT INTO user_profiles (
          user_id, job_type, experience_level, target_company, target_industry,
          technical_interview, behavioral_interview, case_analysis,
          email, wechat, linkedin, bio, created_at, updated_at
        ) VALUES (
          ${userId}, ${userData.profile.jobType}, ${userData.profile.experienceLevel}, 
          ${userData.profile.targetCompany}, ${userData.profile.targetIndustry},
          ${userData.profile.technicalInterview}, ${userData.profile.behavioralInterview}, 
          ${userData.profile.caseAnalysis}, ${userData.profile.email || null}, 
          ${userData.profile.wechat || null}, ${userData.profile.linkedin || null}, 
          ${userData.profile.bio || null}, NOW(), NOW()
        )
      `;
      
      console.log(`Created profile for user ${userData.email}`);
    }
    
    console.log('✅ All test users created successfully!');
    console.log('\n测试账号登录信息:');
    console.log('邮箱: alice@test.com, 密码: 123456');
    console.log('邮箱: bob@test.com, 密码: 123456');
    console.log('邮箱: carol@test.com, 密码: 123456');
    console.log('邮箱: david@test.com, 密码: 123456');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

createTestUsers();