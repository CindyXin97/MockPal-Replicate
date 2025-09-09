import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 完整的LeetCode格式题目
const allLeetcodeQuestions = [
  {
    company: 'Meta',
    position: '数据分析师',
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
3. 最后尝试实际的留存率计算`
  },
  {
    company: 'Google',
    position: '数据分析师',
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
- **自连接**: 比较同一表中的不同记录`
  },
  {
    company: 'Amazon',
    position: '数据分析师',
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
- **转化漏斗**: 多步骤转化分析`
  },
  {
    company: 'TikTok',
    position: '数据分析师',
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
- **层级控制**: 限制递归深度避免死循环`
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
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
- **分桶分析**: 按匹配度区间分析效果`
  }
];

async function forceUpdateSqlToLeetcode() {
  console.log('🚀 强制更新所有SQL题目为LeetCode格式...\n');
  
  try {
    let updatedCount = 0;
    
    for (const question of allLeetcodeQuestions) {
      // 强制更新所有包含表格的题目
      const result = await sql`
        UPDATE interview_questions 
        SET 
          question = ${question.question},
          recommended_answer = ${question.recommendedAnswer},
          tags = 'SQL,LeetCode,数据分析',
          source = 'LeetCode'
        WHERE company = ${question.company} 
          AND position = ${question.position}
          AND question_type = 'technical'
          AND (question LIKE '%Table:%' OR question LIKE '%Column Name%' OR source != 'LeetCode')
      `;
      
      console.log(`✅ 强制更新 ${question.company} - ${question.position} 的SQL题目`);
      updatedCount++;
    }
    
    console.log(`\n🎉 成功强制更新 ${updatedCount} 道SQL题目为LeetCode格式！`);
    
    // 验证所有technical题目
    const allTechnical = await sql`
      SELECT company, position, LEFT(question, 80) as question_preview, source
      FROM interview_questions 
      WHERE question_type = 'technical'
      ORDER BY company, position
    `;
    
    console.log('\n📊 所有technical题目验证:');
    allTechnical.forEach((q, i) => {
      console.log(`${i + 1}. 【${q.company}】${q.position} - ${q.source}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
  } catch (error) {
    console.error('❌ 强制更新过程中出现错误:', error);
  }
}

export { forceUpdateSqlToLeetcode };

// 如果直接运行此脚本
if (require.main === module) {
  forceUpdateSqlToLeetcode();
} 