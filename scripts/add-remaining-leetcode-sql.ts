import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 为其他公司添加LeetCode SQL题目
const additionalLeetcodeSqlQuestions = [
  {
    company: 'Amazon',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**LeetCode SQL题目练习**

🛒 **推荐系统效果分析相关题目:**

**1. [1336. Number of Transactions per Visit](https://leetcode.com/problems/number-of-transactions-per-visit/)**
- 难度: Hard
- 标签: Database, SQL
- 描述: 统计每次访问的交易数量分布

**2. [1369. Get the Second Most Recent Activity](https://leetcode.com/problems/get-the-second-most-recent-activity/)**
- 难度: Hard
- 标签: Database, SQL
- 描述: 获取每个用户的第二近期活动

**3. [1454. Active Users](https://leetcode.com/problems/active-users/)**
- 难度: Medium
- 标签: Database, SQL
- 描述: 找出连续5天或以上登录的活跃用户

**相关概念练习:**
- Conversion Rate Analysis (转化率分析)
- Funnel Analysis (漏斗分析)
- A/B Testing Analysis (A/B测试分析)`,
    recommendedAnswer: `**解题思路:**

推荐系统效果分析的关键SQL技巧:
1. **漏斗分析** - 计算各阶段转化率
2. **时间窗口** - 设定合理的转化时间范围
3. **多表关联** - LEFT JOIN处理可选事件
4. **条件聚合** - 使用SUM(CASE WHEN)计算指标

**转化率分析模板:**
\`\`\`sql
-- 推荐效果分析模板
WITH recommendation_funnel AS (
    SELECT 
        r.recommendation_id,
        r.user_id,
        r.item_id,
        r.shown_timestamp,
        -- 点击转化 (24小时内)
        CASE WHEN c.clicked_timestamp IS NOT NULL THEN 1 ELSE 0 END as clicked,
        -- 购买转化 (7天内)
        CASE WHEN o.order_timestamp IS NOT NULL THEN 1 ELSE 0 END as converted
    FROM recommendations r
    LEFT JOIN clicks c ON r.recommendation_id = c.recommendation_id
        AND c.clicked_timestamp BETWEEN r.shown_timestamp 
        AND r.shown_timestamp + INTERVAL 1 DAY
    LEFT JOIN orders o ON r.user_id = o.user_id AND r.item_id = o.item_id
        AND o.order_timestamp BETWEEN r.shown_timestamp 
        AND r.shown_timestamp + INTERVAL 7 DAY
)
SELECT 
    COUNT(*) as total_recommendations,
    SUM(clicked) as total_clicks,
    SUM(converted) as total_conversions,
    ROUND(SUM(clicked) * 100.0 / COUNT(*), 2) as click_rate,
    ROUND(SUM(converted) * 100.0 / COUNT(*), 2) as conversion_rate
FROM recommendation_funnel;
\`\`\`

**重点练习:**
- **时间范围JOIN**: 处理时间窗口内的事件关联
- **条件聚合**: SUM(CASE WHEN)计算业务指标
- **转化漏斗**: 多步骤转化分析`,
    tags: 'SQL,LeetCode,推荐系统,转化分析',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  },
  {
    company: 'TikTok',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'hard',
    question: `**LeetCode SQL题目练习**

📱 **病毒传播分析相关题目:**

**1. [1613. Find the Missing IDs](https://leetcode.com/problems/find-the-missing-ids/)**
- 难度: Medium
- 标签: Database, SQL
- 描述: 找出缺失的连续ID

**2. [1699. Number of Calls Between Two Persons](https://leetcode.com/problems/number-of-calls-between-two-persons/)**
- 难度: Medium
- 标签: Database, SQL
- 描述: 统计两人之间的通话次数和总时长

**3. [1972. First and Last Call On the Same Day](https://leetcode.com/problems/first-and-last-call-on-the-same-day/)**
- 难度: Hard
- 标签: Database, SQL
- 描述: 找出同一天第一通和最后一通电话是同一个人的用户

**递归查询练习:**
- **WITH RECURSIVE** 语法
- **Tree/Graph Traversal** (树/图遍历)
- **Social Network Analysis** (社交网络分析)`,
    recommendedAnswer: `**解题思路:**

病毒传播分析的SQL核心技术:
1. **递归查询** - 使用WITH RECURSIVE追踪传播链
2. **图遍历** - 在SQL中实现图算法
3. **层级分析** - 分析传播的层次结构
4. **网络指标** - 计算传播深度、广度等指标

**递归查询模板:**
\`\`\`sql
-- 病毒传播链分析
WITH RECURSIVE viral_spread AS (
    -- 基础情况: 原始分享
    SELECT 
        share_id,
        video_id,
        user_id,
        shared_timestamp,
        0 as level,
        CAST(user_id AS VARCHAR(1000)) as path
    FROM shares 
    WHERE parent_share_id IS NULL
    
    UNION ALL
    
    -- 递归情况: 从分享中再分享
    SELECT 
        s.share_id,
        s.video_id,
        s.user_id,
        s.shared_timestamp,
        vs.level + 1,
        vs.path || '->' || CAST(s.user_id AS VARCHAR)
    FROM shares s
    JOIN viral_spread vs ON s.parent_share_id = vs.share_id
    WHERE vs.level < 10  -- 防止无限递归
)
SELECT 
    video_id,
    MAX(level) as max_depth,
    COUNT(*) as total_shares,
    COUNT(DISTINCT user_id) as unique_sharers
FROM viral_spread
GROUP BY video_id
ORDER BY max_depth DESC, total_shares DESC;
\`\`\`

**关键技术点:**
- **递归CTE**: WITH RECURSIVE实现图遍历
- **路径追踪**: 记录完整的传播路径
- **层级控制**: 限制递归深度避免死循环`,
    tags: 'SQL,LeetCode,递归查询,病毒传播',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**LeetCode SQL题目练习**

💼 **推荐精准度分析相关题目:**

**1. [1407. Top Travellers](https://leetcode.com/problems/top-travellers/)**
- 难度: Easy
- 标签: Database, SQL
- 描述: 找出旅行距离最远的用户

**2. [1445. Apples & Oranges](https://leetcode.com/problems/apples-oranges/)**
- 难度: Medium
- 标签: Database, SQL
- 描述: 比较苹果和橙子的销售差异

**3. [1468. Calculate Salaries](https://leetcode.com/problems/calculate-salaries/)**
- 难度: Medium
- 标签: Database, SQL
- 描述: 根据公司税率计算员工税后工资

**相关概念练习:**
- **Matching Algorithm** (匹配算法)
- **Precision & Recall** (精确率与召回率)
- **Multi-table Joins** (多表连接)`,
    recommendedAnswer: `**解题思路:**

推荐精准度分析的SQL实现要点:
1. **多维匹配** - 考虑技能、经验、地点等多个维度
2. **评分计算** - 设计合理的匹配评分算法
3. **效果评估** - 统计点击率、申请率等指标
4. **分层分析** - 按匹配度分层分析效果

**匹配度分析模板:**
\`\`\`sql
-- 推荐精准度分析
WITH skill_matching AS (
    SELECT 
        r.recommendation_id,
        r.user_id,
        r.job_id,
        COUNT(jr.skill_name) as required_skills,
        COUNT(us.skill_name) as matched_skills,
        -- 基础匹配率
        ROUND(COUNT(us.skill_name) * 100.0 / COUNT(jr.skill_name), 2) as match_rate
    FROM recommendations r
    LEFT JOIN job_requirements jr ON r.job_id = jr.job_id
    LEFT JOIN user_skills us ON r.user_id = us.user_id 
        AND jr.skill_name = us.skill_name
    GROUP BY r.recommendation_id, r.user_id, r.job_id
)
SELECT 
    CASE 
        WHEN match_rate >= 80 THEN 'High_Match'
        WHEN match_rate >= 50 THEN 'Medium_Match'
        ELSE 'Low_Match'
    END as match_category,
    COUNT(*) as total_recommendations,
    ROUND(AVG(match_rate), 2) as avg_match_rate
FROM skill_matching
GROUP BY 
    CASE 
        WHEN match_rate >= 80 THEN 'High_Match'
        WHEN match_rate >= 50 THEN 'Medium_Match'
        ELSE 'Low_Match'
    END;
\`\`\`

**核心技巧:**
- **多表JOIN**: 关联用户技能、职位要求、行为数据
- **匹配度计算**: 设计合理的相似度算法
- **分桶分析**: 按匹配度区间分析效果`,
    tags: 'SQL,LeetCode,推荐算法,精准度分析',
    source: 'LeetCode',
    year: 2024,
    isVerified: true
  }
];

async function addRemainingLeetcodeSql() {
  console.log('🔄 开始为其他公司添加LeetCode SQL题目...\n');
  
  try {
    let addedCount = 0;
    
    for (const question of additionalLeetcodeSqlQuestions) {
      // 检查是否已存在
      const existing = await sql`
        SELECT COUNT(*) as count FROM interview_questions
        WHERE company = ${question.company} 
          AND position = ${question.position}
          AND question_type = ${question.questionType}
          AND difficulty = ${question.difficulty}
          AND source = 'LeetCode'
      `;
      
      if (existing[0].count === 0) {
        // 先删除旧的非LeetCode格式题目
        await sql`
          DELETE FROM interview_questions 
          WHERE company = ${question.company} 
            AND position = ${question.position}
            AND question_type = ${question.questionType}
            AND difficulty = ${question.difficulty}
            AND source != 'LeetCode'
        `;
        
        // 插入新的LeetCode格式题目
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
        
        console.log(`✅ 添加 ${question.company} - ${question.position} 的LeetCode SQL题目`);
        addedCount++;
      } else {
        console.log(`⏭️  跳过 ${question.company} - ${question.position} (已存在LeetCode格式题目)`);
      }
    }
    
    console.log(`\n🎉 成功添加 ${addedCount} 道LeetCode SQL题目！`);
    
    // 验证结果
    const allLeetcodeSql = await sql`
      SELECT company, position, LEFT(question, 80) as question_preview, source
      FROM interview_questions 
      WHERE question_type = 'technical' 
        AND source = 'LeetCode'
      ORDER BY company, position
    `;
    
    console.log('\n📊 所有LeetCode格式的SQL题目:');
    allLeetcodeSql.forEach((q, i) => {
      console.log(`${i + 1}. 【${q.company}】${q.position} - ${q.source}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
    // 统计最终结果
    const finalStats = await sql`
      SELECT question_type, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY question_type 
      ORDER BY count DESC
    `;
    
    console.log('📈 最终数据库题目统计:');
    finalStats.forEach(stat => {
      console.log(`   ${stat.question_type}: ${stat.count} 道`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`\n📚 总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 添加过程中出现错误:', error);
  }
}

export { addRemainingLeetcodeSql };

// 如果直接运行此脚本
if (require.main === module) {
  addRemainingLeetcodeSql();
} 