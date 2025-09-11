import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// LeetCode SQL题目链接
const leetcodeSqlQuestions = [
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**LeetCode SQL题目练习**

📊 **用户留存率分析相关题目:**

**1. [1141. User Activity for the Past 30 Days I](https://leetcode.com/problems/user-activity-for-the-past-30-days-i/)**
- 难度: Easy
- 标签: Database, SQL
- 描述: 计算过去30天内每天的活跃用户数

**2. [1142. User Activity for the Past 30 Days II](https://leetcode.com/problems/user-activity-for-the-past-30-days-ii/)**
- 难度: Easy  
- 标签: Database, SQL
- 描述: 计算过去30天内平均每个用户的会话数

**3. [1158. Market Analysis I](https://leetcode.com/problems/market-analysis-i/)**
- 难度: Medium
- 标签: Database, SQL
- 描述: 分析2019年每个用户作为买家的订单数量

**相关概念练习:**
- Cohort Analysis (队列分析)
- User Retention (用户留存)
- Window Functions (窗口函数)
- Date Functions (日期函数)`,
    recommendedAnswer: `**解题思路:**

这类用户留存率分析题目的核心是:
1. **日期处理** - 使用DATE函数提取日期
2. **分组聚合** - 按时间段分组统计
3. **条件计数** - 使用CASE WHEN进行条件统计
4. **窗口函数** - 计算累计和滚动统计

**通用SQL模式:**
\`\`\`sql
-- 用户留存分析模板
WITH user_first_activity AS (
    SELECT user_id, MIN(activity_date) as first_date
    FROM user_activity 
    GROUP BY user_id
),
retention_analysis AS (
    SELECT 
        DATE_TRUNC('month', first_date) as cohort_month,
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE 
            WHEN DATEDIFF(activity_date, first_date) = 1 
            THEN user_id END) as day_1_retained
    FROM user_activity ua
    JOIN user_first_activity ufa ON ua.user_id = ufa.user_id
    GROUP BY DATE_TRUNC('month', first_date)
)
SELECT 
    cohort_month,
    total_users,
    ROUND(day_1_retained * 100.0 / total_users, 2) as retention_rate
FROM retention_analysis;
\`\`\`

**推荐练习顺序:**
1. 先做Easy题目熟悉基础概念
2. 然后挑战Medium难度的综合分析
3. 最后尝试实际的留存率计算`,
    tags: 'SQL,LeetCode,用户分析,留存率',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'hard',
    question: `**LeetCode SQL题目练习**

🔍 **异常行为检测相关题目:**

**1. [1264. Page Recommendations](https://leetcode.com/problems/page-recommendations/)**
- 难度: Medium
- 标签: Database, SQL
- 描述: 基于朋友关系推荐页面

**2. [1270. All People Report to the Given Manager](https://leetcode.com/problems/all-people-report-to-the-given-manager/)**
- 难度: Medium
- 标签: Database, SQL
- 描述: 查找所有向指定经理汇报的员工

**3. [1412. Find the Quiet Students in All Exams](https://leetcode.com/problems/find-the-quiet-students-in-all-exams/)**
- 难度: Hard
- 标签: Database, SQL  
- 描述: 找出在所有考试中都不是最高分或最低分的学生

**相关概念练习:**
- Statistical Analysis (统计分析)
- Outlier Detection (异常检测)
- Window Functions with RANK/ROW_NUMBER
- Self Joins (自连接)`,
    recommendedAnswer: `**解题思路:**

异常行为检测的SQL实现要点:
1. **统计基准** - 计算平均值、标准差等统计量
2. **异常识别** - 使用统计方法识别异常值
3. **模式分析** - 分析异常行为的特征
4. **分类标记** - 对异常类型进行分类

**核心SQL技巧:**
\`\`\`sql
-- 异常检测模板
WITH user_stats AS (
    SELECT 
        user_id,
        AVG(daily_activity) as avg_activity,
        STDDEV(daily_activity) as stddev_activity
    FROM user_daily_activity
    GROUP BY user_id
),
anomalies AS (
    SELECT 
        uda.user_id,
        uda.activity_date,
        uda.daily_activity,
        us.avg_activity,
        -- Z-score计算
        ABS(uda.daily_activity - us.avg_activity) / us.stddev_activity as z_score
    FROM user_daily_activity uda
    JOIN user_stats us ON uda.user_id = us.user_id
    WHERE ABS(uda.daily_activity - us.avg_activity) / us.stddev_activity > 2.5
)
SELECT * FROM anomalies ORDER BY z_score DESC;
\`\`\`

**关键知识点:**
- **窗口函数**: RANK(), DENSE_RANK(), ROW_NUMBER()
- **统计函数**: AVG(), STDDEV(), PERCENTILE_CONT()
- **条件逻辑**: CASE WHEN进行复杂分类
- **自连接**: 比较同一表中的不同记录`,
    tags: 'SQL,LeetCode,异常检测,统计分析',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  }
];

async function convertToLeetcodeLinks() {
  console.log('🔄 开始转换SQL题目为LeetCode链接格式...\n');
  
  try {
    // 1. 先删除重复的Google数据分析师technical题目
    console.log('🗑️ 清理重复题目...');
    
    // 查找重复题目
    const duplicates = await sql`
      SELECT company, position, question_type, difficulty, COUNT(*) as count
      FROM interview_questions 
      WHERE company = 'Google' AND position = '数据分析师' AND question_type = 'technical'
      GROUP BY company, position, question_type, difficulty
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length > 0) {
      console.log(`发现 ${duplicates.length} 组重复题目`);
      
      // 删除重复的题目，只保留一个
      for (const dup of duplicates) {
        // 先删除所有重复题目
        await sql`
          DELETE FROM interview_questions 
          WHERE company = ${dup.company} 
            AND position = ${dup.position}
            AND question_type = ${dup.question_type}
            AND difficulty = ${dup.difficulty}
        `;
      }
      console.log('✅ 重复题目清理完成');
    }
    
    // 2. 更新所有SQL题目为LeetCode链接格式
    console.log('\n📝 更新SQL题目为LeetCode链接格式...');
    
    let updatedCount = 0;
    for (const question of leetcodeSqlQuestions) {
      // 先尝试更新
      const updateResult = await sql`
        UPDATE interview_questions 
        SET 
          question = ${question.question},
          recommended_answer = ${question.recommendedAnswer},
          tags = ${question.tags},
          source = ${question.source}
        WHERE company = ${question.company} 
          AND position = ${question.position}
          AND question_type = ${question.questionType}
          AND difficulty = ${question.difficulty}
      `;
      
      // 如果没有更新到记录，就插入新记录
      const existing = await sql`
        SELECT COUNT(*) as count FROM interview_questions
        WHERE company = ${question.company} 
          AND position = ${question.position}
          AND question_type = ${question.questionType}
          AND difficulty = ${question.difficulty}
      `;
      
      if (existing[0].count === 0) {
        await sql`
          INSERT INTO interview_questions (
            company, position, question_type, difficulty, question, 
            recommended_answer, tags, source, year, is_verified
          ) VALUES (
            ${question.company}, ${question.position}, ${question.questionType}, ${question.difficulty},
            ${question.question}, ${question.recommendedAnswer}, ${question.tags}, ${question.source}, 
            ${question.year}, ${question.isVerified}
          )
        `;
      }
      
      console.log(`✅ 更新 ${question.company} - ${question.position} 的SQL题目为LeetCode格式`);
      updatedCount++;
    }
    
    console.log(`\n🎉 成功转换 ${updatedCount} 道SQL题目为LeetCode链接格式！`);
    
    // 3. 验证更新结果
    const updatedSqlQuestions = await sql`
      SELECT company, position, LEFT(question, 80) as question_preview, source
      FROM interview_questions 
      WHERE question_type = 'technical' 
        AND source = 'LeetCode'
      ORDER BY company, position
    `;
    
    console.log('\n📊 已转换为LeetCode格式的SQL题目:');
    updatedSqlQuestions.forEach((q, i) => {
      console.log(`${i + 1}. 【${q.company}】${q.position} - ${q.source}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
    // 4. 统计当前数据库状态
    const totalStats = await sql`
      SELECT question_type, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY question_type 
      ORDER BY count DESC
    `;
    
    console.log('📈 数据库题目统计:');
    totalStats.forEach(stat => {
      console.log(`   ${stat.question_type}: ${stat.count} 道`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`\n📚 总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 转换过程中出现错误:', error);
  }
}

export { convertToLeetcodeLinks };

// 如果直接运行此脚本
if (require.main === module) {
  convertToLeetcodeLinks();
} 