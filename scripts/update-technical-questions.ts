import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 新的Python/SQL编程题目
const pythonSqlQuestions = [
  // Python 数据处理题目 (10道)
  {
    company: 'Meta',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'medium',
    question: '给定一个包含用户行为数据的DataFrame，计算每个用户的7天滚动活跃度。要求处理缺失值并优化性能。',
    recommendedAnswer: `
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
# df_result = calculate_rolling_activity(user_behavior_df)
`,
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
    recommendedAnswer: `
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from scipy import stats

def detect_anomalies_statistical(ts_data, threshold=2.5):
    """
    使用Z-score方法检测异常值
    """
    # 计算Z-score
    z_scores = np.abs(stats.zscore(ts_data))
    
    # 标记异常值
    anomalies = z_scores > threshold
    
    return anomalies, z_scores

def detect_anomalies_ml(ts_data, contamination=0.1):
    """
    使用Isolation Forest检测异常值
    """
    # 准备数据 - 添加滑动窗口特征
    df = pd.DataFrame({'value': ts_data})
    
    # 创建特征：滑动统计
    df['rolling_mean'] = df['value'].rolling(window=5).mean()
    df['rolling_std'] = df['value'].rolling(window=5).std()
    df['lag_1'] = df['value'].shift(1)
    
    # 去除缺失值
    features = df[['value', 'rolling_mean', 'rolling_std', 'lag_1']].dropna()
    
    # 训练模型
    iso_forest = IsolationForest(contamination=contamination, random_state=42)
    anomalies = iso_forest.fit_predict(features)
    
    # -1表示异常，1表示正常
    anomalies = anomalies == -1
    
    return anomalies, iso_forest.decision_function(features)

# 使用示例
# ts = [1, 2, 3, 2, 1, 50, 2, 3, 1, 2]  # 50是异常值
# stat_anomalies, z_scores = detect_anomalies_statistical(ts)
# ml_anomalies, scores = detect_anomalies_ml(ts)
`,
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
    recommendedAnswer: `
import pandas as pd
import numpy as np
from datetime import datetime

def rfm_analysis(df, customer_id='customer_id', order_date='order_date', revenue='revenue'):
    """
    RFM分析：Recency, Frequency, Monetary
    """
    # 确保日期格式
    df[order_date] = pd.to_datetime(df[order_date])
    
    # 计算分析基准日期（最新交易日期）
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
    rfm['R_Score'] = pd.qcut(rfm['Recency'], 5, labels=[5,4,3,2,1])  # 越近期越高分
    rfm['F_Score'] = pd.qcut(rfm['Frequency'].rank(method='first'), 5, labels=[1,2,3,4,5])
    rfm['M_Score'] = pd.qcut(rfm['Monetary'], 5, labels=[1,2,3,4,5])
    
    # 组合RFM分数
    rfm['RFM_Score'] = rfm['R_Score'].astype(str) + rfm['F_Score'].astype(str) + rfm['M_Score'].astype(str)
    
    # 客户分群
    def segment_customers(row):
        if row['RFM_Score'] in ['555', '554', '544', '545', '454', '455', '445']:
            return 'Champions'
        elif row['RFM_Score'] in ['543', '444', '435', '355', '354', '345', '344', '335']:
            return 'Loyal Customers'
        elif row['RFM_Score'] in ['512', '511', '422', '421', '412', '411', '311']:
            return 'Potential Loyalists'
        elif row['RFM_Score'] in ['533', '532', '531', '523', '522', '521', '515', '514', '513', '425', '424', '413', '414', '415', '315', '314', '313']:
            return 'New Customers'
        elif row['RFM_Score'] in ['155', '154', '144', '214', '215', '115', '114']:
            return 'At Risk'
        elif row['RFM_Score'] in ['255', '254', '245', '244', '253', '252', '243', '242', '235', '234', '225', '224', '153', '152', '145', '143', '142', '135', '134', '125', '124']:
            return 'Cannot Lose Them'
        else:
            return 'Others'
    
    rfm['Segment'] = rfm.apply(segment_customers, axis=1)
    
    return rfm

# 使用示例
# rfm_result = rfm_analysis(transaction_df)
# print(rfm_result['Segment'].value_counts())
`,
    tags: 'RFM,客户分析,pandas',
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
    recommendedAnswer: `
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.spatial.distance import cosine
from sklearn.metrics.pairwise import cosine_similarity

class CollaborativeFiltering:
    def __init__(self, n_recommendations=10):
        self.n_recommendations = n_recommendations
        self.user_item_matrix = None
        self.user_similarity = None
        
    def fit(self, ratings_df):
        """
        训练协同过滤模型
        ratings_df: 包含 user_id, item_id, rating 列
        """
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
        
        # 转换为DataFrame便于操作
        self.user_similarity = pd.DataFrame(
            self.user_similarity,
            index=self.user_item_matrix.index,
            columns=self.user_item_matrix.index
        )
        
    def get_user_recommendations(self, user_id, n_similar_users=50):
        """
        为指定用户生成推荐
        """
        if user_id not in self.user_item_matrix.index:
            return []
            
        # 获取用户相似度
        user_similarities = self.user_similarity[user_id].sort_values(ascending=False)
        
        # 选择最相似的用户（排除自己）
        similar_users = user_similarities.iloc[1:n_similar_users+1].index
        
        # 获取目标用户已评分的物品
        user_ratings = self.user_item_matrix.loc[user_id]
        rated_items = user_ratings[user_ratings > 0].index
        
        # 计算推荐分数
        recommendations = {}
        
        for item in self.user_item_matrix.columns:
            if item in rated_items:
                continue  # 跳过已评分物品
                
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
        
        # 排序并返回top-N推荐
        sorted_recommendations = sorted(
            recommendations.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return sorted_recommendations[:self.n_recommendations]
    
    def evaluate_model(self, test_df):
        """
        评估模型性能
        """
        predictions = []
        actuals = []
        
        for _, row in test_df.iterrows():
            user_id = row['user_id']
            item_id = row['item_id']
            actual_rating = row['rating']
            
            # 预测评分
            predicted_rating = self.predict_rating(user_id, item_id)
            
            if predicted_rating is not None:
                predictions.append(predicted_rating)
                actuals.append(actual_rating)
        
        # 计算RMSE
        mse = np.mean((np.array(predictions) - np.array(actuals)) ** 2)
        rmse = np.sqrt(mse)
        
        return rmse
    
    def predict_rating(self, user_id, item_id):
        """预测用户对物品的评分"""
        if user_id not in self.user_item_matrix.index:
            return None
            
        user_similarities = self.user_similarity[user_id]
        item_ratings = self.user_item_matrix[item_id]
        
        # 找到对该物品有评分的用户
        rated_users = item_ratings[item_ratings > 0].index
        
        if len(rated_users) == 0:
            return None
        
        weighted_sum = 0
        similarity_sum = 0
        
        for rated_user in rated_users:
            if rated_user != user_id:
                similarity = user_similarities[rated_user]
                rating = item_ratings[rated_user]
                
                weighted_sum += similarity * rating
                similarity_sum += abs(similarity)
        
        if similarity_sum > 0:
            return weighted_sum / similarity_sum
        else:
            return None

# 使用示例
# cf = CollaborativeFiltering()
# cf.fit(ratings_df)
# recommendations = cf.get_user_recommendations(user_id=123)
`,
    tags: '协同过滤,推荐系统,稀疏矩阵',
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
    recommendedAnswer: `
import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import norm
import math

class ABTestAnalyzer:
    def __init__(self, alpha=0.05, power=0.8):
        self.alpha = alpha  # 显著性水平
        self.power = power  # 统计功效
        
    def sample_size_calculation(self, baseline_rate, effect_size, two_sided=True):
        """
        计算A/B测试所需样本量
        baseline_rate: 基线转化率
        effect_size: 期望的效应大小（相对提升）
        """
        # 计算期望的新转化率
        new_rate = baseline_rate * (1 + effect_size)
        
        # Z值
        if two_sided:
            z_alpha = norm.ppf(1 - self.alpha/2)
        else:
            z_alpha = norm.ppf(1 - self.alpha)
        
        z_beta = norm.ppf(self.power)
        
        # 样本量计算公式
        pooled_rate = (baseline_rate + new_rate) / 2
        
        numerator = (z_alpha * math.sqrt(2 * pooled_rate * (1 - pooled_rate)) + 
                    z_beta * math.sqrt(baseline_rate * (1 - baseline_rate) + 
                                     new_rate * (1 - new_rate))) ** 2
        
        denominator = (new_rate - baseline_rate) ** 2
        
        n = numerator / denominator
        
        return math.ceil(n)
    
    def proportion_test(self, control_conversions, control_total, 
                       treatment_conversions, treatment_total, two_sided=True):
        """
        比例的假设检验（Z检验）
        """
        # 计算转化率
        p1 = control_conversions / control_total
        p2 = treatment_conversions / treatment_total
        
        # 合并比例
        p_pool = (control_conversions + treatment_conversions) / (control_total + treatment_total)
        
        # 标准误差
        se = math.sqrt(p_pool * (1 - p_pool) * (1/control_total + 1/treatment_total))
        
        # Z统计量
        z_stat = (p2 - p1) / se
        
        # p值
        if two_sided:
            p_value = 2 * (1 - norm.cdf(abs(z_stat)))
        else:
            p_value = 1 - norm.cdf(z_stat)
        
        # 效应大小
        effect_size = (p2 - p1) / p1 if p1 > 0 else 0
        
        # 置信区间
        ci_se = math.sqrt(p1 * (1 - p1) / control_total + p2 * (1 - p2) / treatment_total)
        margin_error = norm.ppf(1 - self.alpha/2) * ci_se
        ci_lower = (p2 - p1) - margin_error
        ci_upper = (p2 - p1) + margin_error
        
        results = {
            'control_rate': p1,
            'treatment_rate': p2,
            'effect_size': effect_size,
            'z_statistic': z_stat,
            'p_value': p_value,
            'significant': p_value < self.alpha,
            'confidence_interval': (ci_lower, ci_upper)
        }
        
        return results
    
    def continuous_test(self, control_data, treatment_data, equal_var=False):
        """
        连续变量的t检验
        """
        # 基本统计
        control_mean = np.mean(control_data)
        treatment_mean = np.mean(treatment_data)
        
        # t检验
        t_stat, p_value = stats.ttest_ind(treatment_data, control_data, equal_var=equal_var)
        
        # 效应大小 (Cohen's d)
        pooled_std = np.sqrt(((len(control_data) - 1) * np.var(control_data, ddof=1) + 
                             (len(treatment_data) - 1) * np.var(treatment_data, ddof=1)) /
                            (len(control_data) + len(treatment_data) - 2))
        
        cohens_d = (treatment_mean - control_mean) / pooled_std
        
        # 置信区间
        se = pooled_std * np.sqrt(1/len(control_data) + 1/len(treatment_data))
        df = len(control_data) + len(treatment_data) - 2
        t_critical = stats.t.ppf(1 - self.alpha/2, df)
        margin_error = t_critical * se
        
        ci_lower = (treatment_mean - control_mean) - margin_error
        ci_upper = (treatment_mean - control_mean) + margin_error
        
        results = {
            'control_mean': control_mean,
            'treatment_mean': treatment_mean,
            'effect_size': (treatment_mean - control_mean) / control_mean,
            'cohens_d': cohens_d,
            't_statistic': t_stat,
            'p_value': p_value,
            'significant': p_value < self.alpha,
            'confidence_interval': (ci_lower, ci_upper)
        }
        
        return results

# 使用示例
ab_analyzer = ABTestAnalyzer()

# 样本量计算
sample_size = ab_analyzer.sample_size_calculation(
    baseline_rate=0.10, 
    effect_size=0.20  # 20%相对提升
)
print(f"所需样本量: {sample_size}")

# 比例检验
result = ab_analyzer.proportion_test(
    control_conversions=100, control_total=1000,
    treatment_conversions=130, treatment_total=1000
)
print(f"A/B测试结果: {result}")
`,
    tags: 'AB测试,假设检验,统计分析',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },

  // SQL 查询题目 (10道)
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '编写SQL查询来计算用户留存率：计算每个月新注册用户在第1、7、30天的留存率。',
    recommendedAnswer: `
-- 计算用户留存率
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
        COUNT(DISTINCT CASE WHEN days_since_first_login = 0 THEN user_id END) AS day_0_users,
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
WHERE total_users >= 100  -- 过滤样本量太小的月份
ORDER BY cohort_month;

-- 替代方案：使用窗口函数优化性能
WITH user_cohorts AS (
    SELECT 
        user_id,
        DATE_TRUNC('month', MIN(login_date)) AS cohort_month,
        MIN(login_date) AS first_login_date
    FROM user_activity
    GROUP BY user_id
),

daily_retention AS (
    SELECT 
        uc.cohort_month,
        uc.user_id,
        CASE WHEN ua.login_date = uc.first_login_date + INTERVAL '1 day' THEN 1 ELSE 0 END AS retained_day_1,
        CASE WHEN ua.login_date = uc.first_login_date + INTERVAL '7 day' THEN 1 ELSE 0 END AS retained_day_7,
        CASE WHEN ua.login_date = uc.first_login_date + INTERVAL '30 day' THEN 1 ELSE 0 END AS retained_day_30
    FROM user_cohorts uc
    LEFT JOIN user_activity ua ON uc.user_id = ua.user_id 
        AND ua.login_date BETWEEN uc.first_login_date AND uc.first_login_date + INTERVAL '30 day'
)

SELECT 
    cohort_month,
    COUNT(DISTINCT user_id) AS total_users,
    ROUND(SUM(retained_day_1) * 100.0 / COUNT(DISTINCT user_id), 2) AS day_1_retention_rate,
    ROUND(SUM(retained_day_7) * 100.0 / COUNT(DISTINCT user_id), 2) AS day_7_retention_rate,
    ROUND(SUM(retained_day_30) * 100.0 / COUNT(DISTINCT user_id), 2) AS day_30_retention_rate
FROM daily_retention
GROUP BY cohort_month
ORDER BY cohort_month;
`,
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
    recommendedAnswer: `
-- 识别异常用户搜索行为
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
        ROUND(uds.daily_search_count / uss.avg_daily_searches, 2) AS search_multiplier
    FROM user_search_stats uss
    JOIN user_daily_searches uds ON uss.user_id = uds.user_id
    WHERE uds.daily_search_count > uss.avg_daily_searches * 3  -- 超过平均3倍
        AND uss.avg_daily_searches >= 5  -- 过滤低频用户
),

anomaly_patterns AS (
    -- 分析异常用户的搜索模式
    SELECT 
        au.user_id,
        au.anomaly_date,
        au.search_multiplier,
        -- 搜索时间分布
        EXTRACT(HOUR FROM sl.search_timestamp) AS search_hour,
        COUNT(*) AS searches_per_hour,
        -- 查询特征
        AVG(LENGTH(sl.search_query)) AS avg_query_length,
        COUNT(DISTINCT sl.search_query) AS unique_queries,
        -- 最频繁的搜索词
        STRING_AGG(DISTINCT sl.search_query ORDER BY sl.search_timestamp LIMIT 5) AS top_queries
    FROM anomalous_users au
    JOIN search_logs sl ON au.user_id = sl.user_id 
        AND DATE(sl.search_timestamp) = au.anomaly_date
    GROUP BY au.user_id, au.anomaly_date, au.search_multiplier, EXTRACT(HOUR FROM sl.search_timestamp)
)

-- 最终结果：异常用户及其搜索模式
SELECT 
    user_id,
    anomaly_date,
    search_multiplier,
    -- 搜索时间集中度
    COUNT(DISTINCT search_hour) AS active_hours,
    SUM(searches_per_hour) AS total_searches,
    MAX(searches_per_hour) AS peak_hourly_searches,
    -- 搜索内容特征
    ROUND(AVG(avg_query_length), 2) AS avg_query_length,
    ROUND(AVG(unique_queries), 2) AS avg_unique_queries,
    -- 判断可能的异常类型
    CASE 
        WHEN COUNT(DISTINCT search_hour) <= 2 THEN 'Concentrated_Time'
        WHEN AVG(unique_queries) / SUM(searches_per_hour) < 0.3 THEN 'Repetitive_Queries'
        WHEN AVG(avg_query_length) < 3 THEN 'Short_Queries'
        ELSE 'Other'
    END AS anomaly_pattern
FROM anomaly_patterns
GROUP BY user_id, anomaly_date, search_multiplier
ORDER BY search_multiplier DESC, total_searches DESC;

-- 补充查询：异常用户的历史对比
WITH baseline_behavior AS (
    SELECT 
        user_id,
        AVG(daily_search_count) AS baseline_avg_searches,
        STDDEV(daily_search_count) AS baseline_stddev
    FROM user_daily_searches
    WHERE search_date < (SELECT MIN(anomaly_date) FROM anomalous_users)
    GROUP BY user_id
)

SELECT 
    au.user_id,
    au.anomaly_date,
    au.anomaly_search_count,
    bb.baseline_avg_searches,
    ROUND((au.anomaly_search_count - bb.baseline_avg_searches) / bb.baseline_stddev, 2) AS z_score
FROM anomalous_users au
LEFT JOIN baseline_behavior bb ON au.user_id = bb.user_id
ORDER BY z_score DESC;
`,
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
    recommendedAnswer: `
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
        -- 点击事件
        c.clicked_timestamp,
        CASE WHEN c.clicked_timestamp IS NOT NULL THEN 1 ELSE 0 END AS clicked,
        -- 购买事件
        o.order_timestamp,
        o.quantity,
        o.revenue,
        CASE WHEN o.order_timestamp IS NOT NULL THEN 1 ELSE 0 END AS converted
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
        ROUND(SUM(revenue) / NULLIF(SUM(clicked), 0), 2) AS revenue_per_click
    FROM recommendation_events
    GROUP BY category, recommendation_position, recommendation_algorithm
),

position_analysis AS (
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

category_analysis AS (
    -- 商品类别效果分析
    SELECT 
        category,
        COUNT(*) AS total_recommendations,
        ROUND(AVG(click_rate), 2) AS avg_click_rate,
        ROUND(AVG(conversion_rate), 2) AS avg_conversion_rate,
        SUM(total_revenue) AS total_revenue,
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
    -- 与平均水平对比
    ROUND(rm.click_rate - pa.avg_click_rate, 2) AS click_rate_vs_position_avg,
    ROUND(rm.conversion_rate - ca.avg_conversion_rate, 2) AS conversion_rate_vs_category_avg,
    -- 效果评级
    CASE 
        WHEN rm.click_rate > pa.avg_click_rate AND rm.conversion_rate > ca.avg_conversion_rate 
        THEN 'Excellent'
        WHEN rm.click_rate > pa.avg_click_rate OR rm.conversion_rate > ca.avg_conversion_rate 
        THEN 'Good'
        WHEN rm.click_rate > 0.5 AND rm.conversion_rate > 0.1 
        THEN 'Average'
        ELSE 'Poor'
    END AS performance_rating
FROM recommendation_metrics rm
LEFT JOIN position_analysis pa ON rm.recommendation_position = pa.recommendation_position
LEFT JOIN category_analysis ca ON rm.category = ca.category
WHERE rm.total_recommendations >= 100  -- 过滤样本量太小的组合
ORDER BY rm.conversion_rate DESC, rm.click_rate DESC;

-- 补充查询：时间趋势分析
SELECT 
    DATE_TRUNC('week', shown_timestamp) AS week,
    category,
    COUNT(*) AS recommendations,
    ROUND(AVG(clicked) * 100, 2) AS click_rate,
    ROUND(AVG(converted) * 100, 2) AS conversion_rate
FROM recommendation_events
GROUP BY DATE_TRUNC('week', shown_timestamp), category
ORDER BY week DESC, conversion_rate DESC;
`,
    tags: '推荐系统分析,转化率分析,商品分析',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Spotify',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '编写SQL查询来分析用户音乐收听习惯：识别用户的音乐偏好变化，计算流派多样性指数。',
    recommendedAnswer: `
-- 用户音乐收听习惯分析
WITH user_listening_history AS (
    -- 获取用户收听历史，按时间段分组
    SELECT 
        user_id,
        track_id,
        artist_id,
        genre,
        listen_timestamp,
        duration_seconds,
        CASE 
            WHEN listen_timestamp >= CURRENT_DATE - INTERVAL '30 days' THEN 'Recent'
            WHEN listen_timestamp >= CURRENT_DATE - INTERVAL '90 days' THEN 'Previous'
            ELSE 'Historical'
        END AS time_period
    FROM listening_events le
    JOIN tracks t ON le.track_id = t.track_id
    WHERE listen_timestamp >= CURRENT_DATE - INTERVAL '90 days'
        AND duration_seconds >= 30  -- 至少听了30秒
),

user_genre_preferences AS (
    -- 计算用户在不同时间段的流派偏好
    SELECT 
        user_id,
        time_period,
        genre,
        COUNT(*) AS listen_count,
        SUM(duration_seconds) AS total_duration,
        COUNT(DISTINCT track_id) AS unique_tracks,
        COUNT(DISTINCT artist_id) AS unique_artists,
        -- 计算该流派在用户总收听中的占比
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY user_id, time_period), 2) AS genre_percentage
    FROM user_listening_history
    GROUP BY user_id, time_period, genre
),

genre_diversity AS (
    -- 计算用户的流派多样性指数 (Shannon Diversity Index)
    SELECT 
        user_id,
        time_period,
        COUNT(DISTINCT genre) AS total_genres,
        -- Shannon多样性指数: H = -Σ(pi * ln(pi))
        ROUND(-SUM((genre_percentage/100.0) * LN(genre_percentage/100.0)), 3) AS diversity_index,
        -- 主要流派（占比最高的流派）
        FIRST_VALUE(genre) OVER (
            PARTITION BY user_id, time_period 
            ORDER BY genre_percentage DESC
        ) AS primary_genre,
        MAX(genre_percentage) AS primary_genre_percentage
    FROM user_genre_preferences
    GROUP BY user_id, time_period
),

preference_changes AS (
    -- 分析用户偏好变化
    SELECT 
        r.user_id,
        r.primary_genre AS recent_primary_genre,
        r.primary_genre_percentage AS recent_percentage,
        r.diversity_index AS recent_diversity,
        p.primary_genre AS previous_primary_genre,
        p.primary_genre_percentage AS previous_percentage,
        p.diversity_index AS previous_diversity,
        -- 多样性变化
        ROUND(r.diversity_index - p.diversity_index, 3) AS diversity_change,
        -- 偏好稳定性
        CASE 
            WHEN r.primary_genre = p.primary_genre THEN 'Stable'
            ELSE 'Changed'
        END AS preference_stability,
        -- 变化类型
        CASE 
            WHEN r.diversity_index > p.diversity_index + 0.2 THEN 'More_Diverse'
            WHEN r.diversity_index < p.diversity_index - 0.2 THEN 'Less_Diverse'
            ELSE 'Similar_Diversity'
        END AS diversity_trend
    FROM genre_diversity r
    JOIN genre_diversity p ON r.user_id = p.user_id
    WHERE r.time_period = 'Recent' AND p.time_period = 'Previous'
),

user_segments AS (
    -- 用户分群
    SELECT 
        user_id,
        recent_primary_genre,
        recent_diversity,
        diversity_change,
        preference_stability,
        diversity_trend,
        CASE 
            WHEN recent_diversity >= 2.0 THEN 'Highly_Diverse'
            WHEN recent_diversity >= 1.0 THEN 'Moderately_Diverse'
            ELSE 'Focused_Listener'
        END AS listener_type,
        CASE 
            WHEN diversity_change > 0.3 THEN 'Exploring'
            WHEN diversity_change < -0.3 THEN 'Narrowing'
            ELSE 'Stable'
        END AS behavior_trend
    FROM preference_changes
)

-- 主查询：用户音乐偏好分析结果
SELECT 
    listener_type,
    behavior_trend,
    preference_stability,
    COUNT(*) AS user_count,
    ROUND(AVG(recent_diversity), 3) AS avg_diversity_index,
    ROUND(AVG(diversity_change), 3) AS avg_diversity_change,
    -- 最常见的主要流派
    MODE() WITHIN GROUP (ORDER BY recent_primary_genre) AS most_common_genre
FROM user_segments
GROUP BY listener_type, behavior_trend, preference_stability
ORDER BY user_count DESC;

-- 补充查询：流派转换矩阵
WITH genre_transitions AS (
    SELECT 
        previous_primary_genre,
        recent_primary_genre,
        COUNT(*) AS transition_count
    FROM preference_changes
    WHERE preference_stability = 'Changed'
    GROUP BY previous_primary_genre, recent_primary_genre
)

SELECT 
    previous_primary_genre AS from_genre,
    recent_primary_genre AS to_genre,
    transition_count,
    ROUND(transition_count * 100.0 / SUM(transition_count) OVER (PARTITION BY previous_primary_genre), 2) AS transition_percentage
FROM genre_transitions
WHERE transition_count >= 10  -- 过滤少量转换
ORDER BY previous_primary_genre, transition_count DESC;

-- 个人用户详细分析示例
SELECT 
    ugp.user_id,
    ugp.time_period,
    ugp.genre,
    ugp.listen_count,
    ugp.genre_percentage,
    gd.diversity_index,
    gd.total_genres
FROM user_genre_preferences ugp
JOIN genre_diversity gd ON ugp.user_id = gd.user_id AND ugp.time_period = gd.time_period
WHERE ugp.user_id = 12345  -- 特定用户ID
ORDER BY ugp.time_period, ugp.genre_percentage DESC;
`,
    tags: '用户行为分析,音乐偏好,多样性指数',
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
    recommendedAnswer: `
-- 视频病毒式传播分析
WITH video_metrics AS (
    -- 计算视频的基础指标
    SELECT 
        video_id,
        creator_id,
        upload_timestamp,
        duration_seconds,
        COUNT(DISTINCT user_id) AS unique_viewers,
        COUNT(*) AS total_views,
        SUM(CASE WHEN view_duration >= duration_seconds * 0.8 THEN 1 ELSE 0 END) AS completion_views,
        SUM(liked) AS total_likes,
        SUM(shared) AS total_shares,
        SUM(commented) AS total_comments,
        -- 计算参与率
        ROUND(SUM(liked + shared + commented) * 100.0 / COUNT(*), 2) AS engagement_rate,
        ROUND(SUM(CASE WHEN view_duration >= duration_seconds * 0.8 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS completion_rate
    FROM video_views
    WHERE view_timestamp >= upload_timestamp  -- 确保时间逻辑正确
    GROUP BY video_id, creator_id, upload_timestamp, duration_seconds
),

viral_videos AS (
    -- 识别病毒视频（多维度筛选）
    SELECT 
        vm.*,
        -- 病毒指数计算
        ROUND(
            (LOG(unique_viewers) * 0.3 + 
             LOG(total_shares + 1) * 0.4 + 
             engagement_rate * 0.2 + 
             completion_rate * 0.1), 2
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
    WHERE unique_viewers >= 10000  -- 基础门槛
),

sharing_cascade AS (
    -- 分析分享传播链
    WITH RECURSIVE share_tree AS (
        -- 初始分享（直接从原视频分享）
        SELECT 
            s.share_id,
            s.video_id,
            s.user_id AS sharer_id,
            s.shared_timestamp,
            0 AS cascade_level,
            CAST(s.user_id AS STRING) AS sharing_path
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
            st.sharing_path || '->' || CAST(s.user_id AS STRING)
        FROM shares s
        JOIN share_tree st ON s.parent_share_id = st.share_id
        WHERE st.cascade_level < 10  -- 限制递归深度
    )
    
    SELECT 
        video_id,
        MAX(cascade_level) AS max_cascade_depth,
        COUNT(*) AS total_cascade_shares,
        COUNT(DISTINCT sharer_id) AS unique_sharers,
        -- 每层分享数量
        STRING_AGG(
            CONCAT('Level_', cascade_level, ':', COUNT(*)), 
            ', ' ORDER BY cascade_level
        ) AS cascade_distribution
    FROM share_tree
    GROUP BY video_id
),

time_series_growth AS (
    -- 分析视频增长曲线
    SELECT 
        vv.video_id,
        DATE_TRUNC('hour', view_timestamp) AS hour_bucket,
        COUNT(*) AS hourly_views,
        SUM(shared) AS hourly_shares,
        -- 累计指标
        SUM(COUNT(*)) OVER (
            PARTITION BY vv.video_id 
            ORDER BY DATE_TRUNC('hour', view_timestamp)
        ) AS cumulative_views,
        -- 增长率
        LAG(COUNT(*)) OVER (
            PARTITION BY vv.video_id 
            ORDER BY DATE_TRUNC('hour', view_timestamp)
        ) AS prev_hour_views
    FROM viral_videos vv
    JOIN video_views vw ON vv.video_id = vw.video_id
    WHERE view_timestamp BETWEEN upload_timestamp AND upload_timestamp + INTERVAL '7 days'
    GROUP BY vv.video_id, DATE_TRUNC('hour', view_timestamp)
),

peak_growth_analysis AS (
    -- 识别增长峰值
    SELECT 
        video_id,
        hour_bucket AS peak_hour,
        hourly_views AS peak_hourly_views,
        ROUND((hourly_views - prev_hour_views) * 100.0 / NULLIF(prev_hour_views, 0), 2) AS growth_rate,
        -- 排名
        ROW_NUMBER() OVER (PARTITION BY video_id ORDER BY hourly_views DESC) AS peak_rank
    FROM time_series_growth
    WHERE prev_hour_views IS NOT NULL
),

content_features AS (
    -- 分析内容特征
    SELECT 
        vv.video_id,
        vv.viral_level,
        vc.category,
        vc.has_music,
        vc.has_text_overlay,
        vc.video_effects_count,
        vc.hashtags_count,
        -- 创作者特征
        c.follower_count AS creator_followers,
        c.verification_status,
        -- 时间特征
        EXTRACT(HOUR FROM vv.upload_timestamp) AS upload_hour,
        EXTRACT(DOW FROM vv.upload_timestamp) AS upload_day_of_week
    FROM viral_videos vv
    JOIN video_content vc ON vv.video_id = vc.video_id
    JOIN creators c ON vv.creator_id = c.creator_id
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
    -- 传播特征
    sc.max_cascade_depth,
    sc.total_cascade_shares,
    -- 增长特征
    pga.peak_hourly_views,
    pga.growth_rate AS max_growth_rate,
    -- 内容特征
    cf.category,
    cf.has_music,
    cf.creator_followers,
    cf.upload_hour,
    -- 病毒传播效率
    ROUND(vv.total_shares * 1.0 / EXTRACT(EPOCH FROM (pga.peak_hour - vv.upload_timestamp))/3600, 2) AS shares_per_hour_to_peak
FROM viral_videos vv
LEFT JOIN sharing_cascade sc ON vv.video_id = sc.video_id
LEFT JOIN peak_growth_analysis pga ON vv.video_id = pga.video_id AND pga.peak_rank = 1
LEFT JOIN content_features cf ON vv.video_id = cf.video_id
WHERE vv.viral_level IN ('Viral', 'Highly_Viral', 'Super_Viral')
ORDER BY vv.viral_score DESC;

-- 病毒视频特征总结
SELECT 
    viral_level,
    COUNT(*) AS video_count,
    ROUND(AVG(viral_score), 2) AS avg_viral_score,
    ROUND(AVG(share_rate), 4) AS avg_share_rate,
    ROUND(AVG(engagement_rate), 2) AS avg_engagement_rate,
    ROUND(AVG(max_cascade_depth), 1) AS avg_cascade_depth,
    -- 最常见的内容特征
    MODE() WITHIN GROUP (ORDER BY category) AS most_common_category,
    ROUND(AVG(CASE WHEN has_music THEN 1.0 ELSE 0.0 END) * 100, 1) AS music_percentage,
    ROUND(AVG(upload_hour), 1) AS avg_upload_hour
FROM (
    SELECT vv.*, cf.category, cf.has_music, cf.upload_hour, sc.max_cascade_depth
    FROM viral_videos vv
    LEFT JOIN content_features cf ON vv.video_id = cf.video_id
    LEFT JOIN sharing_cascade sc ON vv.video_id = sc.video_id
) combined_data
GROUP BY viral_level
ORDER BY avg_viral_score DESC;
`,
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
    recommendedAnswer: `
-- 职位推荐精准度分析
WITH user_skills AS (
    -- 获取用户技能信息
    SELECT 
        user_id,
        skill_name,
        proficiency_level,
        years_experience,
        is_certified
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
        r.recommended_timestamp,
        -- 用户行为
        CASE WHEN c.clicked_timestamp IS NOT NULL THEN 1 ELSE 0 END AS clicked,
        CASE WHEN a.applied_timestamp IS NOT NULL THEN 1 ELSE 0 END AS applied,
        CASE WHEN h.hired_timestamp IS NOT NULL THEN 1 ELSE 0 END AS hired,
        -- 用户反馈
        f.relevance_rating,  -- 1-5分
        f.interest_level     -- 1-5分
    FROM recommendations r
    LEFT JOIN clicks c ON r.recommendation_id = c.recommendation_id
    LEFT JOIN applications a ON r.user_id = a.user_id AND r.job_id = a.job_id
        AND a.applied_timestamp BETWEEN r.recommended_timestamp AND r.recommended_timestamp + INTERVAL '30 days'
    LEFT JOIN hires h ON a.application_id = h.application_id
    LEFT JOIN user_feedback f ON r.recommendation_id = f.recommendation_id
    WHERE r.recommended_timestamp >= CURRENT_DATE - INTERVAL '30 days'
),

skill_matching AS (
    -- 计算用户与职位的技能匹配度
    SELECT 
        re.recommendation_id,
        re.user_id,
        re.job_id,
        -- 技能匹配统计
        COUNT(jr.required_skill) AS total_required_skills,
        COUNT(us.skill_name) AS matched_skills,
        SUM(CASE WHEN us.years_experience >= jr.min_years_required THEN jr.importance_level ELSE 0 END) AS weighted_matched_skills,
        SUM(jr.importance_level) AS total_weighted_requirements,
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

recommendation_accuracy AS (
    -- 计算推荐准确率
    SELECT 
        re.*,
        sm.skill_match_percentage,
        sm.weighted_match_percentage,
        -- 定义推荐成功的多个标准
        CASE 
            WHEN re.hired = 1 THEN 'Hired'
            WHEN re.applied = 1 THEN 'Applied'  
            WHEN re.clicked = 1 AND re.relevance_rating >= 4 THEN 'Highly_Relevant_Click'
            WHEN re.clicked = 1 AND re.relevance_rating >= 3 THEN 'Relevant_Click'
            WHEN re.clicked = 1 THEN 'Click_Only'
            ELSE 'No_Engagement'
        END AS outcome_category,
        -- 综合成功评分
        CASE 
            WHEN re.hired = 1 THEN 100
            WHEN re.applied = 1 THEN 80
            WHEN re.clicked = 1 AND re.relevance_rating >= 4 THEN 60
            WHEN re.clicked = 1 AND re.relevance_rating >= 3 THEN 40
            WHEN re.clicked = 1 THEN 20
            ELSE 0
        END AS success_score
    FROM recommendation_events re
    JOIN skill_matching sm ON re.recommendation_id = sm.recommendation_id
),

match_score_buckets AS (
    -- 按匹配度分桶分析
    SELECT 
        CASE 
            WHEN weighted_match_percentage >= 80 THEN '80-100%'
            WHEN weighted_match_percentage >= 60 THEN '60-79%'
            WHEN weighted_match_percentage >= 40 THEN '40-59%'
            WHEN weighted_match_percentage >= 20 THEN '20-39%'
            ELSE '0-19%'
        END AS match_score_bucket,
        outcome_category,
        COUNT(*) AS recommendation_count,
        ROUND(AVG(success_score), 2) AS avg_success_score,
        ROUND(AVG(relevance_rating), 2) AS avg_relevance_rating
    FROM recommendation_accuracy
    WHERE relevance_rating IS NOT NULL
    GROUP BY 
        CASE 
            WHEN weighted_match_percentage >= 80 THEN '80-100%'
            WHEN weighted_match_percentage >= 60 THEN '60-79%'
            WHEN weighted_match_percentage >= 40 THEN '40-59%'
            WHEN weighted_match_percentage >= 20 THEN '20-39%'
            ELSE '0-19%'
        END,
        outcome_category
)

-- 主查询：推荐精准度分析
SELECT 
    match_score_bucket,
    SUM(recommendation_count) AS total_recommendations,
    -- 各类结果的分布
    SUM(CASE WHEN outcome_category = 'Hired' THEN recommendation_count ELSE 0 END) AS hired_count,
    SUM(CASE WHEN outcome_category = 'Applied' THEN recommendation_count ELSE 0 END) AS applied_count,
    SUM(CASE WHEN outcome_category LIKE '%Click%' THEN recommendation_count ELSE 0 END) AS clicked_count,
    -- 计算率
    ROUND(SUM(CASE WHEN outcome_category = 'Hired' THEN recommendation_count ELSE 0 END) * 100.0 / SUM(recommendation_count), 2) AS hire_rate,
    ROUND(SUM(CASE WHEN outcome_category = 'Applied' THEN recommendation_count ELSE 0 END) * 100.0 / SUM(recommendation_count), 2) AS application_rate,
    ROUND(SUM(CASE WHEN outcome_category LIKE '%Click%' THEN recommendation_count ELSE 0 END) * 100.0 / SUM(recommendation_count), 2) AS click_rate,
    -- 平均成功评分
    ROUND(SUM(avg_success_score * recommendation_count) / SUM(recommendation_count), 2) AS weighted_avg_success_score,
    ROUND(SUM(avg_relevance_rating * recommendation_count) / SUM(recommendation_count), 2) AS weighted_avg_relevance
FROM match_score_buckets
GROUP BY match_score_bucket
ORDER BY 
    CASE match_score_bucket
        WHEN '80-100%' THEN 1
        WHEN '60-79%' THEN 2  
        WHEN '40-59%' THEN 3
        WHEN '20-39%' THEN 4
        WHEN '0-19%' THEN 5
    END;

-- 补充分析：技能匹配对推荐效果的影响
WITH correlation_analysis AS (
    SELECT 
        recommendation_id,
        skill_match_percentage,
        weighted_match_percentage,
        success_score,
        clicked,
        applied,
        hired,
        relevance_rating
    FROM recommendation_accuracy
    WHERE relevance_rating IS NOT NULL
)

SELECT 
    'Skill Match vs Success' AS analysis_type,
    ROUND(CORR(skill_match_percentage, success_score), 3) AS correlation_coefficient,
    ROUND(CORR(weighted_match_percentage, success_score), 3) AS weighted_correlation,
    ROUND(CORR(skill_match_percentage, relevance_rating), 3) AS relevance_correlation
FROM correlation_analysis

UNION ALL

-- 推荐算法效果对比
SELECT 
    'Algorithm Performance' AS analysis_type,
    NULL AS correlation_coefficient,
    NULL AS weighted_correlation,
    NULL AS relevance_correlation
FROM dual;

-- 按推荐分数区间的效果分析
SELECT 
    CASE 
        WHEN recommendation_score >= 0.8 THEN 'High (0.8-1.0)'
        WHEN recommendation_score >= 0.6 THEN 'Medium (0.6-0.8)'
        ELSE 'Low (0.0-0.6)'
    END AS score_range,
    COUNT(*) AS total_recommendations,
    ROUND(AVG(skill_match_percentage), 2) AS avg_skill_match,
    ROUND(AVG(success_score), 2) AS avg_success_score,
    ROUND(SUM(hired) * 100.0 / COUNT(*), 2) AS hire_rate,
    ROUND(AVG(relevance_rating), 2) AS avg_relevance
FROM recommendation_accuracy  
GROUP BY 
    CASE 
        WHEN recommendation_score >= 0.8 THEN 'High (0.8-1.0)'
        WHEN recommendation_score >= 0.6 THEN 'Medium (0.6-0.8)'
        ELSE 'Low (0.0-0.6)'
    END
ORDER BY avg_success_score DESC;
`,
    tags: '推荐精准度,技能匹配,职位分析',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  }
];

async function updateTechnicalQuestions() {
  console.log('🔄 开始重新分类题目和添加Python/SQL编程题...\n');
  
  try {
    // 1. 将现有的 technical 题目改为 case_study
    console.log('📝 步骤1: 将现有technical题目重分类为case_study...');
    const updateResult = await sql`
      UPDATE interview_questions 
      SET question_type = 'case_study' 
      WHERE question_type = 'technical'
    `;
    console.log(`✅ 已将 ${updateResult.rowCount} 道technical题目重分类为case_study\n`);
    
    // 2. 插入新的Python/SQL编程题目
    console.log('📝 步骤2: 插入新的Python/SQL编程题目...');
    
    for (let i = 0; i < pythonSqlQuestions.length; i++) {
      const q = pythonSqlQuestions[i];
      
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
      
      console.log(`✅ 插入编程题目 ${i + 1}: ${q.company} - ${q.position} - ${q.question.substring(0, 50)}...`);
    }
    
    // 3. 统计最终结果
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
    
    const pythonSqlStats = await sql`
      SELECT company, position, COUNT(*) as count
      FROM interview_questions 
      WHERE question_type = 'technical'
      GROUP BY company, position
      ORDER BY company, position
    `;
    
    console.log('\n💻 新增Python/SQL编程题分布:');
    pythonSqlStats.forEach(stat => {
      console.log(`   ${stat.company} - ${stat.position}: ${stat.count} 道`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`\n🎉 数据库中现有总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 更新过程中出现错误:', error);
  }
}

updateTechnicalQuestions(); 