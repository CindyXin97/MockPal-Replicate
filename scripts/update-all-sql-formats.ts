import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 完整的SQL题目格式更新
const allSqlUpdates = [
  {
    company: 'TikTok',
    position: '数据分析师',
    questionPattern: '编写SQL查询来分析视频病毒式传播',
    updatedQuestion: `**数据表结构:**

Table: **videos** (视频基础信息表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| video_id         | varchar(50) | 视频ID (主键)             |
| creator_id       | int         | 创作者ID                  |
| upload_timestamp | timestamp   | 上传时间                  |
| duration_seconds | int         | 视频时长(秒)              |
| category         | varchar(50) | 视频类别                  |
| has_music        | boolean     | 是否包含音乐              |
| hashtags_count   | int         | 标签数量                  |
+------------------+-------------+---------------------------+
\`\`\`

Table: **video_views** (视频观看记录表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| view_id          | varchar(50) | 观看记录ID (主键)         |
| video_id         | varchar(50) | 视频ID (外键)             |
| user_id          | int         | 观看用户ID                |
| view_timestamp   | timestamp   | 观看时间                  |
| view_duration    | int         | 观看时长(秒)              |
| liked            | boolean     | 是否点赞                  |
| shared           | boolean     | 是否分享                  |
| commented        | boolean     | 是否评论                  |
+------------------+-------------+---------------------------+
\`\`\`

Table: **shares** (分享传播表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| share_id         | varchar(50) | 分享记录ID (主键)         |
| video_id         | varchar(50) | 视频ID (外键)             |
| user_id          | int         | 分享者ID                  |
| shared_timestamp | timestamp   | 分享时间                  |
| parent_share_id  | varchar(50) | 上级分享ID (追踪传播链)   |
| platform         | varchar(50) | 分享平台                  |
+------------------+-------------+---------------------------+
\`\`\`

Table: **creators** (创作者信息表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| creator_id       | int         | 创作者ID (主键)           |
| follower_count   | int         | 粉丝数量                  |
| verification_status| boolean   | 认证状态                  |
| account_age_days | int         | 账户年龄(天)              |
+------------------+-------------+---------------------------+
\`\`\`

**示例数据:**
\`\`\`
-- videos 示例数据
video_id | creator_id | upload_timestamp    | duration_seconds | category | has_music | hashtags_count
---------|------------|--------------------|--------------------|----------|-----------|---------------
vid_001  | 5001       | 2024-01-10 14:30:00| 15                | Comedy   | true      | 5
vid_002  | 5002       | 2024-01-11 09:15:00| 30                | Dance    | true      | 8
vid_003  | 5003       | 2024-01-12 16:45:00| 45                | Education| false     | 3

-- video_views 示例数据  
view_id | video_id | user_id | view_timestamp      | view_duration | liked | shared | commented
--------|----------|---------|---------------------|---------------|-------|--------|----------
view_001| vid_001  | 6001    | 2024-01-10 15:00:00| 15           | true  | true   | false
view_002| vid_001  | 6002    | 2024-01-10 15:30:00| 12           | true  | false  | true
view_003| vid_001  | 6003    | 2024-01-10 16:00:00| 15           | false | true   | false

-- shares 示例数据 (展示传播链)
share_id | video_id | user_id | shared_timestamp    | parent_share_id | platform
---------|----------|---------|---------------------|-----------------|----------
share_001| vid_001  | 6001    | 2024-01-10 15:05:00| NULL           | TikTok
share_002| vid_001  | 6004    | 2024-01-10 17:20:00| share_001      | Instagram  
share_003| vid_001  | 6005    | 2024-01-10 19:15:00| share_002      | Twitter
\`\`\`
*注：parent_share_id用于追踪病毒传播链，NULL表示原始分享*

**题目:** 编写SQL查询来分析视频病毒式传播：识别病毒视频的特征，分析传播路径和影响因子。`,
    updatedAnswer: `**解题思路:**
1. 计算视频的基础指标（观看量、互动率、完成率）
2. 定义病毒视频的多维度标准（观看量+分享量+参与度）
3. 使用递归查询追踪分享传播链
4. 分析病毒视频的内容特征和传播模式

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
        ROUND(SUM(CASE WHEN vw.view_duration >= v.duration_seconds * 0.8 THEN 1 ELSE 0 END) * 100.0 / COUNT(vw.view_id), 2) AS completion_rate
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
        COUNT(DISTINCT platform) AS platforms_used
    FROM share_tree
    GROUP BY video_id
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
    -- 传播特征
    COALESCE(sc.max_cascade_depth, 0) AS max_cascade_depth,
    COALESCE(sc.total_cascade_shares, 0) AS total_cascade_shares,
    COALESCE(sc.platforms_used, 0) AS platforms_used,
    -- 创作者影响
    c.follower_count AS creator_followers,
    c.verification_status AS creator_verified
FROM viral_videos vv
LEFT JOIN sharing_cascade sc ON vv.video_id = sc.video_id
LEFT JOIN creators c ON vv.creator_id = c.creator_id
WHERE vv.viral_level IN ('Viral', 'Highly_Viral', 'Super_Viral', 'Trending')
ORDER BY vv.viral_score DESC;
\`\`\`

**关键知识点:**
- **递归CTE**: \`WITH RECURSIVE\` 追踪分享传播链
- **窗口函数**: 累计计算和排名分析
- **病毒指数**: \`LOG()\` 函数处理指数增长特征
- **多维分析**: 结合内容、传播、时间三个维度
- **条件聚合**: 计算完成率和参与率指标`
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
    questionPattern: '编写SQL查询来分析职位推荐的精准度',
    updatedQuestion: `**数据表结构:**

Table: **user_skills** (用户技能表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| user_id          | int         | 用户ID                    |
| skill_name       | varchar(100)| 技能名称                  |
| proficiency_level| int         | 熟练度等级 (1-5级)        |
| years_experience | int         | 相关经验年数              |
| is_certified     | boolean     | 是否有认证                |
| is_active        | boolean     | 技能是否有效              |
+------------------+-------------+---------------------------+
\`\`\`

Table: **job_skill_requirements** (职位技能要求表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| job_id           | int         | 职位ID                    |
| required_skill   | varchar(100)| 要求技能名称              |
| importance_level | int         | 重要程度 (1-5, 5最重要)   |
| min_years_required| int        | 最少经验年数要求          |
| is_mandatory     | boolean     | 是否为必需技能            |
+------------------+-------------+---------------------------+
\`\`\`

Table: **jobs** (职位信息表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| job_id           | int         | 职位ID (主键)             |
| job_title        | varchar(200)| 职位标题                  |
| company_name     | varchar(100)| 公司名称                  |
| location         | varchar(100)| 工作地点                  |
| salary_range     | varchar(50) | 薪资范围                  |
| job_level        | varchar(50) | 职位级别 (Entry/Mid/Senior)|
+------------------+-------------+---------------------------+
\`\`\`

Table: **recommendations** (推荐记录表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| recommendation_id| varchar(50) | 推荐记录ID (主键)         |
| user_id          | int         | 用户ID                    |
| job_id           | int         | 职位ID                    |
| recommendation_score| decimal(3,2)| 推荐分数 (0.00-1.00)    |
| recommended_timestamp| timestamp| 推荐时间                 |
| algorithm_version| varchar(20) | 算法版本                  |
+------------------+-------------+---------------------------+
\`\`\`

Table: **user_actions** (用户行为表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| action_id        | varchar(50) | 行为记录ID (主键)         |
| recommendation_id| varchar(50) | 推荐记录ID (外键)         |
| user_id          | int         | 用户ID                    |
| job_id           | int         | 职位ID                    |
| action_type      | varchar(20) | 行为类型 (click/apply/save)|
| action_timestamp | timestamp   | 行为发生时间              |
+------------------+-------------+---------------------------+
\`\`\`

Table: **user_feedback** (用户反馈表)
\`\`\`
+------------------+-------------+---------------------------+
| Column Name      | Type        | Description               |
+------------------+-------------+---------------------------+
| feedback_id      | varchar(50) | 反馈记录ID (主键)         |
| recommendation_id| varchar(50) | 推荐记录ID (外键)         |
| user_id          | int         | 用户ID                    |
| relevance_rating | int         | 相关性评分 (1-5分)        |
| interest_level   | int         | 兴趣程度 (1-5分)          |
| feedback_text    | text        | 文字反馈                  |
| feedback_timestamp| timestamp  | 反馈时间                  |
+------------------+-------------+---------------------------+
\`\`\`

**示例数据:**
\`\`\`
-- jobs 示例数据
job_id | job_title           | company_name | location      | salary_range | job_level
-------|--------------------|--------------|--------------|--------------|-----------
1001   | Senior Data Scientist| Meta        | San Francisco| $150k-200k   | Senior
1002   | Data Analyst       | Google       | Mountain View| $120k-150k   | Mid
1003   | ML Engineer        | Amazon       | Seattle      | $140k-180k   | Senior

-- user_skills 示例数据
user_id | skill_name        | proficiency_level | years_experience | is_certified | is_active
--------|-------------------|-------------------|------------------|--------------|----------
7001    | Python            | 4                 | 5                | true         | true
7001    | SQL               | 5                 | 6                | false        | true
7001    | Machine Learning  | 4                 | 4                | true         | true
7002    | Python            | 3                 | 2                | false        | true
7002    | Tableau           | 4                 | 3                | true         | true

-- job_skill_requirements 示例数据
job_id | required_skill    | importance_level | min_years_required | is_mandatory
-------|-------------------|------------------|--------------------|--------------
1001   | Python            | 5                | 3                  | true
1001   | Machine Learning  | 5                | 3                  | true
1001   | Statistics        | 4                | 2                  | false
1002   | SQL               | 5                | 2                  | true
1002   | Tableau           | 4                | 2                  | false

-- recommendations 示例数据
recommendation_id | user_id | job_id | recommendation_score | recommended_timestamp   | algorithm_version
------------------|---------|--------|--------------------|------------------------|------------------
rec_001           | 7001    | 1001   | 0.92               | 2024-01-15 09:00:00   | v2.1
rec_002           | 7001    | 1002   | 0.78               | 2024-01-15 09:00:00   | v2.1
rec_003           | 7002    | 1002   | 0.85               | 2024-01-15 10:30:00   | v2.1
\`\`\`

**题目:** 编写SQL查询来分析职位推荐的精准度：计算推荐准确率，分析用户技能匹配度对推荐效果的影响。`,
    updatedAnswer: `**解题思路:**
1. 计算用户技能与职位要求的匹配度（基础匹配、经验匹配、必需技能匹配）
2. 定义推荐成功的多层次标准（点击→申请→面试→录用）
3. 按技能匹配度分桶，分析推荐效果的差异
4. 计算技能匹配度与推荐成功率的相关性

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

recommendation_events AS (
    -- 推荐事件及用户反馈
    SELECT 
        r.recommendation_id,
        r.user_id,
        r.job_id,
        r.recommendation_score,
        j.job_title,
        j.company_name,
        j.job_level,
        -- 用户行为汇总
        MAX(CASE WHEN ua.action_type = 'click' THEN 1 ELSE 0 END) AS clicked,
        MAX(CASE WHEN ua.action_type = 'apply' THEN 1 ELSE 0 END) AS applied,
        MAX(CASE WHEN ua.action_type = 'save' THEN 1 ELSE 0 END) AS saved,
        -- 用户反馈
        uf.relevance_rating,
        uf.interest_level
    FROM recommendations r
    LEFT JOIN jobs j ON r.job_id = j.job_id
    LEFT JOIN user_actions ua ON r.recommendation_id = ua.recommendation_id
    LEFT JOIN user_feedback uf ON r.recommendation_id = uf.recommendation_id
    WHERE r.recommended_timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY r.recommendation_id, r.user_id, r.job_id, r.recommendation_score, 
             j.job_title, j.company_name, j.job_level, uf.relevance_rating, uf.interest_level
),

skill_matching_analysis AS (
    -- 技能匹配度分析
    SELECT 
        re.recommendation_id,
        re.user_id,
        re.job_id,
        -- 技能匹配统计
        COUNT(jsr.required_skill) AS total_required_skills,
        COUNT(usp.skill_name) AS matched_skills,
        COUNT(CASE WHEN jsr.is_mandatory THEN 1 END) AS mandatory_skills,
        COUNT(CASE WHEN jsr.is_mandatory AND usp.skill_name IS NOT NULL THEN 1 END) AS matched_mandatory_skills,
        -- 基础匹配率
        ROUND(COUNT(usp.skill_name) * 100.0 / GREATEST(COUNT(jsr.required_skill), 1), 2) AS basic_match_percentage,
        -- 必需技能匹配率
        ROUND(
            COUNT(CASE WHEN jsr.is_mandatory AND usp.skill_name IS NOT NULL THEN 1 END) * 100.0 / 
            GREATEST(COUNT(CASE WHEN jsr.is_mandatory THEN 1 END), 1), 2
        ) AS mandatory_match_percentage,
        -- 加权匹配度（考虑技能重要性）
        ROUND(
            SUM(CASE 
                WHEN usp.skill_name IS NOT NULL THEN 
                    LEAST(usp.skill_composite_score / 10.0, 1.0) * jsr.importance_level
                ELSE 0 
            END) * 100.0 / GREATEST(SUM(jsr.importance_level), 1), 2
        ) AS weighted_match_percentage
    FROM recommendation_events re
    LEFT JOIN job_skill_requirements jsr ON re.job_id = jsr.job_id
    LEFT JOIN user_skill_profile usp ON re.user_id = usp.user_id AND jsr.required_skill = usp.skill_name
    GROUP BY re.recommendation_id, re.user_id, re.job_id
),

recommendation_success_metrics AS (
    -- 推荐成功度量
    SELECT 
        re.*,
        sma.basic_match_percentage,
        sma.mandatory_match_percentage,
        sma.weighted_match_percentage,
        -- 定义推荐成功的多个标准
        CASE 
            WHEN re.applied = 1 THEN 'Applied'  
            WHEN re.clicked = 1 AND re.relevance_rating >= 4 THEN 'Highly_Relevant_Click'
            WHEN re.clicked = 1 AND re.relevance_rating >= 3 THEN 'Relevant_Click'
            WHEN re.clicked = 1 THEN 'Click_Only'
            WHEN re.saved = 1 THEN 'Saved_Only'
            ELSE 'No_Engagement'
        END AS outcome_category,
        -- 综合成功评分 (0-100)
        CASE 
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

match_score_buckets AS (
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
        outcome_category,
        COUNT(*) AS recommendation_count,
        ROUND(AVG(success_score), 2) AS avg_success_score,
        ROUND(AVG(relevance_rating), 2) AS avg_relevance_rating
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
        outcome_category
)

-- 主查询：推荐精准度综合分析
SELECT 
    match_score_bucket,
    SUM(recommendation_count) AS total_recommendations,
    -- 各类结果的分布
    SUM(CASE WHEN outcome_category = 'Applied' THEN recommendation_count ELSE 0 END) AS applied_count,
    SUM(CASE WHEN outcome_category LIKE '%Click%' THEN recommendation_count ELSE 0 END) AS clicked_count,
    SUM(CASE WHEN outcome_category = 'Saved_Only' THEN recommendation_count ELSE 0 END) AS saved_count,
    -- 计算成功率
    ROUND(SUM(CASE WHEN outcome_category = 'Applied' THEN recommendation_count ELSE 0 END) * 100.0 / SUM(recommendation_count), 2) AS application_rate,
    ROUND(SUM(CASE WHEN outcome_category NOT IN ('No_Engagement') THEN recommendation_count ELSE 0 END) * 100.0 / SUM(recommendation_count), 2) AS engagement_rate,
    -- 平均评分
    ROUND(SUM(avg_success_score * recommendation_count) / SUM(recommendation_count), 2) AS weighted_avg_success_score,
    ROUND(SUM(avg_relevance_rating * recommendation_count) / SUM(recommendation_count), 2) AS weighted_avg_relevance
FROM match_score_buckets
GROUP BY match_score_bucket
ORDER BY 
    CASE match_score_bucket
        WHEN '90-100%' THEN 1
        WHEN '80-89%' THEN 2  
        WHEN '70-79%' THEN 3
        WHEN '60-69%' THEN 4
        WHEN '50-59%' THEN 5
        WHEN '<50%' THEN 6
    END;
\`\`\`

**关键知识点:**
- **多维技能匹配**: 基础匹配、必需技能、经验要求、加权匹配
- **成功度量**: 多层次定义推荐成功(点击→申请→面试→录用)
- **分桶分析**: 按匹配度区间分析推荐效果
- **综合评分**: 考虑技能熟练度、认证、经验的综合评分
- **业务指标**: 申请率、参与率、相关性评分等核心指标`
  }
];

async function updateAllSqlFormats() {
  console.log('🔧 开始更新所有SQL题目的表格格式...\n');
  
  try {
    let updatedCount = 0;
    
    for (const update of allSqlUpdates) {
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
    
    console.log(`\n🎉 成功更新 ${updatedCount} 道SQL题目的表格展示格式！\n`);
    
    // 验证更新结果
    const allSqlQuestions = await sql`
      SELECT company, position, LEFT(question, 100) as question_preview
      FROM interview_questions 
      WHERE question_type = 'technical' 
        AND (question LIKE '%Table:%' OR question LIKE '%Column Name%')
      ORDER BY company, position
    `;
    
    console.log('📊 所有已改进表格格式的SQL题目:');
    allSqlQuestions.forEach((q, i) => {
      console.log(`${i + 1}. 【${q.company}】${q.position}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
  } catch (error) {
    console.error('❌ 更新过程中出现错误:', error);
  }
}

export { updateAllSqlFormats };

// 如果直接运行此脚本
if (require.main === module) {
  updateAllSqlFormats();
} 