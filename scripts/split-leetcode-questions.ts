import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 将每个LeetCode题目拆分为独立题目
const individualLeetcodeQuestions = [
  // LinkedIn 题目
  {
    company: 'LinkedIn',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'easy',
    question: `**[1407. Top Travellers](https://leetcode.com/problems/top-travellers/)**

🚗 **题目描述:**
找出旅行距离最远的用户

**标签:** Database, SQL  
**难度:** Easy

**相关概念:**
- 数据聚合 (Data Aggregation)
- 排序查询 (ORDER BY)
- 用户行为分析`,
    recommendedAnswer: `**解题思路:**

这是一道典型的聚合排序题目：
1. **数据聚合** - 按用户分组计算总距离
2. **排序** - 按距离降序排列
3. **结果展示** - 显示用户和总距离

**SQL解决方案:**
\`\`\`sql
SELECT 
    u.name,
    COALESCE(SUM(r.distance), 0) as travelled_distance
FROM Users u
LEFT JOIN Rides r ON u.id = r.user_id
GROUP BY u.id, u.name
ORDER BY travelled_distance DESC, u.name ASC;
\`\`\`

**关键知识点:**
- **LEFT JOIN**: 确保所有用户都被包含，即使没有出行记录
- **COALESCE**: 处理NULL值，将其转换为0
- **GROUP BY**: 按用户分组聚合数据
- **ORDER BY**: 多字段排序（距离降序，姓名升序）`
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**[1445. Apples & Oranges](https://leetcode.com/problems/apples-oranges/)**

🍎🍊 **题目描述:**
比较苹果和橙子的销售差异

**标签:** Database, SQL  
**难度:** Medium

**相关概念:**
- 数据透视 (Data Pivoting)
- 条件聚合 (Conditional Aggregation)
- 销售分析`,
    recommendedAnswer: `**解题思路:**

这道题考查数据透视和条件聚合：
1. **日期分组** - 按销售日期分组
2. **条件聚合** - 分别计算苹果和橙子的销量
3. **差值计算** - 计算两者销量差异

**SQL解决方案:**
\`\`\`sql
SELECT 
    sale_date,
    SUM(CASE WHEN fruit = 'apples' THEN sold_num 
             WHEN fruit = 'oranges' THEN -sold_num 
             ELSE 0 END) as diff
FROM Sales
GROUP BY sale_date
ORDER BY sale_date;
\`\`\`

**关键知识点:**
- **CASE WHEN**: 条件聚合的核心语法
- **SUM + CASE**: 在一个查询中计算多个条件的聚合
- **数据透视**: 将行数据转换为列数据的思维
- **差值计算**: 通过正负号巧妙计算差异`
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**[1468. Calculate Salaries](https://leetcode.com/problems/calculate-salaries/)**

💰 **题目描述:**
根据公司税率计算员工税后工资

**标签:** Database, SQL  
**难度:** Medium

**相关概念:**
- 多表连接 (Multi-table Joins)
- 数学计算 (Mathematical Operations)
- 薪资计算系统`,
    recommendedAnswer: `**解题思路:**

这道题涉及多表连接和数学计算：
1. **表连接** - 连接员工、公司和薪资表
2. **税率计算** - 根据公司税率计算税后工资
3. **四舍五入** - 处理计算结果的精度

**SQL解决方案:**
\`\`\`sql
SELECT 
    s.company_id,
    s.employee_id,
    s.employee_name,
    ROUND(s.salary * (1 - c.tax_rate / 100), 0) as salary
FROM Salaries s
JOIN Companies c ON s.company_id = c.company_id;
\`\`\`

**关键知识点:**
- **JOIN**: 多表数据关联
- **数学运算**: 税后工资 = 税前工资 × (1 - 税率%)
- **ROUND函数**: 控制数值精度
- **百分比处理**: 税率从百分比转换为小数`
  },
  // Meta 题目
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'easy',
    question: `**[1141. User Activity for the Past 30 Days I](https://leetcode.com/problems/user-activity-for-the-past-30-days-i/)**

📊 **题目描述:**
计算过去30天内每天的活跃用户数

**标签:** Database, SQL  
**难度:** Easy

**相关概念:**
- 用户留存分析 (User Retention)
- 日期范围查询 (Date Range Query)
- 用户活跃度统计`,
    recommendedAnswer: `**解题思路:**

这是用户活跃度分析的基础题目：
1. **日期过滤** - 筛选过去30天的数据
2. **去重统计** - 每天的唯一活跃用户数
3. **分组聚合** - 按日期分组统计

**SQL解决方案:**
\`\`\`sql
SELECT 
    activity_date as day,
    COUNT(DISTINCT user_id) as active_users
FROM Activity
WHERE activity_date BETWEEN '2019-06-28' AND '2019-07-27'
GROUP BY activity_date;
\`\`\`

**关键知识点:**
- **DATE范围查询**: BETWEEN处理日期区间
- **DISTINCT**: 去重统计唯一用户
- **GROUP BY**: 按日期分组
- **用户活跃度**: 衡量产品健康度的重要指标`
  },
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'easy',
    question: `**[1142. User Activity for the Past 30 Days II](https://leetcode.com/problems/user-activity-for-the-past-30-days-ii/)**

📈 **题目描述:**
计算过去30天内平均每个用户的会话数

**标签:** Database, SQL  
**难度:** Easy

**相关概念:**
- 用户参与度分析 (User Engagement)
- 平均值计算 (Average Calculation)
- 会话统计 (Session Analytics)`,
    recommendedAnswer: `**解题思路:**

计算用户平均会话数的进阶分析：
1. **日期过滤** - 同样筛选过去30天
2. **用户会话统计** - 计算每个用户的会话数
3. **平均值计算** - 所有用户会话数的平均值

**SQL解决方案:**
\`\`\`sql
SELECT 
    ROUND(
        COUNT(DISTINCT session_id) * 1.0 / COUNT(DISTINCT user_id), 
        2
    ) as average_sessions_per_user
FROM Activity
WHERE activity_date BETWEEN '2019-06-28' AND '2019-07-27';
\`\`\`

**关键知识点:**
- **嵌套聚合**: 在一个查询中计算多个聚合指标
- **精确除法**: 使用1.0确保浮点数除法
- **ROUND函数**: 控制结果精度
- **会话分析**: 用户参与深度的重要指标`
  },
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: `**[1158. Market Analysis I](https://leetcode.com/problems/market-analysis-i/)**

🛒 **题目描述:**
分析2019年每个用户作为买家的订单数量

**标签:** Database, SQL  
**难度:** Medium

**相关概念:**
- 电商分析 (E-commerce Analytics)
- 用户购买行为 (Purchase Behavior)
- 年度数据分析 (Annual Analysis)`,
    recommendedAnswer: `**解题思路:**

电商用户购买行为分析：
1. **用户表连接** - 确保所有用户都被包含
2. **年份过滤** - 只统计2019年的订单
3. **购买统计** - 计算每个用户的订单数量

**SQL解决方案:**
\`\`\`sql
SELECT 
    u.user_id as buyer_id,
    u.join_date,
    COALESCE(COUNT(o.order_id), 0) as orders_in_2019
FROM Users u
LEFT JOIN Orders o ON u.user_id = o.buyer_id 
    AND YEAR(o.order_date) = 2019
GROUP BY u.user_id, u.join_date;
\`\`\`

**关键知识点:**
- **LEFT JOIN**: 保留所有用户，包括无购买记录的
- **YEAR函数**: 提取日期的年份部分
- **条件连接**: 在JOIN条件中添加年份过滤
- **COALESCE**: 处理无订单用户的NULL值`
  }
];

async function splitLeetcodeQuestions() {
  console.log('🔧 开始拆分LeetCode题目为独立题目...\n');
  
  try {
    // 1. 删除所有现有的LeetCode格式题目（包含多个题目的）
    console.log('🗑️ 删除现有的LeetCode题目组...');
    
    await sql`
      DELETE FROM interview_questions 
      WHERE source = 'LeetCode' 
        AND question LIKE '%LeetCode SQL题目练习%'
        AND question_type = 'technical'
    `;
    
    console.log('✅ 现有LeetCode题目组已删除');
    
    // 2. 插入拆分后的独立题目
    console.log('\n📝 插入独立的LeetCode题目...');
    
    let insertedCount = 0;
    for (const question of individualLeetcodeQuestions) {
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
      insertedCount++;
    }
    
    console.log(`\n🎉 成功添加 ${insertedCount} 道独立的LeetCode题目！`);
    
    // 3. 验证结果
    const newQuestions = await sql`
      SELECT company, position, difficulty, LEFT(question, 80) as question_preview
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical'
      ORDER BY company, position, difficulty
    `;
    
    console.log('\n📊 新的独立LeetCode题目:');
    newQuestions.forEach((q, i) => {
      console.log(`${i + 1}. 【${q.company}】${q.position} - ${q.difficulty}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
    // 4. 最终统计
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
    console.error('❌ 拆分题目过程中出现错误:', error);
  }
}

export { splitLeetcodeQuestions };

// 如果直接运行此脚本
if (require.main === module) {
  splitLeetcodeQuestions();
} 