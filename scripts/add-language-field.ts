import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

async function addLanguageField() {
  console.log('🌍 Adding language field to interview_questions table...\n');
  
  try {
    // 1. 添加语言字段
    console.log('📝 Step 1: Adding language column...');
    await sql`
      ALTER TABLE interview_questions 
      ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'zh' NOT NULL
    `;
    console.log('✅ Language column added\n');
    
    // 2. 创建索引
    console.log('📝 Step 2: Creating index...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_interview_questions_language 
      ON interview_questions(language)
    `;
    console.log('✅ Index created\n');
    
    // 3. 更新英文题目（刚添加的）
    console.log('📝 Step 3: Marking English questions...');
    const result = await sql`
      UPDATE interview_questions 
      SET language = 'en'
      WHERE company IN (
        'Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix',
        'Airbnb', 'Uber', 'LinkedIn', 'Spotify', 'Stripe', 'DoorDash',
        'Apple', 'Tesla', 'Salesforce', 'Oracle', 'IBM'
      )
      AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    `;
    console.log(`✅ Marked English questions\n`);
    
    // 4. 统计结果
    console.log('📊 Language distribution:');
    const stats = await sql`
      SELECT 
        language,
        COUNT(*) as count,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM interview_questions
      GROUP BY language
      ORDER BY count DESC
    `;
    
    stats.forEach((row: any) => {
      const langName = row.language === 'zh' ? '中文' : '英文';
      console.log(`   ${langName} (${row.language}): ${row.count} 题 (${row.percentage}%)`);
    });
    
    console.log('\n✅ Language field successfully added!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addLanguageField()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

