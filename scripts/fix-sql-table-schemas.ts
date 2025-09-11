import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// SQL题目的表结构更新
const sqlTableUpdates = [
  {
    company: 'Meta',
    position: '数据分析师',
    questionPattern: '编写SQL查询来计算用户留存率',
    updatedQuestion: `**表结构:**

\`\`\`sql
-- 用户活动表
CREATE TABLE user_activity (
    user_id INTEGER,
    login_date DATE,
    session_duration INTEGER,  -- 会话时长(分钟)
    pages_viewed INTEGER,
    actions_count INTEGER
);

-- 示例数据
INSERT INTO user_activity VALUES 
(1001, '2024-01-01', 45, 12, 8),
(1001, '2024-01-02', 32, 8, 5),
(1001, '2024-01-08', 28, 6, 3),
(1002, '2024-01-01', 67, 15, 12),
(1002, '2024-01-02', 43, 9, 7),
(1003, '2024-01-15', 25, 5, 2),
(1003, '2024-01-16', 38, 11, 6);
\`\`\`

**题目:** 编写SQL查询来计算用户留存率：计算每个月新注册用户在第1、7、30天的留存率。`,
    updatedAnswer: `**表结构说明:**
- user_activity: 记录用户每日登录和活动数据
- user_id: 用户唯一标识
- login_date: 登录日期
- session_duration: 会话时长
- pages_viewed: 浏览页面数
- actions_count: 操作次数

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

**关键技术点:**
- DATE_TRUNC: 按月分组用户
- DATE_DIFF: 计算日期差异
- 条件聚合: CASE WHEN结合COUNT
- 窗口函数应用
- 留存率计算公式`
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionPattern: '编写SQL查询来识别异常的用户行为',
    updatedQuestion: `**表结构:**

\`\`\`sql
-- 搜索日志表
CREATE TABLE search_logs (
    user_id INTEGER,
    search_timestamp TIMESTAMP,
    search_query VARCHAR(500),
    results_count INTEGER,
    clicked_result BOOLEAN,
    session_id VARCHAR(50)
);

-- 示例数据
INSERT INTO search_logs VALUES 
(2001, '2024-01-15 09:30:00', 'machine learning tutorial', 1250, true, 'sess_001'),
(2001, '2024-01-15 09:31:00', 'python pandas', 890, true, 'sess_001'),
(2001, '2024-01-15 14:22:00', 'data science jobs', 2100, false, 'sess_002'),
(2002, '2024-01-15 10:15:00', 'weather today', 45, true, 'sess_003'),
(2002, '2024-01-15 10:15:30', 'weather', 52, false, 'sess_003'),
(2002, '2024-01-15 10:16:00', 'weather forecast', 38, true, 'sess_003'),
-- 异常用户示例
(2003, '2024-01-15 11:00:00', 'buy', 1000, false, 'sess_004'),
(2003, '2024-01-15 11:00:15', 'buy shoes', 800, false, 'sess_004'),
(2003, '2024-01-15 11:00:30', 'buy online', 950, false, 'sess_004');
\`\`\`

**题目:** 编写SQL查询来识别异常的用户行为：找出搜索量突然增加超过平均水平3倍的用户，并分析其搜索模式。`,
    updatedAnswer: `**表结构说明:**
- search_logs: 用户搜索行为日志
- user_id: 用户ID
- search_timestamp: 搜索时间戳
- search_query: 搜索关键词
- results_count: 搜索结果数量
- clicked_result: 是否点击结果
- session_id: 会话标识

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
        uss.max_daily_searches,
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
),

search_pattern_analysis AS (
    -- 分析搜索模式
    SELECT 
        au.user_id,
        au.anomaly_date,
        au.search_multiplier,
        COUNT(*) AS total_searches,
        COUNT(DISTINCT sl.search_query) AS unique_queries,
        AVG(LENGTH(sl.search_query)) AS avg_query_length,
        COUNT(DISTINCT EXTRACT(HOUR FROM sl.search_timestamp)) AS active_hours,
        SUM(CASE WHEN sl.clicked_result THEN 1 ELSE 0 END) AS clicked_searches,
        -- 最频繁的搜索词
        STRING_AGG(DISTINCT sl.search_query ORDER BY sl.search_timestamp LIMIT 5) AS sample_queries
    FROM anomalous_users au
    JOIN search_logs sl ON au.user_id = sl.user_id 
        AND DATE(sl.search_timestamp) = au.anomaly_date
    GROUP BY au.user_id, au.anomaly_date, au.search_multiplier
)

-- 最终结果：异常用户及其搜索模式
SELECT 
    user_id,
    anomaly_date,
    search_multiplier,
    total_searches,
    unique_queries,
    ROUND(avg_query_length, 1) AS avg_query_length,
    active_hours,
    ROUND(clicked_searches * 100.0 / total_searches, 1) AS click_rate,
    sample_queries,
    -- 异常模式分类
    CASE 
        WHEN active_hours <= 2 THEN 'Concentrated_Time'
        WHEN unique_queries * 1.0 / total_searches < 0.3 THEN 'Repetitive_Queries'
        WHEN avg_query_length < 3 THEN 'Short_Queries'
        WHEN clicked_searches * 1.0 / total_searches < 0.1 THEN 'Low_Click_Rate'
        ELSE 'Other_Pattern'
    END AS anomaly_pattern
FROM search_pattern_analysis
ORDER BY search_multiplier DESC, total_searches DESC;
\`\`\`

**关键技术点:**
- 时间序列分析: DATE函数提取日期
- 统计分析: AVG, STDDEV计算异常阈值
- 模式识别: 多维度特征分析
- 字符串聚合: STRING_AGG收集样本
- 条件分类: CASE WHEN进行模式分类`
  },
  {
    company: 'Amazon',
    position: '数据分析师',
    questionPattern: '编写SQL查询来分析商品推荐效果',
    updatedQuestion: `**表结构:**

\`\`\`sql
-- 推荐记录表
CREATE TABLE recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    recommendation_position INTEGER,  -- 推荐位置 1-10
    recommendation_algorithm VARCHAR(50),  -- 推荐算法
    shown_timestamp TIMESTAMP
);

-- 商品信息表
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    product_name VARCHAR(200),
    category VARCHAR(50),
    price DECIMAL(10,2),
    brand VARCHAR(50)
);

-- 点击记录表
CREATE TABLE clicks (
    click_id VARCHAR(50) PRIMARY KEY,
    recommendation_id VARCHAR(50),
    user_id INTEGER,
    clicked_timestamp TIMESTAMP,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(recommendation_id)
);

-- 订单表
CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    revenue DECIMAL(10,2),
    order_timestamp TIMESTAMP
);

-- 示例数据
INSERT INTO products VALUES 
(101, 'iPhone 15', 'Electronics', 999.00, 'Apple'),
(102, 'Samsung Galaxy S24', 'Electronics', 899.00, 'Samsung'),
(201, 'Nike Air Max', 'Footwear', 120.00, 'Nike'),
(202, 'Adidas Ultraboost', 'Footwear', 180.00, 'Adidas');

INSERT INTO recommendations VALUES 
('rec_001', 3001, 101, 1, 'collaborative_filtering', '2024-01-15 10:00:00'),
('rec_002', 3001, 102, 2, 'collaborative_filtering', '2024-01-15 10:00:00'),
('rec_003', 3002, 201, 1, 'content_based', '2024-01-15 11:30:00');

INSERT INTO clicks VALUES 
('click_001', 'rec_001', 3001, '2024-01-15 10:05:00'),
('click_002', 'rec_003', 3002, '2024-01-15 11:35:00');

INSERT INTO orders VALUES 
('order_001', 3001, 101, 1, 999.00, '2024-01-15 14:20:00'),
('order_002', 3002, 201, 2, 240.00, '2024-01-16 09:15:00');
\`\`\`

**题目:** 编写SQL查询来分析商品推荐效果：计算推荐商品的点击率、转化率，并按商品类别和推荐位置进行分析。`,
    updatedAnswer: `**表结构说明:**
- recommendations: 推荐展示记录
- products: 商品基本信息
- clicks: 用户点击记录
- orders: 购买订单记录

**关键字段:**
- recommendation_position: 推荐位置(1-10)
- recommendation_algorithm: 推荐算法类型
- 时间关联: 点击需在推荐后24小时内，购买需在推荐后7天内

**SQL解决方案:**

\`\`\`sql
-- 商品推荐效果分析
WITH recommendation_events AS (
    -- 获取推荐展示、点击、购买事件
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
        -- 点击事件 (24小时内)
        c.clicked_timestamp,
        CASE WHEN c.clicked_timestamp IS NOT NULL THEN 1 ELSE 0 END AS clicked,
        -- 购买事件 (7天内)
        o.order_timestamp,
        o.quantity,
        o.revenue,
        CASE WHEN o.order_timestamp IS NOT NULL THEN 1 ELSE 0 END AS converted
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
    -- 计算基础指标
    SELECT 
        category,
        recommendation_position,
        recommendation_algorithm,
        COUNT(*) AS total_recommendations,
        SUM(clicked) AS total_clicks,
        SUM(converted) AS total_conversions,
        SUM(revenue) AS total_revenue,
        -- 计算率
        ROUND(SUM(clicked) * 100.0 / COUNT(*), 2) AS click_rate,
        ROUND(SUM(converted) * 100.0 / COUNT(*), 2) AS conversion_rate,
        ROUND(SUM(converted) * 100.0 / NULLIF(SUM(clicked), 0), 2) AS click_to_conversion_rate,
        -- 收入指标
        ROUND(SUM(revenue) / COUNT(*), 2) AS revenue_per_recommendation,
        ROUND(SUM(revenue) / NULLIF(SUM(clicked), 0), 2) AS revenue_per_click,
        -- 平均商品价格
        ROUND(AVG(price), 2) AS avg_product_price
    FROM recommendation_events
    GROUP BY category, recommendation_position, recommendation_algorithm
),

position_performance AS (
    -- 推荐位置效果分析
    SELECT 
        recommendation_position,
        COUNT(*) AS total_recommendations,
        ROUND(AVG(click_rate), 2) AS avg_click_rate,
        ROUND(AVG(conversion_rate), 2) AS avg_conversion_rate,
        SUM(total_revenue) AS total_revenue,
        -- 位置排名
        RANK() OVER (ORDER BY AVG(click_rate) DESC) AS click_rate_rank,
        RANK() OVER (ORDER BY AVG(conversion_rate) DESC) AS conversion_rate_rank
    FROM recommendation_metrics
    GROUP BY recommendation_position
),

category_performance AS (
    -- 商品类别效果分析
    SELECT 
        category,
        COUNT(*) AS total_recommendations,
        ROUND(AVG(click_rate), 2) AS avg_click_rate,
        ROUND(AVG(conversion_rate), 2) AS avg_conversion_rate,
        SUM(total_revenue) AS total_revenue,
        ROUND(AVG(avg_product_price), 2) AS avg_price,
        -- 类别表现排名
        RANK() OVER (ORDER BY AVG(conversion_rate) DESC) AS performance_rank
    FROM recommendation_metrics
    GROUP BY category
)

-- 主查询：综合推荐效果报告
SELECT 
    rm.category,
    rm.recommendation_position,
    rm.recommendation_algorithm,
    rm.total_recommendations,
    rm.click_rate,
    rm.conversion_rate,
    rm.click_to_conversion_rate,
    rm.revenue_per_recommendation,
    rm.revenue_per_click,
    rm.avg_product_price,
    -- 与平均水平对比
    ROUND(rm.click_rate - pp.avg_click_rate, 2) AS click_rate_vs_position_avg,
    ROUND(rm.conversion_rate - cp.avg_conversion_rate, 2) AS conversion_rate_vs_category_avg,
    -- 效果评级
    CASE 
        WHEN rm.click_rate > pp.avg_click_rate AND rm.conversion_rate > cp.avg_conversion_rate 
        THEN 'Excellent'
        WHEN rm.click_rate > pp.avg_click_rate OR rm.conversion_rate > cp.avg_conversion_rate 
        THEN 'Good'
        WHEN rm.click_rate > 1.0 AND rm.conversion_rate > 0.5 
        THEN 'Average'
        ELSE 'Poor'
    END AS performance_rating
FROM recommendation_metrics rm
LEFT JOIN position_performance pp ON rm.recommendation_position = pp.recommendation_position
LEFT JOIN category_performance cp ON rm.category = cp.category
WHERE rm.total_recommendations >= 50  -- 过滤样本量太小的组合
ORDER BY rm.conversion_rate DESC, rm.click_rate DESC;

-- 补充查询：算法效果对比
SELECT 
    recommendation_algorithm,
    COUNT(*) AS total_recommendations,
    ROUND(AVG(click_rate), 2) AS avg_click_rate,
    ROUND(AVG(conversion_rate), 2) AS avg_conversion_rate,
    ROUND(SUM(total_revenue), 2) AS total_revenue
FROM recommendation_metrics
GROUP BY recommendation_algorithm
ORDER BY avg_conversion_rate DESC;
\`\`\`

**关键技术点:**
- 多表关联: LEFT JOIN处理可选事件
- 时间窗口: INTERVAL控制点击和转化时间范围
- 条件聚合: SUM(CASE WHEN)计算转化
- 窗口函数: RANK()进行排名分析
- 空值处理: NULLIF避免除零错误
- 性能评级: 多条件CASE WHEN分类`
  },
  {
    company: 'TikTok',
    position: '数据分析师',
    questionPattern: '编写SQL查询来分析视频病毒式传播',
    updatedQuestion: `**表结构:**

\`\`\`sql
-- 视频基础信息表
CREATE TABLE videos (
    video_id VARCHAR(50) PRIMARY KEY,
    creator_id INTEGER,
    upload_timestamp TIMESTAMP,
    duration_seconds INTEGER,
    category VARCHAR(50),
    has_music BOOLEAN,
    hashtags_count INTEGER
);

-- 视频观看记录表
CREATE TABLE video_views (
    view_id VARCHAR(50) PRIMARY KEY,
    video_id VARCHAR(50),
    user_id INTEGER,
    view_timestamp TIMESTAMP,
    view_duration INTEGER,  -- 观看时长(秒)
    liked BOOLEAN DEFAULT FALSE,
    shared BOOLEAN DEFAULT FALSE,
    commented BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (video_id) REFERENCES videos(video_id)
);

-- 分享传播表
CREATE TABLE shares (
    share_id VARCHAR(50) PRIMARY KEY,
    video_id VARCHAR(50),
    user_id INTEGER,  -- 分享者
    shared_timestamp TIMESTAMP,
    parent_share_id VARCHAR(50),  -- 上级分享ID，用于追踪传播链
    platform VARCHAR(50),  -- 分享平台
    FOREIGN KEY (video_id) REFERENCES videos(video_id),
    FOREIGN KEY (parent_share_id) REFERENCES shares(share_id)
);

-- 创作者信息表
CREATE TABLE creators (
    creator_id INTEGER PRIMARY KEY,
    follower_count INTEGER,
    verification_status BOOLEAN,
    account_age_days INTEGER
);

-- 示例数据
INSERT INTO videos VALUES 
('vid_001', 5001, '2024-01-10 14:30:00', 15, 'Comedy', true, 5),
('vid_002', 5002, '2024-01-11 09:15:00', 30, 'Dance', true, 8),
('vid_003', 5003, '2024-01-12 16:45:00', 45, 'Educational', false, 3);

INSERT INTO creators VALUES 
(5001, 50000, true, 365),
(5002, 1200000, true, 730),
(5003, 8500, false, 120);

INSERT INTO video_views VALUES 
('view_001', 'vid_001', 6001, '2024-01-10 15:00:00', 15, true, true, false),
('view_002', 'vid_001', 6002, '2024-01-10 15:30:00', 12, true, false, true),
('view_003', 'vid_001', 6003, '2024-01-10 16:00:00', 15, false, true, false),
('view_004', 'vid_002', 6001, '2024-01-11 10:00:00', 30, true, true, false);

INSERT INTO shares VALUES 
('share_001', 'vid_001', 6001, '2024-01-10 15:05:00', NULL, 'TikTok'),
('share_002', 'vid_001', 6004, '2024-01-10 17:20:00', 'share_001', 'Instagram'),
('share_003', 'vid_001', 6005, '2024-01-10 19:15:00', 'share_002', 'Twitter');
\`\`\`

**题目:** 编写SQL查询来分析视频病毒式传播：识别病毒视频的特征，分析传播路径和影响因子。`,
    updatedAnswer: `**表结构说明:**
- videos: 视频基础信息
- video_views: 观看行为记录
- shares: 分享传播链记录
- creators: 创作者信息

**关键字段:**
- parent_share_id: 追踪分享传播链的关键字段
- view_duration vs duration_seconds: 计算完成率
- 互动指标: liked, shared, commented

**SQL解决方案:**

\`\`\`sql
-- 视频病毒式传播分析
WITH video_metrics AS (
    -- 计算视频的基础指标
    SELECT 
        v.video_id,
        v.creator_id,
        v.upload_timestamp,
        v.duration_seconds,
        v.category,
        v.has_music,
        v.hashtags_count,
        -- 观看指标
        COUNT(DISTINCT vw.user_id) AS unique_viewers,
        COUNT(vw.view_id) AS total_views,
        SUM(CASE WHEN vw.view_duration >= v.duration_seconds * 0.8 THEN 1 ELSE 0 END) AS completion_views,
        -- 互动指标
        SUM(CASE WHEN vw.liked THEN 1 ELSE 0 END) AS total_likes,
        SUM(CASE WHEN vw.shared THEN 1 ELSE 0 END) AS total_shares,
        SUM(CASE WHEN vw.commented THEN 1 ELSE 0 END) AS total_comments,
        -- 计算参与率和完成率
        ROUND(SUM(CASE WHEN vw.liked OR vw.shared OR vw.commented THEN 1 ELSE 0 END) * 100.0 / COUNT(vw.view_id), 2) AS engagement_rate,
        ROUND(SUM(CASE WHEN vw.view_duration >= v.duration_seconds * 0.8 THEN 1 ELSE 0 END) * 100.0 / COUNT(vw.view_id), 2) AS completion_rate,
        -- 平均观看时长
        ROUND(AVG(vw.view_duration), 1) AS avg_view_duration
    FROM videos v
    LEFT JOIN video_views vw ON v.video_id = vw.video_id
    WHERE v.upload_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY v.video_id, v.creator_id, v.upload_timestamp, v.duration_seconds, v.category, v.has_music, v.hashtags_count
),

viral_videos AS (
    -- 识别病毒视频（多维度筛选）
    SELECT 
        vm.*,
        -- 病毒指数计算
        ROUND(
            (LOG(GREATEST(unique_viewers, 1)) * 0.3 + 
             LOG(GREATEST(total_shares, 1)) * 0.4 + 
             engagement_rate * 0.2 + 
             completion_rate * 0.1), 2
        ) AS viral_score,
        -- 分享传播比
        ROUND(total_shares * 1.0 / GREATEST(unique_viewers, 1), 4) AS share_rate,
        -- 病毒等级
        CASE 
            WHEN unique_viewers >= 1000000 AND total_shares >= 50000 THEN 'Super_Viral'
            WHEN unique_viewers >= 500000 AND total_shares >= 20000 THEN 'Highly_Viral' 
            WHEN unique_viewers >= 100000 AND total_shares >= 5000 THEN 'Viral'
            WHEN unique_viewers >= 10000 AND total_shares >= 500 THEN 'Trending'
            ELSE 'Normal'
        END AS viral_level
    FROM video_metrics vm
    WHERE unique_viewers >= 1000  -- 基础门槛
),

sharing_cascade AS (
    -- 分析分享传播链（递归查询）
    WITH RECURSIVE share_tree AS (
        -- 初始分享（直接从原视频分享）
        SELECT 
            s.share_id,
            s.video_id,
            s.user_id AS sharer_id,
            s.shared_timestamp,
            0 AS cascade_level,
            CAST(s.user_id AS VARCHAR) AS sharing_path,
            s.platform
        FROM shares s
        JOIN viral_videos vv ON s.video_id = vv.video_id
        WHERE s.parent_share_id IS NULL
        
        UNION ALL
        
        -- 递归：从分享中再分享
        SELECT 
            s.share_id,
            s.video_id,
            s.user_id AS sharer_id,
            s.shared_timestamp,
            st.cascade_level + 1,
            st.sharing_path || '->' || CAST(s.user_id AS VARCHAR),
            s.platform
        FROM shares s
        JOIN share_tree st ON s.parent_share_id = st.share_id
        WHERE st.cascade_level < 5  -- 限制递归深度
    )
    
    SELECT 
        video_id,
        MAX(cascade_level) AS max_cascade_depth,
        COUNT(*) AS total_cascade_shares,
        COUNT(DISTINCT sharer_id) AS unique_sharers,
        COUNT(DISTINCT platform) AS platforms_used,
        -- 每层分享数量分布
        STRING_AGG(
            DISTINCT CONCAT('L', cascade_level, ':', COUNT(*) OVER (PARTITION BY video_id, cascade_level)), 
            ', ' ORDER BY cascade_level
        ) AS cascade_distribution
    FROM share_tree
    GROUP BY video_id
),

time_growth_analysis AS (
    -- 分析视频增长时间曲线
    SELECT 
        vv.video_id,
        vv.upload_timestamp,
        -- 按小时分组观看数据
        DATE_TRUNC('hour', vw.view_timestamp) AS hour_bucket,
        COUNT(*) AS hourly_views,
        SUM(CASE WHEN vw.shared THEN 1 ELSE 0 END) AS hourly_shares,
        -- 累计观看数
        SUM(COUNT(*)) OVER (
            PARTITION BY vv.video_id 
            ORDER BY DATE_TRUNC('hour', vw.view_timestamp)
        ) AS cumulative_views,
        -- 增长率
        LAG(COUNT(*)) OVER (
            PARTITION BY vv.video_id 
            ORDER BY DATE_TRUNC('hour', vw.view_timestamp)
        ) AS prev_hour_views
    FROM viral_videos vv
    JOIN video_views vw ON vv.video_id = vw.video_id
    WHERE vw.view_timestamp BETWEEN vv.upload_timestamp AND vv.upload_timestamp + INTERVAL '7 days'
    GROUP BY vv.video_id, vv.upload_timestamp, DATE_TRUNC('hour', vw.view_timestamp)
),

peak_growth_moments AS (
    -- 识别增长峰值时刻
    SELECT 
        video_id,
        hour_bucket AS peak_hour,
        hourly_views AS peak_hourly_views,
        ROUND((hourly_views - COALESCE(prev_hour_views, 0)) * 100.0 / GREATEST(COALESCE(prev_hour_views, 1), 1), 2) AS growth_rate,
        ROW_NUMBER() OVER (PARTITION BY video_id ORDER BY hourly_views DESC) AS peak_rank
    FROM time_growth_analysis
    WHERE prev_hour_views IS NOT NULL
)

-- 主查询：病毒视频综合分析
SELECT 
    vv.video_id,
    vv.viral_level,
    vv.viral_score,
    vv.category,
    vv.has_music,
    vv.hashtags_count,
    vv.duration_seconds,
    -- 观看指标
    vv.unique_viewers,
    vv.total_views,
    vv.completion_rate,
    vv.engagement_rate,
    vv.share_rate,
    -- 传播特征
    COALESCE(sc.max_cascade_depth, 0) AS max_cascade_depth,
    COALESCE(sc.total_cascade_shares, 0) AS total_cascade_shares,
    COALESCE(sc.platforms_used, 0) AS platforms_used,
    -- 增长特征
    pgm.peak_hourly_views,
    pgm.growth_rate AS max_growth_rate,
    ROUND(EXTRACT(EPOCH FROM (pgm.peak_hour - vv.upload_timestamp))/3600, 1) AS hours_to_peak,
    -- 创作者影响
    c.follower_count AS creator_followers,
    c.verification_status AS creator_verified,
    -- 病毒传播效率
    ROUND(vv.total_shares * 1.0 / GREATEST(EXTRACT(EPOCH FROM (pgm.peak_hour - vv.upload_timestamp))/3600, 1), 2) AS shares_per_hour_to_peak
FROM viral_videos vv
LEFT JOIN sharing_cascade sc ON vv.video_id = sc.video_id
LEFT JOIN peak_growth_moments pgm ON vv.video_id = pgm.video_id AND pgm.peak_rank = 1
LEFT JOIN creators c ON vv.creator_id = c.creator_id
WHERE vv.viral_level IN ('Viral', 'Highly_Viral', 'Super_Viral', 'Trending')
ORDER BY vv.viral_score DESC;

-- 病毒特征总结
SELECT 
    viral_level,
    COUNT(*) AS video_count,
    ROUND(AVG(viral_score), 2) AS avg_viral_score,
    ROUND(AVG(share_rate), 4) AS avg_share_rate,
    ROUND(AVG(engagement_rate), 2) AS avg_engagement_rate,
    ROUND(AVG(completion_rate), 2) AS avg_completion_rate,
    ROUND(AVG(max_cascade_depth), 1) AS avg_cascade_depth,
    -- 内容特征
    ROUND(AVG(CASE WHEN has_music THEN 1.0 ELSE 0.0 END) * 100, 1) AS music_percentage,
    ROUND(AVG(duration_seconds), 1) AS avg_duration,
    ROUND(AVG(hashtags_count), 1) AS avg_hashtags
FROM viral_videos vv
LEFT JOIN sharing_cascade sc ON vv.video_id = sc.video_id
WHERE vv.viral_level IN ('Viral', 'Highly_Viral', 'Super_Viral', 'Trending')
GROUP BY viral_level
ORDER BY avg_viral_score DESC;
\`\`\`

**关键技术点:**
- 递归CTE: WITH RECURSIVE追踪分享传播链
- 窗口函数: 累计计算和排名分析
- 时间序列: DATE_TRUNC按小时分组
- 病毒指数: LOG函数处理指数增长特征
- 多维分析: 结合内容、传播、时间三个维度
- 空值处理: COALESCE和GREATEST处理边界情况`
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
    questionPattern: '编写SQL查询来分析职位推荐的精准度',
    updatedQuestion: `**表结构:**

\`\`\`sql
-- 用户技能表
CREATE TABLE user_skills (
    user_id INTEGER,
    skill_name VARCHAR(100),
    proficiency_level INTEGER,  -- 1-5级
    years_experience INTEGER,
    is_certified BOOLEAN,
    is_active BOOLEAN DEFAULT TRUE
);

-- 职位技能要求表
CREATE TABLE job_skill_requirements (
    job_id INTEGER,
    required_skill VARCHAR(100),
    importance_level INTEGER,  -- 1-5, 5最重要
    min_years_required INTEGER,
    is_mandatory BOOLEAN DEFAULT FALSE
);

-- 职位信息表
CREATE TABLE jobs (
    job_id INTEGER PRIMARY KEY,
    job_title VARCHAR(200),
    company_name VARCHAR(100),
    location VARCHAR(100),
    salary_range VARCHAR(50),
    job_level VARCHAR(50)  -- Entry, Mid, Senior
);

-- 推荐记录表
CREATE TABLE recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER,
    job_id INTEGER,
    recommendation_score DECIMAL(3,2),  -- 0.00-1.00
    recommended_timestamp TIMESTAMP,
    algorithm_version VARCHAR(20)
);

-- 用户行为表
CREATE TABLE user_actions (
    action_id VARCHAR(50) PRIMARY KEY,
    recommendation_id VARCHAR(50),
    user_id INTEGER,
    job_id INTEGER,
    action_type VARCHAR(20),  -- 'click', 'apply', 'save'
    action_timestamp TIMESTAMP,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(recommendation_id)
);

-- 用户反馈表
CREATE TABLE user_feedback (
    feedback_id VARCHAR(50) PRIMARY KEY,
    recommendation_id VARCHAR(50),
    user_id INTEGER,
    relevance_rating INTEGER,  -- 1-5分
    interest_level INTEGER,    -- 1-5分
    feedback_text TEXT,
    feedback_timestamp TIMESTAMP,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(recommendation_id)
);

-- 申请结果表
CREATE TABLE application_results (
    application_id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER,
    job_id INTEGER,
    applied_timestamp TIMESTAMP,
    result_status VARCHAR(20),  -- 'pending', 'interviewed', 'hired', 'rejected'
    result_timestamp TIMESTAMP
);

-- 示例数据
INSERT INTO jobs VALUES 
(1001, 'Senior Data Scientist', 'Meta', 'San Francisco', '$150k-200k', 'Senior'),
(1002, 'Data Analyst', 'Google', 'Mountain View', '$120k-150k', 'Mid'),
(1003, 'ML Engineer', 'Amazon', 'Seattle', '$140k-180k', 'Senior');

INSERT INTO user_skills VALUES 
(7001, 'Python', 4, 5, true, true),
(7001, 'SQL', 5, 6, false, true),
(7001, 'Machine Learning', 4, 4, true, true),
(7001, 'Statistics', 3, 3, false, true),
(7002, 'Python', 3, 2, false, true),
(7002, 'SQL', 4, 3, true, true),
(7002, 'Tableau', 4, 3, true, true);

INSERT INTO job_skill_requirements VALUES 
(1001, 'Python', 5, 3, true),
(1001, 'Machine Learning', 5, 3, true),
(1001, 'Statistics', 4, 2, false),
(1001, 'Deep Learning', 3, 2, false),
(1002, 'SQL', 5, 2, true),
(1002, 'Python', 4, 1, false),
(1002, 'Tableau', 4, 2, false);

INSERT INTO recommendations VALUES 
('rec_001', 7001, 1001, 0.92, '2024-01-15 09:00:00', 'v2.1'),
('rec_002', 7001, 1002, 0.78, '2024-01-15 09:00:00', 'v2.1'),
('rec_003', 7002, 1002, 0.85, '2024-01-15 10:30:00', 'v2.1');

INSERT INTO user_actions VALUES 
('action_001', 'rec_001', 7001, 1001, 'click', '2024-01-15 09:15:00'),
('action_002', 'rec_001', 7001, 1001, 'apply', '2024-01-15 14:30:00'),
('action_003', 'rec_003', 7002, 1002, 'click', '2024-01-15 10:45:00');

INSERT INTO user_feedback VALUES 
('fb_001', 'rec_001', 7001, 5, 5, 'Perfect match for my skills', '2024-01-15 16:00:00'),
('fb_002', 'rec_002', 7001, 3, 2, 'Too junior for my experience', '2024-01-15 16:05:00');

INSERT INTO application_results VALUES 
('app_001', 7001, 1001, '2024-01-15 14:30:00', 'interviewed', '2024-01-20 10:00:00');
\`\`\`

**题目:** 编写SQL查询来分析职位推荐的精准度：计算推荐准确率，分析用户技能匹配度对推荐效果的影响。`,
    updatedAnswer: `**表结构说明:**
- user_skills: 用户技能档案
- job_skill_requirements: 职位技能要求
- recommendations: 推荐记录
- user_actions: 用户行为(点击、申请、收藏)
- user_feedback: 用户主观反馈
- application_results: 申请结果跟踪

**关键字段:**
- proficiency_level & importance_level: 技能熟练度和重要性(1-5级)
- recommendation_score: 算法推荐分数(0-1)
- is_mandatory: 是否为必需技能

**SQL解决方案:**

\`\`\`sql
-- 职位推荐精准度分析
WITH user_skill_profile AS (
    -- 用户技能档案
    SELECT 
        user_id,
        skill_name,
        proficiency_level,
        years_experience,
        is_certified,
        -- 技能综合评分
        ROUND(
            proficiency_level * 0.4 + 
            LEAST(years_experience, 10) * 0.4 + 
            CASE WHEN is_certified THEN 2 ELSE 0 END, 2
        ) AS skill_composite_score
    FROM user_skills
    WHERE is_active = true
),

job_requirement_profile AS (
    -- 职位要求档案
    SELECT 
        job_id,
        required_skill,
        importance_level,
        min_years_required,
        is_mandatory,
        -- 要求权重分数
        importance_level * CASE WHEN is_mandatory THEN 2 ELSE 1 END AS requirement_weight
    FROM job_skill_requirements
),

recommendation_events AS (
    -- 推荐事件及用户反馈
    SELECT 
        r.recommendation_id,
        r.user_id,
        r.job_id,
        r.recommendation_score,
        r.recommended_timestamp,
        r.algorithm_version,
        j.job_title,
        j.company_name,
        j.job_level,
        -- 用户行为汇总
        MAX(CASE WHEN ua.action_type = 'click' THEN 1 ELSE 0 END) AS clicked,
        MAX(CASE WHEN ua.action_type = 'apply' THEN 1 ELSE 0 END) AS applied,
        MAX(CASE WHEN ua.action_type = 'save' THEN 1 ELSE 0 END) AS saved,
        -- 用户反馈
        uf.relevance_rating,
        uf.interest_level,
        -- 申请结果
        ar.result_status,
        CASE WHEN ar.result_status IN ('interviewed', 'hired') THEN 1 ELSE 0 END AS positive_outcome
    FROM recommendations r
    LEFT JOIN jobs j ON r.job_id = j.job_id
    LEFT JOIN user_actions ua ON r.recommendation_id = ua.recommendation_id
    LEFT JOIN user_feedback uf ON r.recommendation_id = uf.recommendation_id
    LEFT JOIN application_results ar ON r.user_id = ar.user_id AND r.job_id = ar.job_id
        AND ar.applied_timestamp BETWEEN r.recommended_timestamp AND r.recommended_timestamp + INTERVAL '30 days'
    WHERE r.recommended_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY r.recommendation_id, r.user_id, r.job_id, r.recommendation_score, 
             r.recommended_timestamp, r.algorithm_version, j.job_title, j.company_name, 
             j.job_level, uf.relevance_rating, uf.interest_level, ar.result_status
),

skill_matching_analysis AS (
    -- 技能匹配度分析
    SELECT 
        re.recommendation_id,
        re.user_id,
        re.job_id,
        -- 技能匹配统计
        COUNT(jrp.required_skill) AS total_required_skills,
        COUNT(usp.skill_name) AS matched_skills,
        COUNT(CASE WHEN jrp.is_mandatory THEN 1 END) AS mandatory_skills,
        COUNT(CASE WHEN jrp.is_mandatory AND usp.skill_name IS NOT NULL THEN 1 END) AS matched_mandatory_skills,
        -- 基础匹配率
        ROUND(COUNT(usp.skill_name) * 100.0 / GREATEST(COUNT(jrp.required_skill), 1), 2) AS basic_match_percentage,
        -- 必需技能匹配率
        ROUND(
            COUNT(CASE WHEN jrp.is_mandatory AND usp.skill_name IS NOT NULL THEN 1 END) * 100.0 / 
            GREATEST(COUNT(CASE WHEN jrp.is_mandatory THEN 1 END), 1), 2
        ) AS mandatory_match_percentage,
        -- 经验匹配度
        ROUND(
            AVG(CASE 
                WHEN usp.skill_name IS NOT NULL THEN 
                    CASE WHEN usp.years_experience >= jrp.min_years_required THEN 100 ELSE 
                         (usp.years_experience * 100.0 / jrp.min_years_required) 
                    END
                ELSE 0 
            END), 2
        ) AS experience_match_percentage,
        -- 加权匹配度（考虑技能重要性）
        ROUND(
            SUM(CASE 
                WHEN usp.skill_name IS NOT NULL THEN 
                    LEAST(usp.skill_composite_score / 10.0, 1.0) * jrp.requirement_weight
                ELSE 0 
            END) * 100.0 / GREATEST(SUM(jrp.requirement_weight), 1), 2
        ) AS weighted_match_percentage,
        -- 技能超出度（用户技能超出要求的程度）
        ROUND(
            AVG(CASE 
                WHEN usp.skill_name IS NOT NULL AND jrp.min_years_required > 0 THEN
                    GREATEST((usp.years_experience - jrp.min_years_required) * 1.0 / jrp.min_years_required, 0)
                ELSE 0
            END) * 100, 2
        ) AS skill_exceeds_percentage
    FROM recommendation_events re
    LEFT JOIN job_requirement_profile jrp ON re.job_id = jrp.job_id
    LEFT JOIN user_skill_profile usp ON re.user_id = usp.user_id AND jrp.required_skill = usp.skill_name
    GROUP BY re.recommendation_id, re.user_id, re.job_id
),

recommendation_success_metrics AS (
    -- 推荐成功度量
    SELECT 
        re.*,
        sma.total_required_skills,
        sma.matched_skills,
        sma.basic_match_percentage,
        sma.mandatory_match_percentage,
        sma.experience_match_percentage,
        sma.weighted_match_percentage,
        sma.skill_exceeds_percentage,
        -- 定义推荐成功的多个标准
        CASE 
            WHEN re.positive_outcome = 1 THEN 'Hired/Interviewed'
            WHEN re.applied = 1 THEN 'Applied'  
            WHEN re.clicked = 1 AND re.relevance_rating >= 4 THEN 'Highly_Relevant_Click'
            WHEN re.clicked = 1 AND re.relevance_rating >= 3 THEN 'Relevant_Click'
            WHEN re.clicked = 1 THEN 'Click_Only'
            WHEN re.saved = 1 THEN 'Saved_Only'
            ELSE 'No_Engagement'
        END AS outcome_category,
        -- 综合成功评分 (0-100)
        CASE 
            WHEN re.positive_outcome = 1 THEN 100
            WHEN re.applied = 1 THEN 80
            WHEN re.clicked = 1 AND re.relevance_rating >= 4 THEN 70
            WHEN re.clicked = 1 AND re.relevance_rating >= 3 THEN 50
            WHEN re.clicked = 1 THEN 30
            WHEN re.saved = 1 THEN 20
            ELSE 0
        END AS success_score
    FROM recommendation_events re
    JOIN skill_matching_analysis sma ON re.recommendation_id = sma.recommendation_id
),

match_score_analysis AS (
    -- 按匹配度分桶分析
    SELECT 
        -- 匹配度分桶
        CASE 
            WHEN weighted_match_percentage >= 90 THEN '90-100%'
            WHEN weighted_match_percentage >= 80 THEN '80-89%'
            WHEN weighted_match_percentage >= 70 THEN '70-79%'
            WHEN weighted_match_percentage >= 60 THEN '60-69%'
            WHEN weighted_match_percentage >= 50 THEN '50-59%'
            ELSE '<50%'
        END AS match_score_bucket,
        -- 必需技能匹配分桶
        CASE 
            WHEN mandatory_match_percentage = 100 THEN 'All_Mandatory'
            WHEN mandatory_match_percentage >= 80 THEN 'Most_Mandatory'
            WHEN mandatory_match_percentage >= 50 THEN 'Some_Mandatory'
            ELSE 'Few_Mandatory'
        END AS mandatory_match_bucket,
        outcome_category,
        COUNT(*) AS recommendation_count,
        ROUND(AVG(success_score), 2) AS avg_success_score,
        ROUND(AVG(relevance_rating), 2) AS avg_relevance_rating,
        ROUND(AVG(recommendation_score), 3) AS avg_algorithm_score
    FROM recommendation_success_metrics
    WHERE relevance_rating IS NOT NULL  -- 只分析有反馈的推荐
    GROUP BY 
        CASE 
            WHEN weighted_match_percentage >= 90 THEN '90-100%'
            WHEN weighted_match_percentage >= 80 THEN '80-89%'
            WHEN weighted_match_percentage >= 70 THEN '70-79%'
            WHEN weighted_match_percentage >= 60 THEN '60-69%'
            WHEN weighted_match_percentage >= 50 THEN '50-59%'
            ELSE '<50%'
        END,
        CASE 
            WHEN mandatory_match_percentage = 100 THEN 'All_Mandatory'
            WHEN mandatory_match_percentage >= 80 THEN 'Most_Mandatory'
            WHEN mandatory_match_percentage >= 50 THEN 'Some_Mandatory'
            ELSE 'Few_Mandatory'
        END,
        outcome_category
)

-- 主查询：推荐精准度综合分析
SELECT 
    match_score_bucket,
    mandatory_match_bucket,
    SUM(recommendation_count) AS total_recommendations,
    -- 各类结果的分布
    SUM(CASE WHEN outcome_category = 'Hired/Interviewed' THEN recommendation_count ELSE 0 END) AS hired_interviewed_count,
    SUM(CASE WHEN outcome_category = 'Applied' THEN recommendation_count ELSE 0 END) AS applied_count,
    SUM(CASE WHEN outcome_category LIKE '%Click%' THEN recommendation_count ELSE 0 END) AS clicked_count,
    SUM(CASE WHEN outcome_category = 'Saved_Only' THEN recommendation_count ELSE 0 END) AS saved_count,
    -- 计算成功率
    ROUND(SUM(CASE WHEN outcome_category = 'Hired/Interviewed' THEN recommendation_count ELSE 0 END) * 100.0 / SUM(recommendation_count), 2) AS hire_interview_rate,
    ROUND(SUM(CASE WHEN outcome_category IN ('Applied', 'Hired/Interviewed') THEN recommendation_count ELSE 0 END) * 100.0 / SUM(recommendation_count), 2) AS application_rate,
    ROUND(SUM(CASE WHEN outcome_category NOT IN ('No_Engagement') THEN recommendation_count ELSE 0 END) * 100.0 / SUM(recommendation_count), 2) AS engagement_rate,
    -- 平均评分
    ROUND(SUM(avg_success_score * recommendation_count) / SUM(recommendation_count), 2) AS weighted_avg_success_score,
    ROUND(SUM(avg_relevance_rating * recommendation_count) / SUM(recommendation_count), 2) AS weighted_avg_relevance,
    ROUND(SUM(avg_algorithm_score * recommendation_count) / SUM(recommendation_count), 3) AS weighted_avg_algorithm_score
FROM match_score_analysis
GROUP BY match_score_bucket, mandatory_match_bucket
ORDER BY 
    CASE match_score_bucket
        WHEN '90-100%' THEN 1
        WHEN '80-89%' THEN 2  
        WHEN '70-79%' THEN 3
        WHEN '60-69%' THEN 4
        WHEN '50-59%' THEN 5
        WHEN '<50%' THEN 6
    END,
    CASE mandatory_match_bucket
        WHEN 'All_Mandatory' THEN 1
        WHEN 'Most_Mandatory' THEN 2
        WHEN 'Some_Mandatory' THEN 3
        WHEN 'Few_Mandatory' THEN 4
    END;

-- 补充分析：技能匹配度与推荐效果的相关性
WITH correlation_data AS (
    SELECT 
        recommendation_id,
        weighted_match_percentage,
        mandatory_match_percentage,
        experience_match_percentage,
        success_score,
        relevance_rating,
        recommendation_score
    FROM recommendation_success_metrics
    WHERE relevance_rating IS NOT NULL
)

SELECT 
    'Skill_Match_Correlation' AS analysis_type,
    ROUND(CORR(weighted_match_percentage, success_score), 3) AS skill_success_correlation,
    ROUND(CORR(mandatory_match_percentage, success_score), 3) AS mandatory_success_correlation,
    ROUND(CORR(experience_match_percentage, success_score), 3) AS experience_success_correlation,
    ROUND(CORR(weighted_match_percentage, relevance_rating), 3) AS skill_relevance_correlation,
    ROUND(CORR(recommendation_score, success_score), 3) AS algorithm_success_correlation,
    COUNT(*) AS sample_size
FROM correlation_data;

-- 算法版本效果对比
SELECT 
    algorithm_version,
    COUNT(*) AS total_recommendations,
    ROUND(AVG(weighted_match_percentage), 2) AS avg_skill_match,
    ROUND(AVG(success_score), 2) AS avg_success_score,
    ROUND(AVG(relevance_rating), 2) AS avg_relevance_rating,
    ROUND(SUM(CASE WHEN applied = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS application_rate
FROM recommendation_success_metrics
WHERE relevance_rating IS NOT NULL
GROUP BY algorithm_version
ORDER BY avg_success_score DESC;
\`\`\`

**关键技术点:**
- 多维技能匹配: 基础匹配、必需技能、经验要求、加权匹配
- 成功度量: 多层次定义推荐成功(点击→申请→面试→录用)
- 相关性分析: CORR函数计算匹配度与成功率相关性
- 分桶分析: 按匹配度区间分析推荐效果
- 综合评分: 考虑技能熟练度、认证、经验的综合评分
- 时间窗口: 合理设置行为追踪时间范围(30天)`
  }
];

async function updateSqlQuestionsWithTables() {
  console.log('🔧 开始为SQL题目添加详细表结构...\n');
  
  try {
    let updatedCount = 0;
    
    for (const update of sqlTableUpdates) {
      console.log(`📝 更新 ${update.company} - ${update.position} 的SQL题目...`);
      
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
      
      console.log(`✅ 已更新 ${update.company} - ${update.position}`);
      updatedCount++;
    }
    
    console.log(`\n🎉 成功更新 ${updatedCount} 道SQL题目的表结构！\n`);
    
    // 验证更新结果
    const sqlQuestions = await sql`
      SELECT company, position, LEFT(question, 100) as question_preview
      FROM interview_questions 
      WHERE question_type = 'technical' 
        AND (question LIKE '%CREATE TABLE%' OR question LIKE '%表结构%')
      ORDER BY company, position
    `;
    
    console.log('📊 已添加表结构的SQL题目:');
    sqlQuestions.forEach((q, i) => {
      console.log(`${i + 1}. 【${q.company}】${q.position}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
  } catch (error) {
    console.error('❌ 更新过程中出现错误:', error);
  }
}

export { updateSqlQuestionsWithTables };

// 如果直接运行此脚本
if (require.main === module) {
  updateSqlQuestionsWithTables();
} 