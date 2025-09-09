import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 为所有公司添加完整的独立LeetCode题目
const allIndividualQuestions = [
  // Amazon 题目
  {
    company: 'Amazon',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'hard',
    question: `**[1336. Number of Transactions per Visit](https://leetcode.com/problems/number-of-transactions-per-visit/)**

🛒 **题目描述:**
统计每次访问的交易数量分布

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 转化率分析 (Conversion Rate Analysis)
- 访问行为统计 (Visit Behavior Analytics)
- 漏斗分析 (Funnel Analysis)`,
    recommendedAnswer: `**解题思路:**

这是一道复杂的电商转化分析题目：
1. **访问统计** - 统计每次访问的交易数量
2. **分布计算** - 计算不同交易数量的访问次数
3. **完整覆盖** - 确保0交易的访问也被统计

**SQL解决方案:**
\`\`\`sql
WITH visit_transactions AS (
    SELECT 
        v.user_id,
        v.visit_date,
        COALESCE(COUNT(t.transaction_date), 0) as transaction_count
    FROM Visits v
    LEFT JOIN Transactions t ON v.user_id = t.user_id 
        AND v.visit_date = t.transaction_date
    GROUP BY v.user_id, v.visit_date
),
transaction_distribution AS (
    SELECT 
        transaction_count,
        COUNT(*) as visits_count
    FROM visit_transactions
    GROUP BY transaction_count
)
SELECT 
    transaction_count,
    visits_count
FROM transaction_distribution
ORDER BY transaction_count;
\`\`\`

**关键知识点:**
- **LEFT JOIN**: 确保无交易访问也被统计
- **分层聚合**: 先按访问聚合，再按交易数分布
- **COALESCE**: 处理无交易情况
- **转化分析**: 理解访问到交易的转化模式`
  },
  {
    company: 'Amazon',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'hard',
    question: `**[1369. Get the Second Most Recent Activity](https://leetcode.com/problems/get-the-second-most-recent-activity/)**

📅 **题目描述:**
获取每个用户的第二近期活动

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 窗口函数 (Window Functions)
- 用户活动分析 (User Activity Analysis)
- 时间序列分析 (Time Series Analysis)`,
    recommendedAnswer: `**解题思路:**

这道题考查窗口函数和条件逻辑：
1. **活动排序** - 使用ROW_NUMBER按时间排序
2. **条件选择** - 根据用户活动数量选择逻辑
3. **边界处理** - 处理只有一个活动的用户

**SQL解决方案:**
\`\`\`sql
WITH ranked_activities AS (
    SELECT 
        username,
        activity,
        startDate,
        endDate,
        ROW_NUMBER() OVER (PARTITION BY username ORDER BY startDate DESC) as rn,
        COUNT(*) OVER (PARTITION BY username) as total_activities
    FROM UserActivity
)
SELECT 
    username,
    activity,
    startDate,
    endDate
FROM ranked_activities
WHERE (total_activities = 1 AND rn = 1) 
   OR (total_activities > 1 AND rn = 2);
\`\`\`

**关键知识点:**
- **ROW_NUMBER**: 为每个用户的活动排序
- **COUNT() OVER**: 计算每个用户的总活动数
- **条件逻辑**: 处理不同用户活动数量的情况
- **窗口函数**: 在分组内进行排序和计数`
  },
  {
    company: 'Amazon',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**[1454. Active Users](https://leetcode.com/problems/active-users/)**

👥 **题目描述:**
找出连续5天或以上登录的活跃用户

**标签:** Database, SQL  
**难度:** Medium

**相关概念:**
- 连续性分析 (Continuity Analysis)
- 用户留存 (User Retention)
- 活跃度指标 (Activity Metrics)`,
    recommendedAnswer: `**解题思路:**

连续登录分析的经典题目：
1. **日期分组** - 识别连续登录的日期组
2. **连续计数** - 计算每组连续天数
3. **阈值筛选** - 找出连续5天以上的用户

**SQL解决方案:**
\`\`\`sql
WITH consecutive_logins AS (
    SELECT 
        id,
        login_date,
        ROW_NUMBER() OVER (PARTITION BY id ORDER BY login_date) as rn,
        DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY id ORDER BY login_date) DAY) as group_date
    FROM Logins
),
login_groups AS (
    SELECT 
        id,
        group_date,
        COUNT(*) as consecutive_days
    FROM consecutive_logins
    GROUP BY id, group_date
    HAVING COUNT(*) >= 5
)
SELECT DISTINCT 
    l.id,
    a.name
FROM login_groups l
JOIN Accounts a ON l.id = a.id
ORDER BY l.id;
\`\`\`

**关键知识点:**
- **日期分组技巧**: 日期减去行号识别连续组
- **ROW_NUMBER**: 为连续序列编号
- **HAVING**: 在分组后进行条件筛选
- **连续性分析**: 识别时间序列中的连续模式`
  },
  // TikTok 题目
  {
    company: 'TikTok',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**[1613. Find the Missing IDs](https://leetcode.com/problems/find-the-missing-ids/)**

🔍 **题目描述:**
找出缺失的连续ID

**标签:** Database, SQL  
**难度:** Medium

**相关概念:**
- 数据完整性检查 (Data Integrity Check)
- 序列分析 (Sequence Analysis)
- 缺失数据识别 (Missing Data Detection)`,
    recommendedAnswer: `**解题思路:**

数据完整性检查的实用题目：
1. **范围确定** - 找出ID的最小值和最大值
2. **完整序列** - 生成连续的ID序列
3. **差集计算** - 找出缺失的ID

**SQL解决方案:**
\`\`\`sql
WITH RECURSIVE id_range AS (
    SELECT 
        (SELECT MIN(customer_id) FROM Customers) as id
    UNION ALL
    SELECT id + 1
    FROM id_range
    WHERE id < (SELECT MAX(customer_id) FROM Customers)
)
SELECT 
    ir.id as ids
FROM id_range ir
LEFT JOIN Customers c ON ir.id = c.customer_id
WHERE c.customer_id IS NULL
ORDER BY ir.id;
\`\`\`

**关键知识点:**
- **递归CTE**: 生成连续数字序列
- **LEFT JOIN**: 找出不存在的记录
- **范围查询**: MIN/MAX确定检查范围
- **数据质量**: 识别数据中的缺失项`
  },
  {
    company: 'TikTok',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**[1699. Number of Calls Between Two Persons](https://leetcode.com/problems/number-of-calls-between-two-persons/)**

📞 **题目描述:**
统计两人之间的通话次数和总时长

**标签:** Database, SQL  
**难度:** Medium

**相关概念:**
- 社交网络分析 (Social Network Analysis)
- 通信模式分析 (Communication Pattern Analysis)
- 双向关系统计 (Bidirectional Relationship Stats)`,
    recommendedAnswer: `**解题思路:**

双向通信关系分析：
1. **关系标准化** - 将双向通话统一为一个方向
2. **聚合统计** - 计算通话次数和总时长
3. **结果格式** - 确保较小ID在前

**SQL解决方案:**
\`\`\`sql
SELECT 
    LEAST(from_id, to_id) as person1,
    GREATEST(from_id, to_id) as person2,
    COUNT(*) as call_count,
    SUM(duration) as total_duration
FROM Calls
GROUP BY LEAST(from_id, to_id), GREATEST(from_id, to_id);
\`\`\`

**关键知识点:**
- **LEAST/GREATEST**: 标准化双向关系
- **聚合函数**: COUNT和SUM统计通话指标
- **关系对称性**: 处理双向关系的标准方法
- **社交分析**: 量化用户间的交互强度`
  },
  {
    company: 'TikTok',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'hard',
    question: `**[1972. First and Last Call On the Same Day](https://leetcode.com/problems/first-and-last-call-on-the-same-day/)**

📱 **题目描述:**
找出同一天第一通和最后一通电话是同一个人的用户

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 时间序列分析 (Time Series Analysis)
- 用户行为模式 (User Behavior Patterns)
- 首末事件分析 (First-Last Event Analysis)`,
    recommendedAnswer: `**解题思路:**

复杂的用户通话行为分析：
1. **时间排序** - 按日期和时间排序通话记录
2. **首末识别** - 找出每天的第一通和最后一通电话
3. **条件匹配** - 判断首末通话是否为同一人

**SQL解决方案:**
\`\`\`sql
WITH daily_calls AS (
    SELECT 
        user_id,
        recipient_id,
        call_time,
        DATE(call_time) as call_date,
        ROW_NUMBER() OVER (PARTITION BY user_id, DATE(call_time) ORDER BY call_time ASC) as first_call,
        ROW_NUMBER() OVER (PARTITION BY user_id, DATE(call_time) ORDER BY call_time DESC) as last_call
    FROM Calls
),
first_last_calls AS (
    SELECT 
        user_id,
        call_date,
        MAX(CASE WHEN first_call = 1 THEN recipient_id END) as first_recipient,
        MAX(CASE WHEN last_call = 1 THEN recipient_id END) as last_recipient
    FROM daily_calls
    GROUP BY user_id, call_date
)
SELECT DISTINCT user_id
FROM first_last_calls
WHERE first_recipient = last_recipient
ORDER BY user_id;
\`\`\`

**关键知识点:**
- **双重窗口函数**: 同时计算正序和逆序排名
- **条件聚合**: 使用CASE WHEN提取特定位置的值
- **行为模式**: 分析用户通信习惯的复杂逻辑
- **时间分组**: 按日期分组进行时间序列分析`
  },
  // Google 题目
  {
    company: 'Google',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**[1264. Page Recommendations](https://leetcode.com/problems/page-recommendations/)**

🔗 **题目描述:**
基于朋友关系推荐页面

**标签:** Database, SQL  
**难度:** Medium

**相关概念:**
- 推荐系统 (Recommendation System)
- 社交网络分析 (Social Network Analysis)
- 协同过滤 (Collaborative Filtering)`,
    recommendedAnswer: `**解题思路:**

社交推荐系统的基础实现：
1. **朋友识别** - 找出用户的所有朋友
2. **朋友喜好** - 收集朋友喜欢的页面
3. **去重过滤** - 排除用户已经喜欢的页面

**SQL解决方案:**
\`\`\`sql
WITH user_friends AS (
    SELECT user1_id as user_id, user2_id as friend_id
    FROM Friendship
    WHERE user1_id = 1
    UNION
    SELECT user2_id as user_id, user1_id as friend_id  
    FROM Friendship
    WHERE user2_id = 1
),
friend_likes AS (
    SELECT DISTINCT l.page_id
    FROM user_friends uf
    JOIN Likes l ON uf.friend_id = l.user_id
),
user_likes AS (
    SELECT page_id
    FROM Likes
    WHERE user_id = 1
)
SELECT fl.page_id as recommended_page
FROM friend_likes fl
LEFT JOIN user_likes ul ON fl.page_id = ul.page_id
WHERE ul.page_id IS NULL;
\`\`\`

**关键知识点:**
- **UNION**: 处理双向朋友关系
- **多层过滤**: 朋友喜好减去用户已有喜好
- **社交推荐**: 基于朋友行为的推荐逻辑
- **去重**: DISTINCT避免重复推荐`
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**[1270. All People Report to the Given Manager](https://leetcode.com/problems/all-people-report-to-the-given-manager/)**

👔 **题目描述:**
查找所有向指定经理汇报的员工

**标签:** Database, SQL  
**难度:** Medium

**相关概念:**
- 组织架构分析 (Organizational Structure Analysis)
- 层级关系查询 (Hierarchical Relationship Query)
- 管理链分析 (Management Chain Analysis)`,
    recommendedAnswer: `**解题思路:**

组织架构的层级查询：
1. **直接下属** - 找出直接向目标经理汇报的员工
2. **二级下属** - 找出向直接下属汇报的员工
3. **三级下属** - 找出向二级下属汇报的员工

**SQL解决方案:**
\`\`\`sql
SELECT 
    e1.employee_id
FROM Employees e1
JOIN Employees e2 ON e1.manager_id = e2.employee_id
JOIN Employees e3 ON e2.manager_id = e3.employee_id
WHERE e3.employee_id = 1
  AND e1.employee_id != 1;
\`\`\`

**关键知识点:**
- **多层JOIN**: 通过连续连接追踪管理层级
- **层级关系**: 理解组织中的汇报关系
- **递归思维**: 虽然这里用JOIN，但体现了递归查询思想
- **自引用表**: 员工表自身包含管理关系`
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'hard',
    question: `**[1412. Find the Quiet Students in All Exams](https://leetcode.com/problems/find-the-quiet-students-in-all-exams/)**

🎓 **题目描述:**
找出在所有考试中都不是最高分或最低分的学生

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 异常值检测 (Outlier Detection)
- 全局条件筛选 (Global Condition Filtering)
- 学生成绩分析 (Student Performance Analysis)`,
    recommendedAnswer: `**解题思路:**

复杂的成绩异常值分析：
1. **极值识别** - 找出每场考试的最高分和最低分学生
2. **全局排除** - 排除在任何考试中获得极值的学生
3. **参与验证** - 确保学生参加了所有考试

**SQL解决方案:**
\`\`\`sql
WITH exam_extremes AS (
    SELECT 
        exam_id,
        MAX(score) as max_score,
        MIN(score) as min_score
    FROM Exam
    GROUP BY exam_id
),
extreme_students AS (
    SELECT DISTINCT e.student_id
    FROM Exam e
    JOIN exam_extremes ee ON e.exam_id = ee.exam_id
    WHERE e.score = ee.max_score OR e.score = ee.min_score
),
all_exam_students AS (
    SELECT student_id
    FROM Exam
    GROUP BY student_id
    HAVING COUNT(DISTINCT exam_id) = (SELECT COUNT(DISTINCT exam_id) FROM Exam)
)
SELECT 
    aes.student_id,
    s.student_name
FROM all_exam_students aes
JOIN Student s ON aes.student_id = s.student_id
LEFT JOIN extreme_students es ON aes.student_id = es.student_id
WHERE es.student_id IS NULL
ORDER BY aes.student_id;
\`\`\`

**关键知识点:**
- **极值分析**: MAX/MIN识别每组的极端值
- **反向筛选**: 通过LEFT JOIN + IS NULL排除特定群体
- **全量验证**: HAVING确保学生参加所有考试
- **复合条件**: 多个CTE组合实现复杂逻辑`
  }
];

async function addAllIndividualLeetcode() {
  console.log('🚀 开始添加所有公司的独立LeetCode题目...\n');
  
  try {
    let addedCount = 0;
    
    for (const question of allIndividualQuestions) {
      // 检查是否已存在相同题目
      const existing = await sql`
        SELECT COUNT(*) as count FROM interview_questions
        WHERE company = ${question.company} 
          AND position = ${question.position}
          AND question_type = ${question.questionType}
          AND difficulty = ${question.difficulty}
          AND question LIKE ${`%${question.question.match(/\*\*\[(.*?)\]/)?.[1] || ''}%`}
      `;
      
      if (existing[0].count === 0) {
        await sql`
          INSERT INTO interview_questions (
            company, position, question_type, difficulty, question, 
            recommended_answer, tags, source, year, is_verified
          ) VALUES (
            ${question.company}, ${question.position}, ${question.questionType}, ${question.difficulty},
            ${question.question}, ${question.recommendedAnswer}, 
            'SQL,LeetCode,数据分析', 'LeetCode', 2024, true
          )
        `;
        
        console.log(`✅ 添加 ${question.company} - ${question.question.match(/\*\*\[(.*?)\]/)?.[1] || '题目'}`);
        addedCount++;
      } else {
        console.log(`⏭️  跳过 ${question.company} - ${question.question.match(/\*\*\[(.*?)\]/)?.[1] || '题目'} (已存在)`);
      }
    }
    
    console.log(`\n🎉 成功添加 ${addedCount} 道新的独立LeetCode题目！`);
    
    // 验证最终结果
    const allLeetcode = await sql`
      SELECT company, position, difficulty, LEFT(question, 60) as question_preview
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical'
      ORDER BY company, position, 
        CASE difficulty 
          WHEN 'easy' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `;
    
    console.log('\n📊 所有独立LeetCode题目:');
    allLeetcode.forEach((q, i) => {
      console.log(`${i + 1}. 【${q.company}】${q.position} - ${q.difficulty}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
    const finalStats = await sql`
      SELECT question_type, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY question_type 
      ORDER BY count DESC
    `;
    
    console.log('📈 最终数据库统计:');
    finalStats.forEach(stat => {
      console.log(`   ${stat.question_type}: ${stat.count} 道`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`\n📚 总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 添加题目过程中出现错误:', error);
  }
}

export { addAllIndividualLeetcode };

// 如果直接运行此脚本
if (require.main === module) {
  addAllIndividualLeetcode();
} 