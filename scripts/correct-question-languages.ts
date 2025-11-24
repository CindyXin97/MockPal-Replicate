import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 检测文本主要语言
function detectLanguage(text: string): 'zh' | 'en' {
  if (!text) return 'zh';
  
  // 计算中文字符和英文字符数量
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  
  // 如果中文字符超过20个，或者中文字符多于英文单词，判定为中文
  if (chineseChars > 20 || chineseChars > englishWords) {
    return 'zh';
  }
  
  // 否则判定为英文
  return 'en';
}

async function correctQuestionLanguages() {
  console.log('🔧 Correcting question language classification...\n');
  
  try {
    // Step 1: 获取所有题目
    console.log('📝 Step 1: Fetching all questions...');
    const allQuestions = await sql`
      SELECT id, question, recommended_answer, created_at
      FROM interview_questions
      ORDER BY created_at DESC
    `;
    console.log(`✅ Found ${allQuestions.length} questions\n`);
    
    // Step 2: 今天添加的题目标记为英文
    console.log('📝 Step 2: Marking today\'s questions as English...');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayQuestions = await sql`
      UPDATE interview_questions
      SET language = 'en'
      WHERE DATE(created_at) = CURRENT_DATE
      RETURNING id
    `;
    console.log(`✅ Marked ${todayQuestions.length} questions from today as English\n`);
    
    // Step 3: 之前的题目标记为中文
    console.log('📝 Step 3: Marking older questions as Chinese...');
    const olderQuestions = await sql`
      UPDATE interview_questions
      SET language = 'zh'
      WHERE DATE(created_at) < CURRENT_DATE
      RETURNING id
    `;
    console.log(`✅ Marked ${olderQuestions.length} older questions as Chinese\n`);
    
    // Step 4: 验证分类
    console.log('📝 Step 4: Verifying classification...');
    const verification = await sql`
      SELECT 
        language,
        DATE(created_at) as date,
        COUNT(*) as count
      FROM interview_questions
      GROUP BY language, DATE(created_at)
      ORDER BY date DESC, language
    `;
    
    console.log('\n📊 Classification by date:');
    console.log('┌────────────┬──────────┬───────┐');
    console.log('│ Date       │ Language │ Count │');
    console.log('├────────────┼──────────┼───────┤');
    verification.forEach((row: any) => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      const langName = row.language === 'zh' ? '中文' : '英文';
      console.log(`│ ${dateStr} │ ${langName.padEnd(8)} │ ${String(row.count).padStart(5)} │`);
    });
    console.log('└────────────┴──────────┴───────┘');
    
    // Step 5: 总体统计
    console.log('\n📊 Overall language distribution:');
    const stats = await sql`
      SELECT 
        language,
        COUNT(*) as count,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM interview_questions
      GROUP BY language
      ORDER BY count DESC
    `;
    
    console.log('┌──────────┬───────┬────────────┐');
    console.log('│ Language │ Count │ Percentage │');
    console.log('├──────────┼───────┼────────────┤');
    stats.forEach((row: any) => {
      const langName = row.language === 'zh' ? '中文 (zh)' : '英文 (en)';
      const countStr = String(row.count).padStart(5);
      const pctStr = String(row.percentage).padStart(6) + '%';
      console.log(`│ ${langName.padEnd(8)} │ ${countStr} │ ${pctStr.padEnd(10)} │`);
    });
    console.log('└──────────┴───────┴────────────┘');
    
    // Step 6: 显示样本
    console.log('\n📝 Sample Chinese questions (older):');
    const zhSamples = await sql`
      SELECT company, position, LEFT(question, 60) as preview
      FROM interview_questions
      WHERE language = 'zh'
      ORDER BY created_at DESC
      LIMIT 3
    `;
    zhSamples.forEach((q: any, i: number) => {
      console.log(`${i + 1}. ${q.company} - ${q.position}`);
      console.log(`   ${q.preview}...`);
    });
    
    console.log('\n📝 Sample English questions (today):');
    const enSamples = await sql`
      SELECT company, position, LEFT(question, 60) as preview
      FROM interview_questions
      WHERE language = 'en'
      ORDER BY created_at DESC
      LIMIT 3
    `;
    enSamples.forEach((q: any, i: number) => {
      console.log(`${i + 1}. ${q.company} - ${q.position}`);
      console.log(`   ${q.preview}...`);
    });
    
    console.log('\n✅ Language classification corrected!');
    console.log('📝 Note: User-submitted questions will be auto-detected based on content.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

correctQuestionLanguages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

