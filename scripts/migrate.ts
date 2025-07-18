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
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Created users table');

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
        email VARCHAR(255),
        wechat VARCHAR(255),
        linkedin VARCHAR(255),
        bio VARCHAR(255),
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
      await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio VARCHAR(255)`;
      console.log('Added bio column');
    } catch (error) {
      console.log('bio column already exists or error:', error);
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

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 