import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function setupProductionDatabase() {
  try {
    console.log('🚀 开始设置生产环境数据库...');
    
    // 1. 运行完整的数据库迁移
    console.log('📋 步骤 1: 执行数据库迁移...');
    await runMigrations();
    
    // 2. 导入面试题目数据
    console.log('📚 步骤 2: 导入面试题目数据...');
    await seedInterviewQuestions();
    
    // 3. 验证数据
    console.log('✅ 步骤 3: 验证数据完整性...');
    await verifyData();
    
    console.log('🎉 生产环境数据库设置完成！');
    
  } catch (error) {
    console.error('❌ 设置失败:', error);
    process.exit(1);
  }
}

async function runMigrations() {
  // 创建用户表
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      email_verified TIMESTAMP,
      password_hash VARCHAR(255),
      image TEXT,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // 创建用户资料表
  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      job_type VARCHAR(50) NOT NULL,
      experience_level VARCHAR(50) NOT NULL,
      target_company VARCHAR(255),
      target_industry VARCHAR(255),
      other_company_name VARCHAR(255),
      technical_interview BOOLEAN DEFAULT FALSE,
      behavioral_interview BOOLEAN DEFAULT FALSE,
      case_analysis BOOLEAN DEFAULT FALSE,
      stats_questions BOOLEAN DEFAULT FALSE,
      email VARCHAR(255),
      wechat VARCHAR(255),
      linkedin VARCHAR(255),
      bio VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // 创建匹配表
  await sql`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER NOT NULL REFERENCES users(id),
      user2_id INTEGER NOT NULL REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'pending' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // 创建反馈表
  await sql`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id SERIAL PRIMARY KEY,
      match_id INTEGER NOT NULL REFERENCES matches(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      interview_status VARCHAR(10) NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // 创建用户成就表
  await sql`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      total_interviews INTEGER DEFAULT 0 NOT NULL,
      experience_points INTEGER DEFAULT 0 NOT NULL,
      current_level VARCHAR(50) DEFAULT '新用户' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // 创建面试题目表
  await sql`
    CREATE TABLE IF NOT EXISTS interview_questions (
      id SERIAL PRIMARY KEY,
      company VARCHAR(100) NOT NULL,
      position VARCHAR(100) NOT NULL,
      question_type VARCHAR(50) NOT NULL,
      difficulty VARCHAR(20) NOT NULL,
      question TEXT NOT NULL,
      recommended_answer TEXT,
      tags TEXT,
      source VARCHAR(100),
      year INTEGER NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // 创建面经需求表
  await sql`
    CREATE TABLE IF NOT EXISTS interview_requests (
      id SERIAL PRIMARY KEY,
      company VARCHAR(100) NOT NULL,
      position VARCHAR(100) NOT NULL,
      message TEXT,
      status VARCHAR(20) DEFAULT 'pending' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  // 创建OAuth相关表
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(255) NOT NULL,
      provider VARCHAR(255) NOT NULL,
      provider_account_id VARCHAR(255) NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type VARCHAR(255),
      scope TEXT,
      id_token TEXT,
      session_state VARCHAR(255)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      session_token VARCHAR(255) NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMP NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires TIMESTAMP NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `;

  // 创建索引
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON interview_questions(company)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_questions_position ON interview_questions(position)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_questions_type ON interview_questions(question_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_questions_year ON interview_questions(year)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_requests_company ON interview_requests(company)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_requests_position ON interview_requests(position)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_interview_requests_status ON interview_requests(status)`;

  console.log('✅ 数据库迁移完成');
}

async function seedInterviewQuestions() {
  // 检查是否已有数据
  const existingCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
  if (existingCount[0].count > 0) {
    console.log(`ℹ️  数据库中已有 ${existingCount[0].count} 道题目，跳过数据导入`);
    return;
  }

  // 导入种子脚本
  const { seedProductionQuestions } = await import('./seed-production-questions');
  await seedProductionQuestions();
}

async function verifyData() {
  const questionsCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
  const requestsTableExists = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'interview_requests'
    )
  `;
  
  console.log(`📊 验证结果:`);
  console.log(`   - 面试题目: ${questionsCount[0].count} 道`);
  console.log(`   - 需求收集表: ${requestsTableExists[0].exists ? '✅ 已创建' : '❌ 未创建'}`);
  
  if (questionsCount[0].count === 0) {
    throw new Error('面试题目数据导入失败');
  }
  
  if (!requestsTableExists[0].exists) {
    throw new Error('interview_requests 表创建失败');
  }
}

if (require.main === module) {
  setupProductionDatabase();
}

export { setupProductionDatabase }; 