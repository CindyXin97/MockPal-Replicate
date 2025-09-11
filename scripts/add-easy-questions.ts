import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 添加2道Easy难度的LeetCode SQL题目
const easyQuestions = [
  {
    company: 'Amazon',
    position: '数据分析师',
    year: '2024',
    difficulty: 'easy',
    question_type: 'technical',
    source: 'LeetCode',
    question: `**[183. Customers Who Never Order](https://leetcode.com/problems/customers-who-never-order/)**

**题目描述:**
某网站包含两个表，Customers 表和 Orders 表。编写一个 SQL 查询，找出所有从不订购任何东西的客户。

**表结构:**
- **Customers 表:** Id, Name
- **Orders 表:** Id, CustomerId

**示例:**
输入: Customers 表有客户 Henry, Max, Alex
     Orders 表只有 Henry 和 Max 的订单
输出: Alex (因为 Alex 从未下过订单)`,
    answer: `**推荐解法:**

\`\`\`sql
-- 方法1: LEFT JOIN + IS NULL (推荐)
SELECT c.Name AS Customers
FROM Customers c
LEFT JOIN Orders o ON c.Id = o.CustomerId
WHERE o.CustomerId IS NULL;

-- 方法2: NOT EXISTS (子查询)
SELECT Name AS Customers
FROM Customers c
WHERE NOT EXISTS (
    SELECT 1 
    FROM Orders o 
    WHERE o.CustomerId = c.Id
);

-- 方法3: NOT IN (注意NULL值问题)
SELECT Name AS Customers
FROM Customers
WHERE Id NOT IN (
    SELECT CustomerId 
    FROM Orders 
    WHERE CustomerId IS NOT NULL
);
\`\`\`

**解题思路:**
1. **LEFT JOIN方法**: 最直观，左连接后找出右表为空的记录
2. **NOT EXISTS方法**: 子查询效率高，逻辑清晰
3. **NOT IN方法**: 需要处理NULL值，在实际面试中要注意这个陷阱

**时间复杂度:** O(n + m)，空间复杂度: O(1)
**面试要点:** 强调NULL值处理和不同方法的性能差异`
  },
  {
    company: 'TikTok',
    position: '数据分析师',
    year: '2024',
    difficulty: 'easy',
    question_type: 'technical',
    source: 'LeetCode',
    question: `**[596. Classes More Than 5 Students](https://leetcode.com/problems/classes-more-than-5-students/)**

**题目描述:**
有一个 courses 表，有: student (学生) 和 class (课程)。
请列出所有超过或等于5名学生的课程。

**表结构:**
- **courses 表:** student, class

**示例:**
输入: courses 表包含多个学生选课记录
     Math课程有6个学生，English课程有3个学生
输出: Math (因为Math课程学生数>=5)

**注意:** 学生在每门课中不应被重复计算。`,
    answer: `**推荐解法:**

\`\`\`sql
-- 方法1: GROUP BY + HAVING (标准解法)
SELECT class
FROM courses
GROUP BY class
HAVING COUNT(DISTINCT student) >= 5;

-- 方法2: 先去重再统计
SELECT class
FROM (
    SELECT DISTINCT student, class
    FROM courses
) t
GROUP BY class
HAVING COUNT(*) >= 5;
\`\`\`

**解题思路:**
1. **关键点**: 使用 \`COUNT(DISTINCT student)\` 避免重复计算同一学生
2. **GROUP BY**: 按课程分组统计学生数
3. **HAVING**: 过滤条件应该用HAVING而不是WHERE，因为是对聚合结果过滤

**常见错误:**
- 忘记使用 \`DISTINCT\`，导致同一学生被重复计算
- 使用 \`WHERE COUNT(*) >= 5\` 而不是 \`HAVING\`

**时间复杂度:** O(n log n)，空间复杂度: O(n)
**面试要点:** 强调去重的重要性和HAVING与WHERE的区别`
  }
];

async function addEasyQuestions() {
  console.log('🎯 开始添加2道Easy难度题目...\n');
  
  try {
    let addedCount = 0;
    
    for (const question of easyQuestions) {
      // 检查是否已存在相同题目
      const existing = await sql`
        SELECT id FROM interview_questions 
        WHERE company = ${question.company} 
          AND position = ${question.position}
          AND question LIKE ${`%${question.question.includes('183.') ? '183.' : '596.'}%`}
      `;
      
      if (existing.length > 0) {
        console.log(`⚠️  ${question.company} - LeetCode ${question.question.includes('183.') ? '183' : '596'} 已存在，跳过`);
        continue;
      }
      
      // 插入新题目
      await sql`
        INSERT INTO interview_questions (
          company, position, year, difficulty, question_type, source, question, recommended_answer
        ) VALUES (
          ${question.company}, ${question.position}, ${question.year},
          ${question.difficulty}, ${question.question_type}, ${question.source},
          ${question.question}, ${question.answer}
        )
      `;
      
      console.log(`✅ 添加 ${question.company} - Easy题目`);
      console.log(`   ${question.question.includes('183.') ? '183. Customers Who Never Order' : '596. Classes More Than 5 Students'}\n`);
      addedCount++;
    }
    
    console.log(`🎉 成功添加 ${addedCount} 道Easy题目！\n`);
    
    // 验证最终难度分布
    const difficultyStats = await sql`
      SELECT 
        difficulty,
        COUNT(*) as count 
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical'
      GROUP BY difficulty 
      ORDER BY 
        CASE difficulty 
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `;
    
    console.log('📈 最终的LeetCode SQL难度分布:');
    difficultyStats.forEach(stat => {
      const icon = stat.difficulty === 'easy' ? '🟢' : stat.difficulty === 'medium' ? '⚡' : '🔥';
      const percentage = Math.round((stat.count / difficultyStats.reduce((sum, s) => sum + s.count, 0)) * 100);
      console.log(`   ${icon} ${stat.difficulty.toUpperCase()}: ${stat.count} 道 (${percentage}%)`);
    });
    
    // 显示所有Easy题目
    const easyQuestionsList = await sql`
      SELECT company, LEFT(question, 50) as question_preview
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical' AND difficulty = 'easy'
      ORDER BY company
    `;
    
    if (easyQuestionsList.length > 0) {
      console.log('\n🟢 Easy题目列表:');
      easyQuestionsList.forEach((q, i) => {
        console.log(`${i + 1}. 【${q.company}】${q.question_preview}...`);
      });
    }
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`\n📚 总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 添加Easy题目过程中出现错误:', error);
  }
}

export { addEasyQuestions };

// 如果直接运行此脚本
if (require.main === module) {
  addEasyQuestions();
} 