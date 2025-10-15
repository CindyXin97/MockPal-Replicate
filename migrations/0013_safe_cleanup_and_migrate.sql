-- 安全的数据库迁移脚本
-- 此脚本会：
-- 1. 合并重复记录的数据（保留所有信息）
-- 2. 删除重复记录
-- 3. 添加唯一约束
-- 4. 创建历史表

BEGIN;

-- ========================================
-- 第一步：安全合并重复数据
-- ========================================

-- 创建临时表存储要合并的数据
CREATE TEMP TABLE duplicate_users AS
SELECT user_id, COUNT(*) as count
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 对每个有重复的用户，合并数据到最新记录
DO $$
DECLARE
  dup_record RECORD;
  latest_record RECORD;
  old_records RECORD;
BEGIN
  -- 遍历每个有重复的用户
  FOR dup_record IN SELECT user_id FROM duplicate_users LOOP
    
    -- 获取最新的记录
    SELECT * INTO latest_record
    FROM user_profiles
    WHERE user_id = dup_record.user_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- 从旧记录中提取缺失的信息（如果最新记录某个字段为空，用旧记录的值）
    FOR old_records IN 
      SELECT * FROM user_profiles
      WHERE user_id = dup_record.user_id
        AND id != latest_record.id
      ORDER BY updated_at DESC
    LOOP
      -- 合并字段：如果最新记录为空，使用旧记录的值
      UPDATE user_profiles
      SET
        job_type = COALESCE(NULLIF(job_type, ''), old_records.job_type),
        experience_level = COALESCE(NULLIF(experience_level, ''), old_records.experience_level),
        target_company = COALESCE(target_company, old_records.target_company),
        target_industry = COALESCE(target_industry, old_records.target_industry),
        other_company_name = COALESCE(other_company_name, old_records.other_company_name),
        technical_interview = COALESCE(technical_interview, old_records.technical_interview),
        behavioral_interview = COALESCE(behavioral_interview, old_records.behavioral_interview),
        case_analysis = COALESCE(case_analysis, old_records.case_analysis),
        stats_questions = COALESCE(stats_questions, old_records.stats_questions),
        email = COALESCE(email, old_records.email),
        wechat = COALESCE(wechat, old_records.wechat),
        linkedin = COALESCE(linkedin, old_records.linkedin),
        bio = COALESCE(bio, old_records.bio),
        school = COALESCE(NULLIF(school, ''), old_records.school)
      WHERE id = latest_record.id;
      
    END LOOP;
    
    RAISE NOTICE '已合并 user_id % 的数据', dup_record.user_id;
    
  END LOOP;
END $$;

-- ========================================
-- 第二步：删除重复记录（保留最新的）
-- ========================================

DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, updated_at DESC
);

-- 验证没有重复
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id
    FROM user_profiles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION '仍然存在 % 个重复的 user_id', duplicate_count;
  ELSE
    RAISE NOTICE '✅ 所有重复记录已清理';
  END IF;
END $$;

-- ========================================
-- 第三步：添加唯一约束
-- ========================================

-- 检查约束是否已存在
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_user_id_unique'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
        
        RAISE NOTICE '✅ 已添加唯一约束: user_profiles_user_id_unique';
    ELSE
        RAISE NOTICE '⚠️  唯一约束已存在，跳过';
    END IF;
END $$;

-- ========================================
-- 第四步：创建历史表
-- ========================================

CREATE TABLE IF NOT EXISTS user_profile_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- 完整的资料快照
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
  
  -- 变更元数据
  change_type VARCHAR(20) DEFAULT 'update',
  changed_fields TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profile_history_user_id 
  ON user_profile_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_history_created_at 
  ON user_profile_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_history_user_created 
  ON user_profile_history(user_id, created_at DESC);

RAISE NOTICE '✅ user_profile_history 表已创建';

-- ========================================
-- 第五步：为所有现有用户创建初始历史记录
-- ========================================

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
WHERE NOT EXISTS (
  SELECT 1 FROM user_profile_history 
  WHERE user_profile_history.user_id = user_profiles.user_id
);

RAISE NOTICE '✅ 已为现有用户创建初始历史记录';

-- ========================================
-- 验证和总结
-- ========================================

DO $$
DECLARE
  profile_count INTEGER;
  user_count INTEGER;
  history_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  SELECT COUNT(DISTINCT user_id) INTO user_count FROM user_profiles;
  SELECT COUNT(*) INTO history_count FROM user_profile_history;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '迁移完成总结';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'user_profiles 表记录数: %', profile_count;
  RAISE NOTICE '唯一用户数: %', user_count;
  RAISE NOTICE 'user_profile_history 表记录数: %', history_count;
  RAISE NOTICE '';
  
  IF profile_count = user_count THEN
    RAISE NOTICE '✅ 每个用户只有一条 profile 记录';
  ELSE
    RAISE WARNING '⚠️  profile 记录数与用户数不匹配！';
  END IF;
END $$;

COMMIT;

-- 如果遇到任何错误，上面的 COMMIT 不会执行，所有更改会自动回滚
RAISE NOTICE '';
RAISE NOTICE '✅✅✅ 迁移成功完成！✅✅✅';
RAISE NOTICE '';

