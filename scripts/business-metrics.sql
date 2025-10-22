-- ==========================================
-- MockPal 核心业务指标 SQL 查询
-- ==========================================
-- 可以直接在 Neon Dashboard 或任何 PostgreSQL 客户端中执行
-- ==========================================

-- ==================== 1. 用户指标 ====================

-- 1.1 总用户数和近期增长
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as users_7d,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_30d,
  ROUND(COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as growth_rate_7d
FROM users;

-- 1.2 用户资料完成情况
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  COUNT(*) as completed_profiles,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM users) * 100, 2) as completion_rate,
  COUNT(CASE WHEN email IS NOT NULL OR wechat IS NOT NULL OR linkedin IS NOT NULL THEN 1 END) as profiles_with_contact,
  ROUND(COUNT(CASE WHEN email IS NOT NULL OR wechat IS NOT NULL OR linkedin IS NOT NULL THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as contact_rate
FROM user_profiles;

-- 1.3 用户职位类型分布
SELECT 
  job_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM user_profiles) * 100, 2) as percentage
FROM user_profiles
GROUP BY job_type
ORDER BY count DESC;

-- 1.4 用户经验水平分布
SELECT 
  experience_level,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM user_profiles) * 100, 2) as percentage
FROM user_profiles
GROUP BY experience_level
ORDER BY count DESC;

-- 1.5 练习偏好分布
SELECT 
  '技术面试' as preference_type,
  COUNT(CASE WHEN technical_interview = true THEN 1 END) as count,
  ROUND(COUNT(CASE WHEN technical_interview = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as percentage
FROM user_profiles
UNION ALL
SELECT 
  '行为面试' as preference_type,
  COUNT(CASE WHEN behavioral_interview = true THEN 1 END) as count,
  ROUND(COUNT(CASE WHEN behavioral_interview = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as percentage
FROM user_profiles
UNION ALL
SELECT 
  '案例分析' as preference_type,
  COUNT(CASE WHEN case_analysis = true THEN 1 END) as count,
  ROUND(COUNT(CASE WHEN case_analysis = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as percentage
FROM user_profiles
UNION ALL
SELECT 
  '统计问题' as preference_type,
  COUNT(CASE WHEN stats_questions = true THEN 1 END) as count,
  ROUND(COUNT(CASE WHEN stats_questions = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as percentage
FROM user_profiles;

-- ==================== 2. 匹配指标 ====================

-- 2.1 匹配总览和成功率
SELECT 
  COUNT(*) as total_matches,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_matches,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_matches,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_matches,
  ROUND(COUNT(CASE WHEN status = 'accepted' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as success_rate
FROM matches;

-- 2.2 联系状态分布（仅已接受的匹配）
SELECT 
  contact_status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM matches WHERE status = 'accepted') * 100, 2) as percentage
FROM matches
WHERE status = 'accepted'
GROUP BY contact_status
ORDER BY count DESC;

-- 2.3 联系转化率
SELECT 
  COUNT(*) as accepted_matches,
  COUNT(CASE WHEN contact_status IN ('contacted', 'scheduled', 'completed') THEN 1 END) as contacted_matches,
  ROUND(COUNT(CASE WHEN contact_status IN ('contacted', 'scheduled', 'completed') THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as contact_conversion_rate
FROM matches
WHERE status = 'accepted';

-- 2.4 近期匹配趋势（过去7天每天的匹配数）
SELECT 
  DATE(created_at) as match_date,
  COUNT(*) as matches_count,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count
FROM matches
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY match_date DESC;

-- 2.5 每个用户的匹配统计
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  COUNT(DISTINCT m.id) as total_matches,
  COUNT(DISTINCT CASE WHEN m.status = 'accepted' THEN m.id END) as accepted_matches,
  COUNT(DISTINCT CASE WHEN m.status = 'pending' THEN m.id END) as pending_matches,
  COUNT(DISTINCT CASE WHEN m.status = 'rejected' THEN m.id END) as rejected_matches
FROM users u
LEFT JOIN matches m ON u.id = m.user1_id OR u.id = m.user2_id
GROUP BY u.id, u.name, u.email
ORDER BY total_matches DESC
LIMIT 20;

-- ==================== 3. 用户活跃度 ====================

-- 3.1 活跃度总览
SELECT 
  COUNT(*) as total_views,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as views_7d,
  COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN user_id END) as active_users_7d,
  ROUND(AVG(views_per_user), 2) as avg_views_per_user
FROM user_daily_views
CROSS JOIN (
  SELECT COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_id), 0) as views_per_user
  FROM user_daily_views
) sub;

-- 3.2 活跃用户率
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  COUNT(DISTINCT user_id) as active_users,
  ROUND(COUNT(DISTINCT user_id)::numeric / (SELECT COUNT(*) FROM users) * 100, 2) as active_rate
FROM user_daily_views;

-- 3.3 每日活跃用户趋势（过去7天）
SELECT 
  date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_views
FROM user_daily_views
WHERE date >= TO_CHAR(NOW() - INTERVAL '7 days', 'YYYY-MM-DD')
GROUP BY date
ORDER BY date DESC;

-- 3.4 用户活跃度排行（Top 20）
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  COUNT(DISTINCT v.id) as view_count,
  COUNT(DISTINCT m.id) as match_count,
  COUNT(DISTINCT f.id) as feedback_count,
  MAX(GREATEST(v.created_at, m.created_at, COALESCE(f.created_at, v.created_at))) as last_active
FROM users u
LEFT JOIN user_daily_views v ON u.id = v.user_id
LEFT JOIN matches m ON u.id = m.user1_id OR u.id = m.user2_id
LEFT JOIN feedbacks f ON u.id = f.user_id
WHERE EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id)
GROUP BY u.id, u.name, u.email
ORDER BY view_count DESC, match_count DESC
LIMIT 20;

-- ==================== 4. 反馈与面试 ====================

-- 4.1 反馈总览
SELECT 
  COUNT(*) as total_feedbacks,
  COUNT(CASE WHEN interview_status = 'yes' THEN 1 END) as interviews_completed,
  COUNT(CASE WHEN interview_status = 'no' THEN 1 END) as interviews_not_completed,
  ROUND(COUNT(CASE WHEN interview_status = 'yes' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as completion_rate
FROM feedbacks;

-- 4.2 反馈率（相对于已接受的匹配）
SELECT 
  (SELECT COUNT(*) FROM matches WHERE status = 'accepted') as accepted_matches,
  COUNT(*) as total_feedbacks,
  ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM matches WHERE status = 'accepted'), 0) * 100, 2) as feedback_rate
FROM feedbacks;

-- 4.3 反馈详情（最近的反馈）
SELECT 
  f.id,
  f.user_id,
  u.name as user_name,
  f.interview_status,
  f.contact_status,
  LEFT(f.content, 100) as content_preview,
  f.created_at
FROM feedbacks f
JOIN users u ON f.user_id = u.id
ORDER BY f.created_at DESC
LIMIT 10;

-- ==================== 5. 内容指标 ====================

-- 5.1 系统题库概览
SELECT 
  COUNT(*) as total_questions,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_questions,
  COUNT(DISTINCT company) as companies_count,
  COUNT(DISTINCT question_type) as question_types
FROM interview_questions;

-- 5.2 题目类型分布
SELECT 
  question_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM interview_questions) * 100, 2) as percentage
FROM interview_questions
GROUP BY question_type
ORDER BY count DESC;

-- 5.3 难度分布
SELECT 
  difficulty,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM interview_questions) * 100, 2) as percentage
FROM interview_questions
GROUP BY difficulty
ORDER BY 
  CASE difficulty
    WHEN 'easy' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'hard' THEN 3
  END;

-- 5.4 公司题目分布（Top 10）
SELECT 
  company,
  COUNT(*) as question_count,
  COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy,
  COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium,
  COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard
FROM interview_questions
GROUP BY company
ORDER BY question_count DESC
LIMIT 10;

-- 5.5 用户发布的题目
SELECT 
  COUNT(*) as user_posts,
  COUNT(DISTINCT user_id) as contributing_users,
  SUM(views_count) as total_views,
  ROUND(AVG(views_count), 2) as avg_views_per_post
FROM user_interview_posts
WHERE status = 'active';

-- 5.6 社区互动统计
SELECT 
  'votes' as metric_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM interview_votes
UNION ALL
SELECT 
  'comments' as metric_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM interview_comments;

-- ==================== 6. 用户转化漏斗 ====================

-- 6.1 完整转化漏斗
WITH funnel_data AS (
  SELECT
    (SELECT COUNT(*) FROM users) as registered,
    (SELECT COUNT(*) FROM user_profiles) as completed_profile,
    (SELECT COUNT(DISTINCT user_id) FROM user_daily_views) as has_views,
    (SELECT COUNT(DISTINCT user1_id) FROM matches UNION SELECT COUNT(DISTINCT user2_id) FROM matches) as has_matches,
    (SELECT COUNT(DISTINCT user1_id) FROM matches WHERE status = 'accepted' 
     UNION SELECT COUNT(DISTINCT user2_id) FROM matches WHERE status = 'accepted') as match_accepted,
    (SELECT COUNT(DISTINCT user_id) FROM feedbacks) as gave_feedback,
    (SELECT COUNT(DISTINCT user_id) FROM feedbacks WHERE interview_status = 'yes') as completed_interview
)
SELECT 
  'Step 1: 注册' as step, registered as count, 100.00 as percentage, 0.00 as drop_rate FROM funnel_data
UNION ALL
SELECT 
  'Step 2: 完成资料' as step, completed_profile, 
  ROUND(completed_profile::numeric / NULLIF(registered, 0) * 100, 2),
  ROUND((1 - completed_profile::numeric / NULLIF(registered, 0)) * 100, 2)
FROM funnel_data
UNION ALL
SELECT 
  'Step 3: 开始浏览' as step, has_views,
  ROUND(has_views::numeric / NULLIF(completed_profile, 0) * 100, 2),
  ROUND((1 - has_views::numeric / NULLIF(completed_profile, 0)) * 100, 2)
FROM funnel_data
UNION ALL
SELECT 
  'Step 4: 发起匹配' as step, has_matches,
  ROUND(has_matches::numeric / NULLIF(has_views, 0) * 100, 2),
  ROUND((1 - has_matches::numeric / NULLIF(has_views, 0)) * 100, 2)
FROM funnel_data
UNION ALL
SELECT 
  'Step 5: 匹配成功' as step, match_accepted,
  ROUND(match_accepted::numeric / NULLIF(has_matches, 0) * 100, 2),
  ROUND((1 - match_accepted::numeric / NULLIF(has_matches, 0)) * 100, 2)
FROM funnel_data
UNION ALL
SELECT 
  'Step 6: 提交反馈' as step, gave_feedback,
  ROUND(gave_feedback::numeric / NULLIF(match_accepted, 0) * 100, 2),
  ROUND((1 - gave_feedback::numeric / NULLIF(match_accepted, 0)) * 100, 2)
FROM funnel_data
UNION ALL
SELECT 
  'Step 7: 完成面试' as step, completed_interview,
  ROUND(completed_interview::numeric / NULLIF(gave_feedback, 0) * 100, 2),
  ROUND((1 - completed_interview::numeric / NULLIF(gave_feedback, 0)) * 100, 2)
FROM funnel_data;

-- ==================== 7. 高价值用户识别 ====================

-- 7.1 潜力用户（有资料、有浏览、但未成功匹配）
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  up.job_type,
  up.experience_level,
  COUNT(DISTINCT v.id) as view_count,
  COUNT(DISTINCT m.id) as match_count,
  MAX(v.created_at) as last_active
FROM users u
JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_daily_views v ON u.id = v.user_id
LEFT JOIN matches m ON (u.id = m.user1_id OR u.id = m.user2_id)
WHERE NOT EXISTS (
  SELECT 1 FROM matches 
  WHERE (user1_id = u.id OR user2_id = u.id) 
  AND status = 'accepted'
)
AND EXISTS (SELECT 1 FROM user_daily_views WHERE user_id = u.id)
AND v.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.name, u.email, up.job_type, up.experience_level
ORDER BY view_count DESC, match_count DESC;

-- 7.2 流失风险用户（有资料但7天未活跃）
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  up.job_type,
  up.experience_level,
  MAX(GREATEST(
    COALESCE(v.created_at, u.created_at),
    COALESCE(m.created_at, u.created_at),
    u.created_at
  )) as last_active,
  EXTRACT(DAY FROM NOW() - MAX(GREATEST(
    COALESCE(v.created_at, u.created_at),
    COALESCE(m.created_at, u.created_at),
    u.created_at
  ))) as days_inactive
FROM users u
JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_daily_views v ON u.id = v.user_id
LEFT JOIN matches m ON (u.id = m.user1_id OR u.id = m.user2_id)
GROUP BY u.id, u.name, u.email, up.job_type, up.experience_level
HAVING MAX(GREATEST(
  COALESCE(v.created_at, u.created_at),
  COALESCE(m.created_at, u.created_at),
  u.created_at
)) < NOW() - INTERVAL '7 days'
ORDER BY days_inactive DESC
LIMIT 20;

-- 7.3 待激活用户（注册但未完成资料）
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as registration_date,
  EXTRACT(DAY FROM NOW() - u.created_at) as days_since_registration
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id)
ORDER BY u.created_at DESC
LIMIT 20;

-- 7.4 超级活跃用户（活跃度最高的用户）
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  COUNT(DISTINCT v.id) as views,
  COUNT(DISTINCT m.id) as matches,
  COUNT(DISTINCT CASE WHEN m.status = 'accepted' THEN m.id END) as accepted_matches,
  COUNT(DISTINCT f.id) as feedbacks,
  (
    COUNT(DISTINCT v.id) * 2 + 
    COUNT(DISTINCT m.id) * 5 + 
    COUNT(DISTINCT CASE WHEN m.status = 'accepted' THEN m.id END) * 15 + 
    COUNT(DISTINCT f.id) * 20
  ) as activity_score
FROM users u
JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_daily_views v ON u.id = v.user_id
LEFT JOIN matches m ON (u.id = m.user1_id OR u.id = m.user2_id)
LEFT JOIN feedbacks f ON u.id = f.user_id
GROUP BY u.id, u.name, u.email
ORDER BY activity_score DESC
LIMIT 20;

-- ==================== 8. 匹配质量分析 ====================

-- 8.1 匹配成功后的联系时间分析
SELECT 
  CASE 
    WHEN contact_updated_at IS NULL THEN '未联系'
    WHEN contact_updated_at - created_at < INTERVAL '1 day' THEN '24小时内'
    WHEN contact_updated_at - created_at < INTERVAL '3 days' THEN '1-3天'
    WHEN contact_updated_at - created_at < INTERVAL '7 days' THEN '3-7天'
    ELSE '7天以上'
  END as contact_timing,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM matches WHERE status = 'accepted') * 100, 2) as percentage
FROM matches
WHERE status = 'accepted'
GROUP BY contact_timing
ORDER BY 
  CASE contact_timing
    WHEN '24小时内' THEN 1
    WHEN '1-3天' THEN 2
    WHEN '3-7天' THEN 3
    WHEN '7天以上' THEN 4
    WHEN '未联系' THEN 5
  END;

-- 8.2 需要发送提醒的匹配（匹配成功但3天未联系）
SELECT 
  m.id as match_id,
  u1.id as user1_id,
  u1.name as user1_name,
  u1.email as user1_email,
  u2.id as user2_id,
  u2.name as user2_name,
  u2.email as user2_email,
  m.created_at as match_date,
  EXTRACT(DAY FROM NOW() - m.created_at) as days_since_match
FROM matches m
JOIN users u1 ON m.user1_id = u1.id
JOIN users u2 ON m.user2_id = u2.id
WHERE m.status = 'accepted'
AND m.contact_status = 'not_contacted'
AND m.created_at < NOW() - INTERVAL '3 days'
AND (m.last_reminder_sent IS NULL OR m.last_reminder_sent < NOW() - INTERVAL '7 days')
ORDER BY m.created_at
LIMIT 50;

-- ==================== 9. 业务健康度指标 ====================

-- 9.1 核心指标仪表板
SELECT 
  -- 用户指标
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_7d,
  (SELECT ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM users) * 100, 2) FROM user_profiles) as profile_completion_rate,
  
  -- 匹配指标
  (SELECT COUNT(*) FROM matches) as total_matches,
  (SELECT ROUND(COUNT(CASE WHEN status = 'accepted' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) FROM matches) as match_success_rate,
  
  -- 活跃度指标
  (SELECT ROUND(COUNT(DISTINCT user_id)::numeric / (SELECT COUNT(*) FROM users) * 100, 2) FROM user_daily_views) as user_activation_rate,
  (SELECT COUNT(DISTINCT user_id) FROM user_daily_views WHERE created_at >= NOW() - INTERVAL '7 days') as dau_7d,
  
  -- 转化指标
  (SELECT ROUND(COUNT(CASE WHEN contact_status IN ('contacted', 'scheduled', 'completed') THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) 
   FROM matches WHERE status = 'accepted') as contact_conversion_rate,
  
  -- 反馈指标
  (SELECT COUNT(*) FROM feedbacks) as total_feedbacks,
  (SELECT ROUND(COUNT(CASE WHEN interview_status = 'yes' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) FROM feedbacks) as interview_completion_rate;

-- ==================== 10. 增长趋势分析 ====================

-- 10.1 每日用户注册趋势（过去30天）
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_users
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 10.2 每周匹配趋势（过去8周）
SELECT 
  DATE_TRUNC('week', created_at) as week_start,
  COUNT(*) as total_matches,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_matches,
  ROUND(COUNT(CASE WHEN status = 'accepted' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as success_rate
FROM matches
WHERE created_at >= NOW() - INTERVAL '56 days'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- ==========================================
-- 使用说明：
-- 1. 这些查询可以直接在 Neon Dashboard 的 SQL Editor 中执行
-- 2. 根据需要选择单个查询或多个查询组合执行
-- 3. 可以修改时间范围（如 INTERVAL '7 days'）来调整分析周期
-- 4. 结果可以导出为 CSV 进行进一步分析
-- ==========================================

