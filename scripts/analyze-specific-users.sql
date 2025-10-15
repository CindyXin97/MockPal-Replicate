-- 分析特定用户的详细匹配情况

-- ========================================
-- 查看 user_5 (Corey) 的详细操作
-- ========================================
SELECT 
  'User 5 (Corey)' as user,
  m.id as match_id,
  m.user2_id as target_user,
  u2.name as target_name,
  p2.experience_level as target_exp,
  p2.job_type as target_job,
  m.action_type as my_action,
  m.status,
  m.created_at,
  -- 对方是否回应
  (SELECT action_type FROM matches m2 
   WHERE m2.user1_id = m.user2_id AND m2.user2_id = m.user1_id 
   ORDER BY created_at DESC LIMIT 1) as their_action
FROM matches m
JOIN users u2 ON m.user2_id = u2.id
JOIN user_profiles p2 ON u2.id = p2.user_id
WHERE m.user1_id = 5
ORDER BY m.created_at DESC;

-- ========================================
-- 查看 user_3 (Jasmine) 的详细操作
-- ========================================
SELECT 
  'User 3 (Jasmine)' as user,
  m.id as match_id,
  m.user2_id as target_user,
  u2.name as target_name,
  p2.experience_level as target_exp,
  p2.job_type as target_job,
  m.action_type as my_action,
  m.status,
  m.created_at,
  (SELECT action_type FROM matches m2 
   WHERE m2.user1_id = m.user2_id AND m2.user2_id = m.user1_id 
   ORDER BY created_at DESC LIMIT 1) as their_action
FROM matches m
JOIN users u2 ON m.user2_id = u2.id
JOIN user_profiles p2 ON u2.id = p2.user_id
WHERE m.user1_id = 3
ORDER BY m.created_at DESC;

-- ========================================
-- 查看 user_19 (Hannah) 的详细操作
-- ========================================
SELECT 
  'User 19 (Hannah)' as user,
  m.id as match_id,
  m.user2_id as target_user,
  u2.name as target_name,
  p2.experience_level as target_exp,
  p2.job_type as target_job,
  m.action_type as my_action,
  m.status,
  m.created_at,
  (SELECT action_type FROM matches m2 
   WHERE m2.user1_id = m.user2_id AND m2.user2_id = m.user1_id 
   ORDER BY created_at DESC LIMIT 1) as their_action
FROM matches m
JOIN users u2 ON m.user2_id = u2.id
JOIN user_profiles p2 ON u2.id = p2.user_id
WHERE m.user1_id = 19
ORDER BY m.created_at DESC;

-- ========================================
-- 检查是否有人 like 了这些用户但他们没回应
-- ========================================
SELECT 
  m.user1_id as who_liked,
  u1.name as liker_name,
  m.user2_id as target_user,
  u2.name as target_name,
  m.action_type,
  m.status,
  m.created_at,
  -- 目标用户是否回应
  (SELECT action_type FROM matches m2 
   WHERE m2.user1_id = m.user2_id AND m2.user2_id = m.user1_id 
   ORDER BY created_at DESC LIMIT 1) as target_response
FROM matches m
JOIN users u1 ON m.user1_id = u1.id
JOIN users u2 ON m.user2_id = u2.id
WHERE m.user2_id IN (3, 5, 8, 19, 20)
  AND m.action_type = 'like'
  AND m.status = 'pending'
ORDER BY m.user2_id, m.created_at DESC;

-- ========================================
-- 分析：这些用户收到了多少 like
-- ========================================
SELECT 
  u.id as user_id,
  u.name,
  p.experience_level,
  p.job_type,
  COUNT(CASE WHEN m.action_type = 'like' THEN 1 END) as received_likes,
  COUNT(CASE WHEN m.action_type = 'like' AND m.status = 'pending' THEN 1 END) as pending_likes
FROM users u
JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN matches m ON m.user2_id = u.id
WHERE u.id IN (3, 5, 8, 19, 20)
GROUP BY u.id, u.name, p.experience_level, p.job_type
ORDER BY u.id;

