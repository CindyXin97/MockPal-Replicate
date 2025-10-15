-- 查找有滑动操作但还没有匹配成功的用户

-- ========================================
-- 方式 1: 简单查询 - 找出所有没有成功匹配的活跃用户
-- ========================================

SELECT 
  u.id as user_id,
  u.email,
  u.name,
  p.experience_level,
  p.job_type,
  p.target_company,
  -- 统计该用户的操作
  (SELECT COUNT(*) FROM matches WHERE user1_id = u.id) as total_actions,
  (SELECT COUNT(*) FROM matches WHERE user1_id = u.id AND action_type = 'like') as like_count,
  (SELECT COUNT(*) FROM matches WHERE user1_id = u.id AND action_type = 'dislike') as dislike_count,
  (SELECT COUNT(*) FROM matches 
   WHERE (user1_id = u.id OR user2_id = u.id) 
   AND status = 'accepted') as successful_matches
FROM users u
JOIN user_profiles p ON u.id = p.user_id
WHERE EXISTS (
  -- 有过操作
  SELECT 1 FROM matches WHERE user1_id = u.id
)
AND NOT EXISTS (
  -- 但没有成功的匹配
  SELECT 1 FROM matches 
  WHERE (user1_id = u.id OR user2_id = u.id) 
  AND status = 'accepted'
)
ORDER BY total_actions DESC;

-- ========================================
-- 方式 2: 详细分析 - 显示每个用户的详细状态
-- ========================================

WITH user_stats AS (
  SELECT 
    u.id as user_id,
    u.email,
    u.name,
    p.experience_level,
    p.job_type,
    -- 作为 user1 的操作（我发出的）
    COUNT(CASE WHEN m.user1_id = u.id THEN 1 END) as my_actions,
    COUNT(CASE WHEN m.user1_id = u.id AND m.action_type = 'like' THEN 1 END) as my_likes,
    COUNT(CASE WHEN m.user1_id = u.id AND m.action_type = 'dislike' THEN 1 END) as my_dislikes,
    -- 作为 user2 的操作（别人对我的）
    COUNT(CASE WHEN m.user2_id = u.id THEN 1 END) as received_actions,
    COUNT(CASE WHEN m.user2_id = u.id AND m.action_type = 'like' THEN 1 END) as received_likes,
    -- 成功的匹配
    COUNT(CASE WHEN (m.user1_id = u.id OR m.user2_id = u.id) AND m.status = 'accepted' THEN 1 END) as matches,
    -- 待回应的邀请（别人 like 了我）
    COUNT(CASE WHEN m.user2_id = u.id AND m.action_type = 'like' AND m.status = 'pending' THEN 1 END) as pending_invitations
  FROM users u
  JOIN user_profiles p ON u.id = p.user_id
  LEFT JOIN matches m ON m.user1_id = u.id OR m.user2_id = u.id
  GROUP BY u.id, u.email, u.name, p.experience_level, p.job_type
)
SELECT 
  user_id,
  email,
  name,
  experience_level,
  job_type,
  my_actions as "我的操作次数",
  my_likes as "我发出的like",
  my_dislikes as "我发出的dislike",
  received_likes as "收到的like",
  pending_invitations as "待回应邀请",
  matches as "成功匹配数"
FROM user_stats
WHERE my_actions > 0  -- 有过操作
  AND matches = 0     -- 但没有成功匹配
ORDER BY my_actions DESC, received_likes DESC;

-- ========================================
-- 方式 3: 找出最有可能匹配的用户对
-- ========================================

-- 找出互相 like 但还没匹配成功的用户对
WITH mutual_likes AS (
  SELECT 
    m1.user1_id as user_a,
    m1.user2_id as user_b,
    m1.created_at as a_liked_at,
    m2.created_at as b_liked_at
  FROM matches m1
  JOIN matches m2 
    ON m1.user1_id = m2.user2_id 
    AND m1.user2_id = m2.user1_id
  WHERE m1.action_type = 'like'
    AND m2.action_type = 'like'
    AND m1.status != 'accepted'
    AND m2.status != 'accepted'
)
SELECT 
  ml.user_a,
  ua.email as user_a_email,
  ua.name as user_a_name,
  ml.user_b,
  ub.email as user_b_email,
  ub.name as user_b_name,
  ml.a_liked_at,
  ml.b_liked_at,
  '❗应该匹配成功但没有' as note
FROM mutual_likes ml
JOIN users ua ON ml.user_a = ua.id
JOIN users ub ON ml.user_b = ub.id
ORDER BY ml.a_liked_at DESC;

-- ========================================
-- 方式 4: 按用户分组显示详细操作历史
-- ========================================

-- 输入一个 user_id 查看详细情况
-- 请将 <user_id> 替换为具体的用户 ID

-- SELECT 
--   m.id as match_id,
--   m.user1_id as "我",
--   m.user2_id as "对方",
--   u2.name as "对方名字",
--   m.action_type as "我的操作",
--   m.status as "状态",
--   m.created_at as "操作时间",
--   -- 查看对方是否也 like 了我
--   (SELECT action_type 
--    FROM matches m2 
--    WHERE m2.user1_id = m.user2_id 
--      AND m2.user2_id = m.user1_id
--    ORDER BY created_at DESC 
--    LIMIT 1) as "对方的操作"
-- FROM matches m
-- JOIN users u2 ON m.user2_id = u2.id
-- WHERE m.user1_id = <user_id>
-- ORDER BY m.created_at DESC;

-- ========================================
-- 方式 5: 总体统计
-- ========================================

SELECT 
  '总用户数' as metric,
  COUNT(*)::text as value
FROM users
WHERE EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id)

UNION ALL

SELECT 
  '有操作的用户数',
  COUNT(DISTINCT user1_id)::text
FROM matches

UNION ALL

SELECT 
  '有成功匹配的用户数',
  COUNT(DISTINCT user_id)::text
FROM (
  SELECT user1_id as user_id FROM matches WHERE status = 'accepted'
  UNION
  SELECT user2_id as user_id FROM matches WHERE status = 'accepted'
) matched_users

UNION ALL

SELECT 
  '有操作但没匹配的用户数',
  COUNT(*)::text
FROM (
  SELECT DISTINCT u.id
  FROM users u
  WHERE EXISTS (SELECT 1 FROM matches WHERE user1_id = u.id)
    AND NOT EXISTS (
      SELECT 1 FROM matches 
      WHERE (user1_id = u.id OR user2_id = u.id) 
      AND status = 'accepted'
    )
) unmatched_users

UNION ALL

SELECT 
  '总操作数',
  COUNT(*)::text
FROM matches

UNION ALL

SELECT 
  '成功匹配数',
  COUNT(*)::text / 2  -- 除以2因为每个匹配会产生2条记录
FROM matches
WHERE status = 'accepted';

