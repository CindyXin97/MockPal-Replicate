import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

async function addLanguageToUserPosts() {
  console.log('🌍 Adding language field to user_interview_posts table...\n');
  
  try {
    // 1. 添加语言字段
    console.log('📝 Step 1: Adding language column...');
    await sql`
      ALTER TABLE user_interview_posts 
      ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'zh' NOT NULL
    `;
    console.log('✅ Language column added\n');
    
    // 2. 创建索引
    console.log('📝 Step 2: Creating index...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_interview_posts_language 
      ON user_interview_posts(language)
    `;
    console.log('✅ Index created\n');
    
    // 3. 统计结果
    console.log('📊 User posts statistics:');
    const stats = await sql`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_interview_posts
      WHERE status = 'active'
    `;
    
    console.log(`   Total active posts: ${stats[0].total_posts}`);
    console.log(`   Unique users: ${stats[0].unique_users}`);
    
    console.log('\n✅ Language field successfully added to user posts!');
    console.log('📝 User posts will now auto-detect language based on content.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addLanguageToUserPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

