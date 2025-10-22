-- ==========================================
-- 立即需要联系的用户清单
-- 用于发送提醒邮件
-- ==========================================

-- 1. 需要发送提醒的匹配（已接受但未联系）
-- ==========================================

SELECT 
  m.id as match_id,
  u1.id as user1_id,
  u1.name as user1_name,
  u1.email as user1_email,
  up1.wechat as user1_wechat,
  up1.linkedin as user1_linkedin,
  u2.id as user2_id,
  u2.name as user2_name,
  u2.email as user2_email,
  up2.wechat as user2_wechat,
  up2.linkedin as user2_linkedin,
  m.created_at as match_date,
  EXTRACT(DAY FROM NOW() - m.created_at) as days_since_match
FROM matches m
JOIN users u1 ON m.user1_id = u1.id
JOIN users u2 ON m.user2_id = u2.id
LEFT JOIN user_profiles up1 ON u1.id = up1.user_id
LEFT JOIN user_profiles up2 ON u2.id = up2.user_id
WHERE m.status = 'accepted'
AND m.contact_status = 'not_contacted'
ORDER BY m.created_at
LIMIT 50;

-- 导出为CSV后可以用于批量发送邮件


-- 2. 未完成资料的用户（需要激活）
-- ==========================================

SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.created_at as registration_date,
  EXTRACT(DAY FROM NOW() - u.created_at) as days_since_registration
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id)
ORDER BY u.created_at DESC;


-- 3. 流失风险用户（7天未活跃）
-- ==========================================

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
ORDER BY days_inactive DESC;


-- 4. 超级用户（Top 10，适合邀请成为大使）
-- ==========================================

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
LIMIT 10;


-- 5. 潜力用户（有浏览、有匹配，但未成功）
-- ==========================================

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


-- ==========================================
-- 使用方法：
-- 1. 在 Neon Dashboard 的 SQL Editor 中执行
-- 2. 点击 "Export" 导出为 CSV
-- 3. 用于批量发送邮件或导入邮件营销工具
-- ==========================================

-- 邮件发送优先级：
-- 第1优先级: 查询1（已匹配未联系）- 最紧急
-- 第2优先级: 查询3（流失风险用户）- 召回
-- 第3优先级: 查询2（未完成资料）- 激活
-- 第4优先级: 查询4（超级用户）- 大使邀请
-- 第5优先级: 查询5（潜力用户）- 个性化推荐

