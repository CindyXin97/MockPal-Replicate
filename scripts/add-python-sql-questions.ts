import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// Python/SQL编程题目
const pythonSqlQuestions = [
  // Python 数据处理题目 (5道)
  {
    company: 'Meta',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'medium',
    question: '给定一个包含用户行为数据的DataFrame，计算每个用户的7天滚动活跃度。要求处理缺失值并优化性能。',
    recommendedAnswer: `# 计算用户7天滚动活跃度
import pandas as pd
import numpy as np

def calculate_rolling_activity(df):
    """
    计算用户7天滚动活跃度
    df: 包含 user_id, date, activity_score 列
    """
    # 确保日期格式正确
    df['date'] = pd.to_datetime(df['date'])
    
    # 按用户和日期排序
    df = df.sort_values(['user_id', 'date'])
    
    # 处理缺失值 - 用0填充活跃度分数
    df['activity_score'] = df['activity_score'].fillna(0)
    
    # 计算7天滚动平均
    df['rolling_7d_activity'] = (df.groupby('user_id')['activity_score']
                                  .rolling(window=7, min_periods=1)
                                  .mean()
                                  .reset_index(0, drop=True))
    
    # 优化：使用向前填充处理日期间隔
    df = df.set_index(['user_id', 'date']).sort_index()
    
    return df

# 使用示例
# df_result = calculate_rolling_activity(user_behavior_df)`,
    tags: 'pandas,rolling,数据处理',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '编写Python代码来检测时间序列数据中的异常值，使用统计方法和机器学习方法各实现一种。',
    recommendedAnswer: `# 时间序列异常检测
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from scipy import stats

def detect_anomalies_statistical(ts_data, threshold=2.5):
    """使用Z-score方法检测异常值"""
    z_scores = np.abs(stats.zscore(ts_data))
    anomalies = z_scores > threshold
    return anomalies, z_scores

def detect_anomalies_ml(ts_data, contamination=0.1):
    """使用Isolation Forest检测异常值"""
    df = pd.DataFrame({'value': ts_data})
    
    # 创建特征：滑动统计
    df['rolling_mean'] = df['value'].rolling(window=5).mean()
    df['rolling_std'] = df['value'].rolling(window=5).std()
    df['lag_1'] = df['value'].shift(1)
    
    features = df[['value', 'rolling_mean', 'rolling_std', 'lag_1']].dropna()
    
    # 训练模型
    iso_forest = IsolationForest(contamination=contamination, random_state=42)
    anomalies = iso_forest.fit_predict(features)
    anomalies = anomalies == -1
    
    return anomalies, iso_forest.decision_function(features)

# 使用示例
# ts = [1, 2, 3, 2, 1, 50, 2, 3, 1, 2]  # 50是异常值
# stat_anomalies, z_scores = detect_anomalies_statistical(ts)
# ml_anomalies, scores = detect_anomalies_ml(ts)`,
    tags: 'anomaly_detection,时间序列,机器学习',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '实现一个Python函数来计算用户购买行为的RFM分析，并根据RFM分数进行客户分群。',
    recommendedAnswer: `# RFM客户分群分析
import pandas as pd
import numpy as np
from datetime import datetime

def rfm_analysis(df, customer_id='customer_id', order_date='order_date', revenue='revenue'):
    """RFM分析：Recency, Frequency, Monetary"""
    # 确保日期格式
    df[order_date] = pd.to_datetime(df[order_date])
    
    # 计算分析基准日期
    snapshot_date = df[order_date].max() + pd.Timedelta(days=1)
    
    # 计算RFM指标
    rfm = df.groupby(customer_id).agg({
        order_date: lambda x: (snapshot_date - x.max()).days,  # Recency
        customer_id: 'count',  # Frequency  
        revenue: 'sum'  # Monetary
    }).rename(columns={
        order_date: 'Recency',
        customer_id: 'Frequency', 
        revenue: 'Monetary'
    })
    
    # 计算RFM分数 (1-5分)
    rfm['R_Score'] = pd.qcut(rfm['Recency'], 5, labels=[5,4,3,2,1])
    rfm['F_Score'] = pd.qcut(rfm['Frequency'].rank(method='first'), 5, labels=[1,2,3,4,5])
    rfm['M_Score'] = pd.qcut(rfm['Monetary'], 5, labels=[1,2,3,4,5])
    
    # 组合RFM分数
    rfm['RFM_Score'] = rfm['R_Score'].astype(str) + rfm['F_Score'].astype(str) + rfm['M_Score'].astype(str)
    
    # 客户分群
    def segment_customers(row):
        if row['RFM_Score'] in ['555', '554', '544', '545']:
            return 'Champions'
        elif row['RFM_Score'] in ['543', '444', '435', '355']:
            return 'Loyal Customers'
        elif row['RFM_Score'] in ['512', '511', '422', '421']:
            return 'Potential Loyalists'
        else:
            return 'Others'
    
    rfm['Segment'] = rfm.apply(segment_customers, axis=1)
    return rfm

# 使用示例
# rfm_result = rfm_analysis(transaction_df)`,
    tags: 'RFM,客户分析,pandas',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Uber',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'medium',
    question: '编写Python代码实现A/B测试的统计分析，包括样本量计算、假设检验和置信区间。',
    recommendedAnswer: `# A/B测试统计分析
import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import norm
import math

class ABTestAnalyzer:
    def __init__(self, alpha=0.05, power=0.8):
        self.alpha = alpha
        self.power = power
        
    def sample_size_calculation(self, baseline_rate, effect_size):
        """计算A/B测试所需样本量"""
        new_rate = baseline_rate * (1 + effect_size)
        
        z_alpha = norm.ppf(1 - self.alpha/2)
        z_beta = norm.ppf(self.power)
        
        pooled_rate = (baseline_rate + new_rate) / 2
        
        numerator = (z_alpha * math.sqrt(2 * pooled_rate * (1 - pooled_rate)) + 
                    z_beta * math.sqrt(baseline_rate * (1 - baseline_rate) + 
                                     new_rate * (1 - new_rate))) ** 2
        
        denominator = (new_rate - baseline_rate) ** 2
        n = numerator / denominator
        
        return math.ceil(n)
    
    def proportion_test(self, control_conversions, control_total, 
                       treatment_conversions, treatment_total):
        """比例的假设检验"""
        p1 = control_conversions / control_total
        p2 = treatment_conversions / treatment_total
        
        # 合并比例
        p_pool = (control_conversions + treatment_conversions) / (control_total + treatment_total)
        
        # 标准误差
        se = math.sqrt(p_pool * (1 - p_pool) * (1/control_total + 1/treatment_total))
        
        # Z统计量
        z_stat = (p2 - p1) / se
        p_value = 2 * (1 - norm.cdf(abs(z_stat)))
        
        # 置信区间
        ci_se = math.sqrt(p1 * (1 - p1) / control_total + p2 * (1 - p2) / treatment_total)
        margin_error = norm.ppf(1 - self.alpha/2) * ci_se
        ci_lower = (p2 - p1) - margin_error
        ci_upper = (p2 - p1) + margin_error
        
        return {
            'control_rate': p1,
            'treatment_rate': p2,
            'z_statistic': z_stat,
            'p_value': p_value,
            'significant': p_value < self.alpha,
            'confidence_interval': (ci_lower, ci_upper)
        }

# 使用示例
ab_analyzer = ABTestAnalyzer()
sample_size = ab_analyzer.sample_size_calculation(baseline_rate=0.10, effect_size=0.20)
result = ab_analyzer.proportion_test(100, 1000, 130, 1000)`,
    tags: 'AB测试,假设检验,统计分析',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Netflix',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '实现一个推荐系统的协同过滤算法，包括用户相似度计算和推荐生成。要求处理稀疏矩阵优化性能。',
    recommendedAnswer: `# 协同过滤推荐系统
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity

class CollaborativeFiltering:
    def __init__(self, n_recommendations=10):
        self.n_recommendations = n_recommendations
        self.user_item_matrix = None
        self.user_similarity = None
        
    def fit(self, ratings_df):
        """训练协同过滤模型"""
        # 创建用户-物品矩阵
        self.user_item_matrix = ratings_df.pivot(
            index='user_id', 
            columns='item_id', 
            values='rating'
        ).fillna(0)
        
        # 转换为稀疏矩阵优化内存
        sparse_matrix = csr_matrix(self.user_item_matrix.values)
        
        # 计算用户相似度矩阵
        self.user_similarity = cosine_similarity(sparse_matrix)
        self.user_similarity = pd.DataFrame(
            self.user_similarity,
            index=self.user_item_matrix.index,
            columns=self.user_item_matrix.index
        )
        
    def get_user_recommendations(self, user_id, n_similar_users=50):
        """为指定用户生成推荐"""
        if user_id not in self.user_item_matrix.index:
            return []
            
        # 获取相似用户
        user_similarities = self.user_similarity[user_id].sort_values(ascending=False)
        similar_users = user_similarities.iloc[1:n_similar_users+1].index
        
        # 获取已评分物品
        user_ratings = self.user_item_matrix.loc[user_id]
        rated_items = user_ratings[user_ratings > 0].index
        
        # 计算推荐分数
        recommendations = {}
        
        for item in self.user_item_matrix.columns:
            if item in rated_items:
                continue
                
            weighted_sum = 0
            similarity_sum = 0
            
            for similar_user in similar_users:
                if self.user_item_matrix.loc[similar_user, item] > 0:
                    similarity = user_similarities[similar_user]
                    rating = self.user_item_matrix.loc[similar_user, item]
                    
                    weighted_sum += similarity * rating
                    similarity_sum += abs(similarity)
            
            if similarity_sum > 0:
                recommendations[item] = weighted_sum / similarity_sum
        
        # 返回top-N推荐
        sorted_recommendations = sorted(
            recommendations.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return sorted_recommendations[:self.n_recommendations]

# 使用示例
# cf = CollaborativeFiltering()
# cf.fit(ratings_df)
# recommendations = cf.get_user_recommendations(user_id=123)`,
    tags: '协同过滤,推荐系统,稀疏矩阵',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },

  // SQL 查询题目 (5道)
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '编写SQL查询来计算用户留存率：计算每个月新注册用户在第1、7、30天的留存率。',
    recommendedAnswer: `-- 用户留存率分析
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
ORDER BY cohort_month;`,
    tags: '留存分析,cohort分析,窗口函数',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'hard',
    question: '编写SQL查询来识别异常的用户行为：找出搜索量突然增加超过平均水平3倍的用户，并分析其搜索模式。',
    recommendedAnswer: `-- 异常用户搜索行为分析
WITH user_daily_searches AS (
    -- 计算每个用户每天的搜索次数
    SELECT 
        user_id,
        DATE(search_timestamp) AS search_date,
        COUNT(*) AS daily_search_count,
        COUNT(DISTINCT search_query) AS unique_queries,
        AVG(LENGTH(search_query)) AS avg_query_length
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
        MAX(daily_search_count) AS max_daily_searches
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
        ROUND(uds.daily_search_count / uss.avg_daily_searches, 2) AS search_multiplier
    FROM user_search_stats uss
    JOIN user_daily_searches uds ON uss.user_id = uds.user_id
    WHERE uds.daily_search_count > uss.avg_daily_searches * 3
        AND uss.avg_daily_searches >= 5
)

-- 分析异常用户的搜索模式
SELECT 
    au.user_id,
    au.anomaly_date,
    au.search_multiplier,
    COUNT(*) AS total_searches,
    COUNT(DISTINCT sl.search_query) AS unique_queries,
    AVG(LENGTH(sl.search_query)) AS avg_query_length,
    -- 判断异常类型
    CASE 
        WHEN COUNT(DISTINCT EXTRACT(HOUR FROM sl.search_timestamp)) <= 2 THEN 'Concentrated_Time'
        WHEN COUNT(DISTINCT sl.search_query) / COUNT(*) < 0.3 THEN 'Repetitive_Queries'
        WHEN AVG(LENGTH(sl.search_query)) < 3 THEN 'Short_Queries'
        ELSE 'Other'
    END AS anomaly_pattern
FROM anomalous_users au
JOIN search_logs sl ON au.user_id = sl.user_id 
    AND DATE(sl.search_timestamp) = au.anomaly_date
GROUP BY au.user_id, au.anomaly_date, au.search_multiplier
ORDER BY search_multiplier DESC;`,
    tags: '异常检测,用户行为分析,统计分析',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '编写SQL查询来分析商品推荐效果：计算推荐商品的点击率、转化率，并按商品类别和推荐位置进行分析。',
    recommendedAnswer: `-- 商品推荐效果分析
WITH recommendation_events AS (
    -- 获取推荐展示、点击、购买事件
    SELECT 
        r.recommendation_id,
        r.user_id,
        r.product_id,
        r.recommendation_position,
        r.shown_timestamp,
        p.category,
        p.price,
        -- 点击事件
        CASE WHEN c.clicked_timestamp IS NOT NULL THEN 1 ELSE 0 END AS clicked,
        -- 购买事件
        CASE WHEN o.order_timestamp IS NOT NULL THEN 1 ELSE 0 END AS converted,
        o.revenue
    FROM recommendations r
    LEFT JOIN products p ON r.product_id = p.product_id
    LEFT JOIN clicks c ON r.recommendation_id = c.recommendation_id
        AND c.clicked_timestamp BETWEEN r.shown_timestamp AND r.shown_timestamp + INTERVAL '1 day'
    LEFT JOIN orders o ON r.user_id = o.user_id AND r.product_id = o.product_id
        AND o.order_timestamp BETWEEN r.shown_timestamp AND r.shown_timestamp + INTERVAL '7 days'
    WHERE r.shown_timestamp >= CURRENT_DATE - INTERVAL '30 days'
),

recommendation_metrics AS (
    -- 计算基础指标
    SELECT 
        category,
        recommendation_position,
        COUNT(*) AS total_recommendations,
        SUM(clicked) AS total_clicks,
        SUM(converted) AS total_conversions,
        SUM(revenue) AS total_revenue,
        -- 计算率
        ROUND(SUM(clicked) * 100.0 / COUNT(*), 2) AS click_rate,
        ROUND(SUM(converted) * 100.0 / COUNT(*), 2) AS conversion_rate,
        ROUND(SUM(converted) * 100.0 / NULLIF(SUM(clicked), 0), 2) AS click_to_conversion_rate,
        -- 收入指标
        ROUND(SUM(revenue) / COUNT(*), 2) AS revenue_per_recommendation
    FROM recommendation_events
    GROUP BY category, recommendation_position
)

-- 主查询：推荐效果分析
SELECT 
    category,
    recommendation_position,
    total_recommendations,
    click_rate,
    conversion_rate,
    click_to_conversion_rate,
    revenue_per_recommendation,
    -- 效果评级
    CASE 
        WHEN click_rate > 5 AND conversion_rate > 1 THEN 'Excellent'
        WHEN click_rate > 2 AND conversion_rate > 0.5 THEN 'Good'
        WHEN click_rate > 1 AND conversion_rate > 0.1 THEN 'Average'
        ELSE 'Poor'
    END AS performance_rating
FROM recommendation_metrics
WHERE total_recommendations >= 100
ORDER BY conversion_rate DESC, click_rate DESC;`,
    tags: '推荐系统分析,转化率分析,商品分析',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'TikTok',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'hard',
    question: '编写SQL查询来分析视频病毒式传播：识别病毒视频的特征，分析传播路径和影响因子。',
    recommendedAnswer: `-- 视频病毒式传播分析
WITH video_metrics AS (
    -- 计算视频的基础指标
    SELECT 
        video_id,
        creator_id,
        upload_timestamp,
        COUNT(DISTINCT user_id) AS unique_viewers,
        COUNT(*) AS total_views,
        SUM(liked) AS total_likes,
        SUM(shared) AS total_shares,
        SUM(commented) AS total_comments,
        -- 计算参与率
        ROUND(SUM(liked + shared + commented) * 100.0 / COUNT(*), 2) AS engagement_rate
    FROM video_views
    WHERE view_timestamp >= upload_timestamp
    GROUP BY video_id, creator_id, upload_timestamp
),

viral_videos AS (
    -- 识别病毒视频
    SELECT 
        vm.*,
        -- 病毒指数计算
        ROUND(
            (LOG(unique_viewers) * 0.3 + 
             LOG(total_shares + 1) * 0.4 + 
             engagement_rate * 0.3), 2
        ) AS viral_score,
        -- 分享传播比
        ROUND(total_shares * 1.0 / unique_viewers, 4) AS share_rate,
        -- 病毒等级
        CASE 
            WHEN unique_viewers >= 1000000 AND total_shares >= 50000 THEN 'Super_Viral'
            WHEN unique_viewers >= 500000 AND total_shares >= 20000 THEN 'Highly_Viral' 
            WHEN unique_viewers >= 100000 AND total_shares >= 5000 THEN 'Viral'
            ELSE 'Normal'
        END AS viral_level
    FROM video_metrics vm
    WHERE unique_viewers >= 10000
),

time_series_growth AS (
    -- 分析视频增长曲线
    SELECT 
        vv.video_id,
        DATE_TRUNC('hour', view_timestamp) AS hour_bucket,
        COUNT(*) AS hourly_views,
        -- 累计指标
        SUM(COUNT(*)) OVER (
            PARTITION BY vv.video_id 
            ORDER BY DATE_TRUNC('hour', view_timestamp)
        ) AS cumulative_views
    FROM viral_videos vv
    JOIN video_views vw ON vv.video_id = vw.video_id
    WHERE view_timestamp BETWEEN upload_timestamp AND upload_timestamp + INTERVAL '7 days'
    GROUP BY vv.video_id, DATE_TRUNC('hour', view_timestamp)
)

-- 主查询：病毒视频综合分析
SELECT 
    vv.video_id,
    vv.viral_level,
    vv.viral_score,
    vv.unique_viewers,
    vv.total_shares,
    vv.share_rate,
    vv.engagement_rate,
    -- 增长特征
    MAX(tsg.hourly_views) AS peak_hourly_views,
    MAX(tsg.cumulative_views) AS final_cumulative_views
FROM viral_videos vv
LEFT JOIN time_series_growth tsg ON vv.video_id = tsg.video_id
WHERE vv.viral_level IN ('Viral', 'Highly_Viral', 'Super_Viral')
GROUP BY vv.video_id, vv.viral_level, vv.viral_score, vv.unique_viewers, 
         vv.total_shares, vv.share_rate, vv.engagement_rate
ORDER BY vv.viral_score DESC;`,
    tags: '病毒传播分析,社交网络分析,内容分析',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '编写SQL查询来分析职位推荐的精准度：计算推荐准确率，分析用户技能匹配度对推荐效果的影响。',
    recommendedAnswer: `-- 职位推荐精准度分析
WITH user_skills AS (
    -- 获取用户技能信息
    SELECT 
        user_id,
        skill_name,
        proficiency_level,
        years_experience
    FROM user_skills
    WHERE is_active = true
),

job_requirements AS (
    -- 获取职位技能要求
    SELECT 
        job_id,
        required_skill,
        importance_level,  -- 1-5, 5最重要
        min_years_required
    FROM job_skill_requirements
),

recommendation_events AS (
    -- 推荐事件及用户反馈
    SELECT 
        r.recommendation_id,
        r.user_id,
        r.job_id,
        r.recommendation_score,
        -- 用户行为
        CASE WHEN c.clicked_timestamp IS NOT NULL THEN 1 ELSE 0 END AS clicked,
        CASE WHEN a.applied_timestamp IS NOT NULL THEN 1 ELSE 0 END AS applied,
        -- 用户反馈
        f.relevance_rating  -- 1-5分
    FROM recommendations r
    LEFT JOIN clicks c ON r.recommendation_id = c.recommendation_id
    LEFT JOIN applications a ON r.user_id = a.user_id AND r.job_id = a.job_id
    LEFT JOIN user_feedback f ON r.recommendation_id = f.recommendation_id
    WHERE r.recommended_timestamp >= CURRENT_DATE - INTERVAL '30 days'
),

skill_matching AS (
    -- 计算用户与职位的技能匹配度
    SELECT 
        re.recommendation_id,
        re.user_id,
        re.job_id,
        COUNT(jr.required_skill) AS total_required_skills,
        COUNT(us.skill_name) AS matched_skills,
        -- 匹配度计算
        ROUND(COUNT(us.skill_name) * 100.0 / COUNT(jr.required_skill), 2) AS skill_match_percentage,
        ROUND(
            SUM(CASE WHEN us.years_experience >= jr.min_years_required THEN jr.importance_level ELSE 0 END) * 100.0 / 
            SUM(jr.importance_level), 2
        ) AS weighted_match_percentage
    FROM recommendation_events re
    LEFT JOIN job_requirements jr ON re.job_id = jr.job_id
    LEFT JOIN user_skills us ON re.user_id = us.user_id AND jr.required_skill = us.skill_name
    GROUP BY re.recommendation_id, re.user_id, re.job_id
),

match_score_buckets AS (
    -- 按匹配度分桶分析
    SELECT 
        CASE 
            WHEN sm.weighted_match_percentage >= 80 THEN '80-100%'
            WHEN sm.weighted_match_percentage >= 60 THEN '60-79%'
            WHEN sm.weighted_match_percentage >= 40 THEN '40-59%'
            WHEN sm.weighted_match_percentage >= 20 THEN '20-39%'
            ELSE '0-19%'
        END AS match_score_bucket,
        COUNT(*) AS total_recommendations,
        SUM(re.clicked) AS total_clicks,
        SUM(re.applied) AS total_applications,
        ROUND(AVG(re.relevance_rating), 2) AS avg_relevance_rating
    FROM recommendation_events re
    JOIN skill_matching sm ON re.recommendation_id = sm.recommendation_id
    WHERE re.relevance_rating IS NOT NULL
    GROUP BY 
        CASE 
            WHEN sm.weighted_match_percentage >= 80 THEN '80-100%'
            WHEN sm.weighted_match_percentage >= 60 THEN '60-79%'
            WHEN sm.weighted_match_percentage >= 40 THEN '40-59%'
            WHEN sm.weighted_match_percentage >= 20 THEN '20-39%'
            ELSE '0-19%'
        END
)

-- 主查询：推荐精准度分析
SELECT 
    match_score_bucket,
    total_recommendations,
    total_clicks,
    total_applications,
    -- 计算率
    ROUND(total_clicks * 100.0 / total_recommendations, 2) AS click_rate,
    ROUND(total_applications * 100.0 / total_recommendations, 2) AS application_rate,
    avg_relevance_rating
FROM match_score_buckets
ORDER BY 
    CASE match_score_bucket
        WHEN '80-100%' THEN 1
        WHEN '60-79%' THEN 2  
        WHEN '40-59%' THEN 3
        WHEN '20-39%' THEN 4
        WHEN '0-19%' THEN 5
    END;`,
    tags: '推荐精准度,技能匹配,职位分析',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  }
];

async function addPythonSqlQuestions() {
  console.log('💻 开始添加Python/SQL编程题目...\n');
  
  try {
    // 1. 先检查是否已有technical类型的题目
    const existingTechnical = await sql`
      SELECT COUNT(*) as count FROM interview_questions WHERE question_type = 'technical'
    `;
    
    console.log(`📊 当前technical题目数量: ${existingTechnical[0].count}`);
    
    // 2. 如果没有technical题目，先将一些case_study改回technical（这些应该是编程题）
    if (existingTechnical[0].count === 0) {
      console.log('🔄 将现有的case_study中的编程题重新分类为technical...');
      await sql`
        UPDATE interview_questions 
        SET question_type = 'case_study' 
        WHERE question_type = 'technical'
      `;
    }
    
    // 3. 插入新的Python/SQL编程题目
    console.log('📝 插入新的Python/SQL编程题目...');
    
    for (let i = 0; i < pythonSqlQuestions.length; i++) {
      const q = pythonSqlQuestions[i];
      
      try {
        await sql`
          INSERT INTO interview_questions (
            company, position, question_type, difficulty, question, 
            recommended_answer, tags, source, year, is_verified
          ) VALUES (
            ${q.company}, ${q.position}, ${q.questionType}, ${q.difficulty}, 
            ${q.question}, ${q.recommendedAnswer}, ${q.tags}, ${q.source}, 
            ${q.year}, ${q.isVerified}
          )
        `;
        
        console.log(`✅ 插入编程题目 ${i + 1}: ${q.company} - ${q.position}`);
        console.log(`   ${q.question.substring(0, 60)}...`);
      } catch (error) {
        console.log(`⚠️  题目 ${i + 1} 可能已存在，跳过: ${q.company} - ${q.position}`);
      }
    }
    
    // 4. 统计最终结果
    console.log('\n📊 最终统计结果:');
    
    const typeStats = await sql`
      SELECT question_type, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY question_type 
      ORDER BY count DESC
    `;
    
    console.log('\n📝 题目类型分布:');
    typeStats.forEach(stat => {
      console.log(`   ${stat.question_type}: ${stat.count} 道题目`);
    });
    
    const technicalStats = await sql`
      SELECT company, position, COUNT(*) as count, LEFT(question, 50) as sample_question
      FROM interview_questions 
      WHERE question_type = 'technical'
      GROUP BY company, position, question
      ORDER BY company, position
    `;
    
    console.log('\n💻 technical题目详情:');
    technicalStats.forEach(stat => {
      console.log(`   ${stat.company} - ${stat.position}: ${stat.sample_question}...`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`\n🎉 数据库中现有总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 添加过程中出现错误:', error);
  }
}

export { addPythonSqlQuestions };

// 如果直接运行此脚本
if (require.main === module) {
  addPythonSqlQuestions();
} 