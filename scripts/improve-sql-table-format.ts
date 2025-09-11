import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 改进的SQL题目格式
const improvedSqlQuestions = [
  {
    company: 'Meta',
    position: '数据分析师',
    questionPattern: '编写SQL查询来计算用户留存率',
    updatedQuestion: `**数据表结构:**

Table: **user_activity**
\`\`\`
+------------------+---------+---------------------------+
| Column Name      | Type    | Description               |
+------------------+---------+---------------------------+
| user_id          | int     | 用户唯一标识              |
| login_date       | date    | 登录日期                  |
| session_duration | int     | 会话时长(分钟)            |
| pages_viewed     | int     | 浏览页面数                |
| actions_count    | int     | 操作次数                  |
+------------------+---------+---------------------------+
\`\`\`

**示例数据:**
\`\`\`
user_id | login_date | session_duration | pages_viewed | actions_count
--------|------------|------------------|--------------|---------------
1001    | 2024-01-01 | 45              | 12           | 8
1001    | 2024-01-02 | 32              | 8            | 5
1001    | 2024-01-08 | 28              | 6            | 3
1002    | 2024-01-01 | 67              | 15           | 12
1002    | 2024-01-02 | 43              | 9            | 7
1003    | 2024-01-15 | 25              | 5            | 2
1003    | 2024-01-16 | 38              | 11           | 6
\`\`\`

**题目:** 编写SQL查询来计算用户留存率：计算每个月新注册用户在第1、7、30天的留存率。`,
    updatedAnswer: `**解题思路:**
1. 找出每个用户的首次登录日期作为注册日期
2. 按月份对用户进行分组(cohort分析)
3. 计算每个用户在第1、7、30天是否有活动
4. 统计各时间点的留存率

**SQL解决方案:**
\`\`\`sql
-- 用户留存率分析
WITH user_first_login AS (
    -- 获取每个用户的首次登录日期
    SELECT 
        user_id,
        DATE(MIN(login_date)) AS first_login_date,
        DATE_TRUNC('month', MIN(login_date)) AS cohort_month
    FROM user_activity
    GROUP BY user_id
),

user_activity_with_cohort AS (
    -- 将用户活动与首次登录日期关联
    SELECT 
        ua.user_id,
        ua.login_date,
        ufl.first_login_date,
        ufl.cohort_month,
        DATE_DIFF(ua.login_date, ufl.first_login_date, DAY) AS days_since_first_login
    FROM user_activity ua
    JOIN user_first_login ufl ON ua.user_id = ufl.user_id
),

retention_data AS (
    -- 计算各个时间点的留存用户
    SELECT 
        cohort_month,
        COUNT(DISTINCT user_id) AS total_users,
        COUNT(DISTINCT CASE WHEN days_since_first_login = 1 THEN user_id END) AS day_1_users,
        COUNT(DISTINCT CASE WHEN days_since_first_login = 7 THEN user_id END) AS day_7_users,
        COUNT(DISTINCT CASE WHEN days_since_first_login = 30 THEN user_id END) AS day_30_users
    FROM user_activity_with_cohort
    GROUP BY cohort_month
)

-- 计算留存率
SELECT 
    cohort_month,
    total_users,
    ROUND(day_1_users * 100.0 / total_users, 2) AS day_1_retention_rate,
    ROUND(day_7_users * 100.0 / total_users, 2) AS day_7_retention_rate,
    ROUND(day_30_users * 100.0 / total_users, 2) AS day_30_retention_rate
FROM retention_data
WHERE total_users >= 100
ORDER BY cohort_month;
\`\`\`

**关键知识点:**
- **DATE_TRUNC**: 按月分组用户
- **DATE_DIFF**: 计算日期差异  
- **条件聚合**: \`COUNT(CASE WHEN ... THEN user_id END)\`
- **Cohort分析**: 按注册时间分组的留存分析
- **窗口函数**: 用于时间序列分析`
  },
  {
    company: 'Google',
    position: '数据分析师', 
    questionPattern: '编写SQL查询来识别异常的用户行为',
    updatedQuestion: `**数据表结构:**

Table: **search_logs**
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| user_id          | int         | 用户ID                    |
| search_timestamp | timestamp   | 搜索时间戳                |
| search_query     | varchar(500)| 搜索关键词                |
| results_count    | int         | 搜索结果数量              |
| clicked_result   | boolean     | 是否点击结果              |
| session_id       | varchar(50) | 会话标识                  |
+------------------+-------------+---------------------------+
\`\`\`

**示例数据:**
\`\`\`
user_id | search_timestamp    | search_query           | results_count | clicked_result | session_id
--------|--------------------|-----------------------|---------------|----------------|------------
2001    | 2024-01-15 09:30:00| machine learning      | 1250          | true           | sess_001
2001    | 2024-01-15 09:31:00| python pandas         | 890           | true           | sess_001
2001    | 2024-01-15 14:22:00| data science jobs     | 2100          | false          | sess_002
2002    | 2024-01-15 10:15:00| weather today         | 45            | true           | sess_003
2002    | 2024-01-15 10:15:30| weather               | 52            | false          | sess_003
2003    | 2024-01-15 11:00:00| buy                   | 1000          | false          | sess_004
2003    | 2024-01-15 11:00:15| buy shoes             | 800           | false          | sess_004
2003    | 2024-01-15 11:00:30| buy online            | 950           | false          | sess_004
\`\`\`
*注：user_id=2003 为异常用户示例，短时间内大量搜索*

**题目:** 编写SQL查询来识别异常的用户行为：找出搜索量突然增加超过平均水平3倍的用户，并分析其搜索模式。`,
    updatedAnswer: `**解题思路:**
1. 计算每个用户的日均搜索次数
2. 识别单日搜索量超过个人平均值3倍的异常行为
3. 分析异常用户的搜索模式特征
4. 对异常行为进行分类

**SQL解决方案:**
\`\`\`sql
-- 异常用户搜索行为分析
WITH user_daily_searches AS (
    -- 计算每个用户每天的搜索次数
    SELECT 
        user_id,
        DATE(search_timestamp) AS search_date,
        COUNT(*) AS daily_search_count,
        COUNT(DISTINCT search_query) AS unique_queries,
        AVG(LENGTH(search_query)) AS avg_query_length,
        COUNT(DISTINCT session_id) AS sessions_count
    FROM search_logs
    WHERE search_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id, DATE(search_timestamp)
),

user_search_stats AS (
    -- 计算每个用户的搜索统计信息
    SELECT 
        user_id,
        AVG(daily_search_count) AS avg_daily_searches,
        STDDEV(daily_search_count) AS stddev_daily_searches,
        MAX(daily_search_count) AS max_daily_searches,
        COUNT(*) AS active_days
    FROM user_daily_searches
    GROUP BY user_id
    HAVING COUNT(*) >= 7  -- 至少活跃7天
),

anomalous_users AS (
    -- 识别异常用户
    SELECT 
        uss.user_id,
        uss.avg_daily_searches,
        uds.search_date AS anomaly_date,
        uds.daily_search_count AS anomaly_search_count,
        ROUND(uds.daily_search_count / uss.avg_daily_searches, 2) AS search_multiplier,
        uds.unique_queries,
        uds.avg_query_length,
        uds.sessions_count
    FROM user_search_stats uss
    JOIN user_daily_searches uds ON uss.user_id = uds.user_id
    WHERE uds.daily_search_count > uss.avg_daily_searches * 3  -- 超过平均3倍
        AND uss.avg_daily_searches >= 5  -- 过滤低频用户
)

-- 分析异常用户的搜索模式
SELECT 
    user_id,
    anomaly_date,
    search_multiplier,
    anomaly_search_count,
    unique_queries,
    ROUND(avg_query_length, 1) AS avg_query_length,
    sessions_count,
    -- 异常模式分类
    CASE 
        WHEN sessions_count <= 2 THEN 'Concentrated_Time'
        WHEN unique_queries * 1.0 / anomaly_search_count < 0.3 THEN 'Repetitive_Queries'
        WHEN avg_query_length < 3 THEN 'Short_Queries'
        ELSE 'Other_Pattern'
    END AS anomaly_pattern
FROM anomalous_users
ORDER BY search_multiplier DESC;
\`\`\`

**关键知识点:**
- **时间序列分析**: \`DATE()\` 函数提取日期
- **统计分析**: \`AVG()\`, \`STDDEV()\` 计算异常阈值
- **模式识别**: 多维度特征分析异常行为
- **条件分类**: \`CASE WHEN\` 进行模式分类
- **数据过滤**: \`HAVING\` 子句过滤样本`
  },
  {
    company: 'Amazon',
    position: '数据分析师',
    questionPattern: '编写SQL查询来分析商品推荐效果',
    updatedQuestion: `**数据表结构:**

Table: **recommendations** (推荐记录表)
\`\`\`
+------------------------+-------------+---------------------------+
| Column Name            | Type        | Description               |
+------------------------+-------------+---------------------------+
| recommendation_id      | varchar(50) | 推荐记录ID (主键)         |
| user_id                | int         | 用户ID                    |
| product_id             | int         | 商品ID                    |
| recommendation_position| int         | 推荐位置 (1-10)           |
| recommendation_algorithm| varchar(50)| 推荐算法类型              |
| shown_timestamp        | timestamp   | 推荐展示时间              |
+------------------------+-------------+---------------------------+
\`\`\`

Table: **products** (商品信息表)
\`\`\`
+--------------+-------------+---------------------------+
| Column Name  | Type        | Description               |
+--------------+-------------+---------------------------+
| product_id   | int         | 商品ID (主键)             |
| product_name | varchar(200)| 商品名称                  |
| category     | varchar(50) | 商品类别                  |
| price        | decimal(10,2)| 商品价格                 |
| brand        | varchar(50) | 品牌                      |
+--------------+-------------+---------------------------+
\`\`\`

Table: **clicks** (点击记录表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| click_id         | varchar(50) | 点击记录ID (主键)         |
| recommendation_id| varchar(50) | 推荐记录ID (外键)         |
| user_id          | int         | 用户ID                    |
| clicked_timestamp| timestamp   | 点击时间                  |
+------------------+-------------+---------------------------+
\`\`\`

Table: **orders** (订单表)
\`\`\`
+----------------+-------------+---------------------------+
| Column Name    | Type        | Description               |
+----------------+-------------+---------------------------+
| order_id       | varchar(50) | 订单ID (主键)             |
| user_id        | int         | 用户ID                    |
| product_id     | int         | 商品ID                    |
| quantity       | int         | 购买数量                  |
| revenue        | decimal(10,2)| 订单金额                 |
| order_timestamp| timestamp   | 下单时间                  |
+----------------+-------------+---------------------------+
\`\`\`

**示例数据:**
\`\`\`sql
-- products 示例数据
INSERT INTO products VALUES 
(101, 'iPhone 15', 'Electronics', 999.00, 'Apple'),
(102, 'Samsung Galaxy S24', 'Electronics', 899.00, 'Samsung'),
(201, 'Nike Air Max', 'Footwear', 120.00, 'Nike');

-- recommendations 示例数据  
INSERT INTO recommendations VALUES 
('rec_001', 3001, 101, 1, 'collaborative_filtering', '2024-01-15 10:00:00'),
('rec_002', 3001, 102, 2, 'collaborative_filtering', '2024-01-15 10:00:00'),
('rec_003', 3002, 201, 1, 'content_based', '2024-01-15 11:30:00');

-- clicks 示例数据
INSERT INTO clicks VALUES 
('click_001', 'rec_001', 3001, '2024-01-15 10:05:00'),
('click_002', 'rec_003', 3002, '2024-01-15 11:35:00');

-- orders 示例数据
INSERT INTO orders VALUES 
('order_001', 3001, 101, 1, 999.00, '2024-01-15 14:20:00'),
('order_002', 3002, 201, 2, 240.00, '2024-01-16 09:15:00');
\`\`\`

**题目:** 编写SQL查询来分析商品推荐效果：计算推荐商品的点击率、转化率，并按商品类别和推荐位置进行分析。`,
    updatedAnswer: `**解题思路:**
1. 关联推荐、点击、订单数据，构建完整的转化漏斗
2. 设置合理的时间窗口（点击24小时内，购买7天内）
3. 按商品类别和推荐位置进行分组分析
4. 计算关键指标：点击率、转化率、收入指标

**SQL解决方案:**
\`\`\`sql
-- 商品推荐效果分析
WITH recommendation_events AS (
    -- 关联推荐展示、点击、购买事件
    SELECT 
        r.recommendation_id,
        r.user_id,
        r.product_id,
        r.recommendation_position,
        r.recommendation_algorithm,
        r.shown_timestamp,
        p.category,
        p.price,
        p.brand,
        -- 点击事件 (24小时内有效)
        CASE WHEN c.clicked_timestamp IS NOT NULL THEN 1 ELSE 0 END AS clicked,
        -- 购买事件 (7天内有效)
        CASE WHEN o.order_timestamp IS NOT NULL THEN 1 ELSE 0 END AS converted,
        o.revenue
    FROM recommendations r
    LEFT JOIN products p ON r.product_id = p.product_id
    LEFT JOIN clicks c ON r.recommendation_id = c.recommendation_id
        AND c.clicked_timestamp BETWEEN r.shown_timestamp 
        AND r.shown_timestamp + INTERVAL '1 day'
    LEFT JOIN orders o ON r.user_id = o.user_id AND r.product_id = o.product_id
        AND o.order_timestamp BETWEEN r.shown_timestamp 
        AND r.shown_timestamp + INTERVAL '7 days'
    WHERE r.shown_timestamp >= CURRENT_DATE - INTERVAL '30 days'
),

recommendation_metrics AS (
    -- 计算推荐效果指标
    SELECT 
        category,
        recommendation_position,
        recommendation_algorithm,
        COUNT(*) AS total_recommendations,
        SUM(clicked) AS total_clicks,
        SUM(converted) AS total_conversions,
        SUM(revenue) AS total_revenue,
        -- 核心指标计算
        ROUND(SUM(clicked) * 100.0 / COUNT(*), 2) AS click_rate,
        ROUND(SUM(converted) * 100.0 / COUNT(*), 2) AS conversion_rate,
        ROUND(SUM(converted) * 100.0 / NULLIF(SUM(clicked), 0), 2) AS click_to_conversion_rate,
        -- 收入指标
        ROUND(SUM(revenue) / COUNT(*), 2) AS revenue_per_recommendation,
        ROUND(SUM(revenue) / NULLIF(SUM(clicked), 0), 2) AS revenue_per_click
    FROM recommendation_events
    GROUP BY category, recommendation_position, recommendation_algorithm
)

-- 主查询：推荐效果综合分析
SELECT 
    category,
    recommendation_position,
    recommendation_algorithm,
    total_recommendations,
    click_rate,
    conversion_rate,
    click_to_conversion_rate,
    revenue_per_recommendation,
    revenue_per_click,
    -- 效果评级
    CASE 
        WHEN click_rate > 5 AND conversion_rate > 1 THEN 'Excellent'
        WHEN click_rate > 2 AND conversion_rate > 0.5 THEN 'Good'
        WHEN click_rate > 1 AND conversion_rate > 0.1 THEN 'Average'
        ELSE 'Poor'
    END AS performance_rating
FROM recommendation_metrics
WHERE total_recommendations >= 50  -- 过滤样本量过小的组合
ORDER BY conversion_rate DESC, click_rate DESC;
\`\`\`

**关键知识点:**
- **多表关联**: \`LEFT JOIN\` 处理可选的点击和购买事件
- **时间窗口**: \`INTERVAL\` 设置有效的转化时间范围
- **条件聚合**: \`SUM(CASE WHEN)\` 计算转化指标
- **空值处理**: \`NULLIF()\` 避免除零错误
- **业务指标**: 点击率、转化率、ARPU等核心电商指标`
  }
];

async function improveSqlTableFormat() {
  console.log('📊 开始改进SQL题目的表格展示格式...\n');
  
  try {
    let updatedCount = 0;
    
    for (const update of improvedSqlQuestions) {
      console.log(`📝 更新 ${update.company} - ${update.position} 的SQL题目格式...`);
      
      const result = await sql`
        UPDATE interview_questions 
        SET 
          question = ${update.updatedQuestion},
          recommended_answer = ${update.updatedAnswer}
        WHERE company = ${update.company} 
          AND position = ${update.position}
          AND question_type = 'technical'
          AND question LIKE ${`%${update.questionPattern}%`}
      `;
      
      console.log(`✅ 已更新 ${update.company} - ${update.position} 的表格格式`);
      updatedCount++;
    }
    
    console.log(`\n🎉 成功改进 ${updatedCount} 道SQL题目的表格展示格式！\n`);
    
    // 验证更新结果
    const updatedQuestions = await sql`
      SELECT company, position, LEFT(question, 150) as question_preview
      FROM interview_questions 
      WHERE question_type = 'technical' 
        AND question LIKE '%Column Name%'
      ORDER BY company, position
    `;
    
    console.log('📊 已改进表格格式的SQL题目:');
    updatedQuestions.forEach((q, i) => {
      console.log(`${i + 1}. 【${q.company}】${q.position}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
  } catch (error) {
    console.error('❌ 更新过程中出现错误:', error);
  }
}

export { improveSqlTableFormat };

// 如果直接运行此脚本
if (require.main === module) {
  improveSqlTableFormat();
} 