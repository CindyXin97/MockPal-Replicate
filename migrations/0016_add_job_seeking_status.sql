-- 添加求职状态字段到 user_profiles 表
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS job_seeking_status VARCHAR(50);

-- 添加求职状态字段到 user_profile_history 表
ALTER TABLE user_profile_history 
ADD COLUMN IF NOT EXISTS job_seeking_status VARCHAR(50);

-- 为新字段添加索引（可选，但对查询有帮助）
CREATE INDEX IF NOT EXISTS idx_user_profiles_job_seeking_status 
ON user_profiles(job_seeking_status);

