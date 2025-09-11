import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 将3道题目从Hard调整为Medium
const mediumAdjustments = [
  {
    company: 'LinkedIn',
    position: '数据分析师',
    questionPattern: '579. Find Cumulative Salary',
    newDifficulty: 'medium',
    reason: '累计工资计算虽然复杂但相对容易理解'
  },
  {
    company: 'Meta',
    position: '数据分析师', 
    questionPattern: '1097. Game Play Analysis V',
    newDifficulty: 'medium',
    reason: '用户留存分析是常见的数据分析场景'
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionPattern: '615. Average Salary',
    newDifficulty: 'medium', 
    reason: '薪资对比分析逻辑相对直观'
  }
];

async function adjustSomeToMedium() {
  console.log('🔄 开始将3道题目调整为Medium难度...\n');
  
  try {
    let adjustedCount = 0;
    
    for (const adjustment of mediumAdjustments) {
      // 更新题目难度
      const result = await sql`
        UPDATE interview_questions 
        SET difficulty = ${adjustment.newDifficulty}
        WHERE company = ${adjustment.company} 
          AND position = ${adjustment.position}
          AND question_type = 'technical'
          AND difficulty = 'hard'
          AND source = 'LeetCode'
          AND question LIKE ${`%${adjustment.questionPattern}%`}
      `;
      
      console.log(`✅ 调整 ${adjustment.company} - Hard → Medium`);
      console.log(`   ${adjustment.questionPattern}`);
      console.log(`   原因: ${adjustment.reason}\n`);
      adjustedCount++;
    }
    
    console.log(`🎉 成功调整 ${adjustedCount} 道题目为Medium难度！\n`);
    
    // 验证调整结果
    const difficultyStats = await sql`
      SELECT 
        difficulty,
        COUNT(*) as count 
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical'
      GROUP BY difficulty 
      ORDER BY 
        CASE difficulty 
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `;
    
    console.log('📈 调整后的难度分布:');
    difficultyStats.forEach(stat => {
      const icon = stat.difficulty === 'hard' ? '🔥' : '⚡';
      console.log(`   ${icon} ${stat.difficulty.toUpperCase()}: ${stat.count} 道`);
    });
    
    // 显示所有LeetCode题目的当前状态
    const allQuestions = await sql`
      SELECT company, position, difficulty, LEFT(question, 60) as question_preview
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical'
      ORDER BY company, position, 
        CASE difficulty 
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `;
    
    console.log('\n📊 最终的LeetCode题目难度分布:');
    allQuestions.forEach((q, i) => {
      const difficultyIcon = q.difficulty === 'hard' ? '🔥' : '⚡';
      console.log(`${i + 1}. ${difficultyIcon} 【${q.company}】${q.position} - ${q.difficulty.toUpperCase()}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`📚 总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 调整题目过程中出现错误:', error);
  }
}

export { adjustSomeToMedium };

// 如果直接运行此脚本
if (require.main === module) {
  adjustSomeToMedium();
} 