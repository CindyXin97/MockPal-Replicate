# 查找有操作但没匹配的用户

## 🎯 快速查询

在 Neon Console SQL Editor 中执行以下查询：

### 查询 1: 找出所有有操作但没匹配的用户

```sql
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  p.experience_level,
  p.job_type,
  p.target_company,
  -- 该用户的操作统计
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
```

---

### 查询 2: 详细分析（包含收到的 like）

```sql
WITH user_stats AS (
  SELECT 
    u.id as user_id,
    u.email,
    u.name,
    p.experience_level,
    p.job_type,
    p.target_company,
    -- 我发出的操作
    COUNT(CASE WHEN m.user1_id = u.id THEN 1 END) as my_actions,
    COUNT(CASE WHEN m.user1_id = u.id AND m.action_type = 'like' THEN 1 END) as my_likes,
    COUNT(CASE WHEN m.user1_id = u.id AND m.action_type = 'dislike' THEN 1 END) as my_dislikes,
    -- 收到的操作
    COUNT(CASE WHEN m.user2_id = u.id AND m.action_type = 'like' THEN 1 END) as received_likes,
    -- 待回应的邀请
    COUNT(CASE WHEN m.user2_id = u.id AND m.action_type = 'like' AND m.status = 'pending' THEN 1 END) as pending_invitations,
    -- 成功的匹配
    COUNT(CASE WHEN (m.user1_id = u.id OR m.user2_id = u.id) AND m.status = 'accepted' THEN 1 END) as matches
  FROM users u
  JOIN user_profiles p ON u.id = p.user_id
  LEFT JOIN matches m ON m.user1_id = u.id OR m.user2_id = u.id
  GROUP BY u.id, u.email, u.name, p.experience_level, p.job_type, p.target_company
)
SELECT 
  user_id,
  email,
  name,
  experience_level,
  job_type,
  target_company,
  my_actions as "我的操作",
  my_likes as "我like了",
  my_dislikes as "我dislike了",
  received_likes as "收到like",
  pending_invitations as "待回应",
  matches as "成功匹配"
FROM user_stats
WHERE my_actions > 0  -- 有过操作
  AND matches = 0     -- 但没有成功匹配
ORDER BY my_actions DESC, received_likes DESC;
```

---

### 查询 3: 总体统计

```sql
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
) unmatched_users;
```

---

### 查询 4: 找出互相 like 但没匹配的（可能是 bug）

```sql
SELECT 
  m1.user1_id as user_a,
  ua.name as user_a_name,
  m1.user2_id as user_b,
  ub.name as user_b_name,
  m1.created_at as a_liked_at,
  m2.created_at as b_liked_at,
  m1.status as a_status,
  m2.status as b_status
FROM matches m1
JOIN matches m2 
  ON m1.user1_id = m2.user2_id 
  AND m1.user2_id = m2.user1_id
JOIN users ua ON m1.user1_id = ua.id
JOIN users ub ON m1.user2_id = ub.id
WHERE m1.action_type = 'like'
  AND m2.action_type = 'like'
  AND (m1.status != 'accepted' OR m2.status != 'accepted')
ORDER BY m1.created_at DESC;
```

---

### 查询 5: 查看某个特定用户的详细情况

```sql
-- 替换 <user_id> 为具体的用户 ID
SELECT 
  m.id as match_id,
  m.user1_id as "我",
  m.user2_id as "对方",
  u2.name as "对方名字",
  p2.experience_level as "对方经验",
  p2.job_type as "对方岗位",
  m.action_type as "我的操作",
  m.status as "状态",
  m.created_at as "操作时间",
  -- 查看对方是否也操作了我
  (SELECT action_type 
   FROM matches m2 
   WHERE m2.user1_id = m.user2_id 
     AND m2.user2_id = m.user1_id
   ORDER BY created_at DESC 
   LIMIT 1) as "对方的操作"
FROM matches m
JOIN users u2 ON m.user2_id = u2.id
LEFT JOIN user_profiles p2 ON u2.id = p2.user_id
WHERE m.user1_id = <user_id>
ORDER BY m.created_at DESC;
```

---

## 📊 结果解读

### 查询 1 & 2 结果示例

| user_id | email | name | 我的操作 | 我like了 | 收到like | 成功匹配 |
|---------|-------|------|---------|---------|---------|---------|
| 5 | user5@example.com | Alice | 8 | 5 | 2 | 0 |
| 7 | user7@example.com | Bob | 6 | 4 | 3 | 0 |
| 3 | user3@example.com | Carol | 4 | 2 | 1 | 0 |

**解读：**
- **Alice**: 操作了8次，like了5个人，收到2个like，但都没匹配成功
- **Bob**: 操作了6次，like了4个人，收到3个like，但都没匹配成功
- **Carol**: 操作了4次，like了2个人，收到1个like，没有匹配成功

**可能原因：**
1. 用户 like 的人没有 like 回来
2. 用户收到的 like 没有回应
3. 用户主要在 dislike

---

## 🔍 进一步分析

### 如果发现某个用户有很多操作但没匹配

1. **使用查询 5** 查看该用户的详细操作历史
2. **检查是否有待回应的邀请**（收到like但没回应）
3. **查看匹配质量** - 是否推荐的候选人不匹配？

### 如果发现互相 like 但没匹配（查询 4 有结果）

这可能是系统 bug，需要检查：
- 匹配逻辑是否正确执行
- 是否有并发问题
- 状态更新是否正确

---

## 💡 改进建议

基于查询结果，可以：

1. **如果很多用户有操作但没匹配**
   - 检查匹配算法是否过于严格
   - 增加候选用户池
   - 优化推荐质量

2. **如果用户收到 like 但不回应**
   - 添加提醒功能
   - 优化 UI 让用户更容易看到收到的 like

3. **如果用户主要在 dislike**
   - 改进匹配算法
   - 提供更精准的推荐

---

## 🚀 快速检查

在 Neon Console 执行**查询 3**，快速了解整体情况：

```
总用户数: 12
有操作的用户数: 8
有成功匹配的用户数: 4
有操作但没匹配的用户数: 4
```

然后执行**查询 2**，查看具体是哪些用户！

