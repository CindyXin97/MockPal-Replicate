-- ========================================
-- 分步迁移脚本 - 请按顺序执行每个步骤
-- 每个步骤独立，可以单独运行
-- ========================================

-- ========================================
-- 步骤 1: 检查当前状态
-- ========================================
-- 复制并执行此查询，查看当前是否有重复数据

SELECT 
  '当前状态检查' as step,
  (SELECT COUNT(*) FROM user_profiles) as total_profiles,
  (SELECT COUNT(DISTINCT user_id) FROM user_profiles) as unique_users,
  (SELECT COUNT(*) FROM (
    SELECT user_id FROM user_profiles 
    GROUP BY user_id HAVING COUNT(*) > 1
  ) dup) as duplicate_user_count;

-- 查看具体哪些用户有重复
SELECT user_id, COUNT(*) as count, 
       ARRAY_AGG(id ORDER BY updated_at DESC) as profile_ids,
       ARRAY_AGG(updated_at ORDER BY updated_at DESC) as update_times
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- ========================================
-- 步骤 2: 清理重复数据（如果有）
-- ========================================
-- 只有在步骤1显示有重复时才需要执行

-- 保留每个用户最新的记录
DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, updated_at DESC
);

-- 验证清理结果
SELECT '清理后检查' as step,
       COUNT(*) as remaining_profiles,
       COUNT(DISTINCT user_id) as unique_users
FROM user_profiles;

-- ========================================
-- 步骤 3: 添加唯一约束
-- ========================================
-- 确保步骤2完成后再执行

-- 先检查约束是否已存在
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
  AND conname = 'user_profiles_user_id_unique';

-- 如果上面的查询返回空，则添加约束
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);

-- 验证约束已添加
SELECT '约束添加后检查' as step,
       conname, contype
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
  AND conname = 'user_profiles_user_id_unique';

-- ========================================
-- 步骤 4: 创建历史表
-- ========================================

-- 检查表是否已存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public'
    AND table_name = 'user_profile_history'
) as history_table_exists;

-- 如果上面返回 false，则创建表
CREATE TABLE IF NOT EXISTS user_profile_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  job_type VARCHAR(50),
  experience_level VARCHAR(50),
  target_company VARCHAR(255),
  target_industry VARCHAR(255),
  other_company_name VARCHAR(255),
  technical_interview BOOLEAN,
  behavioral_interview BOOLEAN,
  case_analysis BOOLEAN,
  stats_questions BOOLEAN,
  email VARCHAR(255),
  wechat VARCHAR(255),
  linkedin VARCHAR(255),
  bio VARCHAR(255),
  school VARCHAR(255),
  
  change_type VARCHAR(20) DEFAULT 'update',
  changed_fields TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 验证表已创建
SELECT '历史表创建后检查' as step,
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_name = 'user_profile_history'
       ) as table_exists;

-- ========================================
-- 步骤 5: 创建索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profile_history_user_id 
  ON user_profile_history(user_id);

CREATE INDEX IF NOT EXISTS idx_profile_history_created_at 
  ON user_profile_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_history_user_created 
  ON user_profile_history(user_id, created_at DESC);

-- 验证索引已创建
SELECT '索引创建后检查' as step,
       indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_profile_history';

-- ========================================
-- 步骤 6: 为现有用户创建初始历史记录
-- ========================================

-- 检查是否已有历史记录
SELECT '历史记录数量' as step,
       COUNT(*) as existing_history_count
FROM user_profile_history;

-- 为没有历史记录的用户创建初始记录
INSERT INTO user_profile_history (
  user_id, profile_id, job_type, experience_level, target_company,
  target_industry, other_company_name, technical_interview,
  behavioral_interview, case_analysis, stats_questions, email,
  wechat, linkedin, bio, school, change_type, created_at
)
SELECT 
  user_id, id, job_type, experience_level, target_company,
  target_industry, other_company_name, technical_interview,
  behavioral_interview, case_analysis, stats_questions, email,
  wechat, linkedin, bio, school, 'create', created_at
FROM user_profiles
WHERE user_id NOT IN (
  SELECT DISTINCT user_id FROM user_profile_history
);

-- 最终验证
SELECT '最终状态' as step,
       (SELECT COUNT(*) FROM user_profiles) as total_profiles,
       (SELECT COUNT(DISTINCT user_id) FROM user_profiles) as unique_users,
       (SELECT COUNT(*) FROM user_profile_history) as history_records;

-- ========================================
-- 完成！
-- ========================================

