import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function exportQuestions() {
  try {
    console.log('正在导出面试题目...');
    
    const questions = await sql`
      SELECT * FROM interview_questions 
      ORDER BY id ASC
    `;
    
    console.log(`找到 ${questions.length} 道面试题目`);
    
    // 生成插入语句
    const insertStatements = questions.map((q: any) => {
      const company = q.company.replace(/'/g, "''");
      const position = q.position.replace(/'/g, "''");
      const questionType = q.question_type.replace(/'/g, "''");
      const difficulty = q.difficulty.replace(/'/g, "''");
      const question = q.question.replace(/'/g, "''");
      const recommendedAnswer = q.recommended_answer ? q.recommended_answer.replace(/'/g, "''") : '';
      const tags = q.tags ? q.tags.replace(/'/g, "''") : '';
      const source = q.source ? q.source.replace(/'/g, "''") : '';
      
      return `  {
    company: '${company}',
    position: '${position}',
    questionType: '${questionType}',
    difficulty: '${difficulty}',
    question: '${question}',
    recommendedAnswer: '${recommendedAnswer}',
    tags: '${tags}',
    source: '${source}',
    year: ${q.year},
    isVerified: ${q.is_verified}
  }`;
    }).join(',\n');
    
    // 生成完整的种子脚本
    const seedScript = `import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

const interviewQuestions = [
${insertStatements}
];

async function seedAllQuestions() {
  try {
    console.log('开始导入面试题目...');
    
    // 清空现有数据
    await sql\`DELETE FROM interview_questions\`;
    console.log('已清空现有题目');
    
    // 批量插入新数据
    for (const question of interviewQuestions) {
      await sql\`
        INSERT INTO interview_questions (
          company, position, question_type, difficulty, question, 
          recommended_answer, tags, source, year, is_verified, created_at, updated_at
        ) VALUES (
          \${question.company}, \${question.position}, \${question.questionType}, 
          \${question.difficulty}, \${question.question}, \${question.recommendedAnswer}, 
          \${question.tags}, \${question.source}, \${question.year}, \${question.isVerified},
          NOW(), NOW()
        )
      \`;
    }
    
    console.log(\`成功导入 \${interviewQuestions.length} 道面试题目！\`);
    
    // 验证导入结果
    const count = await sql\`SELECT COUNT(*) as count FROM interview_questions\`;
    console.log(\`数据库中现有 \${count[0].count} 道题目\`);
    
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAllQuestions();
}

export { seedAllQuestions };`;
    
    // 写入文件
    require('fs').writeFileSync('scripts/seed-all-questions.ts', seedScript);
    console.log('已生成种子脚本: scripts/seed-all-questions.ts');
    
  } catch (error) {
    console.error('导出失败:', error);
    process.exit(1);
  }
}

exportQuestions(); 