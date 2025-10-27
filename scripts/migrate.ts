import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/db/schema';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Neon SQL with the database connection string from environment variables
const sql = neon(process.env.DATABASE_URL!);

// Initialize drizzle with the Neon client and schema
const db = drizzle(sql, { schema });

async function main() {
  try {
    console.log('Starting database migration...');

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        email_verified TIMESTAMP,
        password_hash VARCHAR(255),
        image TEXT,
        name VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Created users table');

    // 修改现有users表以支持OAuth
    try {
      await sql`ALTER TABLE users ALTER COLUMN username DROP NOT NULL`;
      await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)`;
      console.log('Updated users table for OAuth support');
    } catch (error) {
      console.log('Users table already updated or error:', error);
    }

    // Create user_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        job_type VARCHAR(50) NOT NULL,
        experience_level VARCHAR(50) NOT NULL,
        target_company VARCHAR(255),
        target_industry VARCHAR(255),
        other_company_name VARCHAR(255),
        technical_interview BOOLEAN DEFAULT false,
        behavioral_interview BOOLEAN DEFAULT false,
        case_analysis BOOLEAN DEFAULT false,
        stats_questions BOOLEAN DEFAULT false,
        email VARCHAR(255),
        wechat VARCHAR(255),
        linkedin VARCHAR(255),
        bio VARCHAR(1000),
        school VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Created user_profiles table');

    // Add missing columns if they don't exist
    try {
      await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS other_company_name VARCHAR(255)`;
      console.log('Added other_company_name column');
    } catch (error) {
      console.log('other_company_name column already exists or error:', error);
    }

    try {
      await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255)`;
      console.log('Added linkedin column');
    } catch (error) {
      console.log('linkedin column already exists or error:', error);
    }

    try {
      await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio VARCHAR(1000)`;
      console.log('Added bio column');
    } catch (error) {
      console.log('bio column already exists or error:', error);
    }

    try {
      await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS school VARCHAR(255)`;
      console.log('Added school column');
    } catch (error) {
      console.log('school column already exists or error:', error);
    }

    try {
      await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS skills TEXT`;
      console.log('Added skills column');
    } catch (error) {
      console.log('skills column already exists or error:', error);
    }

    // Create matches table
    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER NOT NULL REFERENCES users(id),
        user2_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      )
    `;
    console.log('Created matches table');

    // Create feedbacks table
    await sql`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        match_id INTEGER NOT NULL REFERENCES matches(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        interview_status VARCHAR(10) NOT NULL,
        content TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Created feedbacks table');

    // Create user_daily_views table
    await sql`
      CREATE TABLE IF NOT EXISTS user_daily_views (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        viewed_user_id INTEGER NOT NULL REFERENCES users(id),
        date VARCHAR(10) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Created user_daily_views table');

    // Create user achievements table
    await sql`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        total_interviews INTEGER DEFAULT 0 NOT NULL,
        experience_points INTEGER DEFAULT 0 NOT NULL,
        current_level VARCHAR(50) DEFAULT '新用户' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)`;
    console.log('Created user_achievements table');

    // Create OAuth accounts table
    // Drop existing accounts table if it exists and recreate with correct structure
    await sql`DROP TABLE IF EXISTS accounts CASCADE`;
    await sql`
      CREATE TABLE accounts (
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
    console.log('Created accounts table');

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      )
    `;
    console.log('Created sessions table');

    // Create verification tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;
    console.log('Created verification_tokens table');

    // Create interview questions table
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
    
    // Create indexes for interview questions table
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON interview_questions(company)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_questions_position ON interview_questions(position)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_questions_type ON interview_questions(question_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_questions_year ON interview_questions(year)`;
    console.log('Created interview_questions table');

    // Create interview requests table
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
    
    // Create indexes for interview requests table
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_requests_company ON interview_requests(company)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_requests_position ON interview_requests(position)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_requests_status ON interview_requests(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interview_requests_created_at ON interview_requests(created_at)`;
    console.log('Created interview_requests table');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 