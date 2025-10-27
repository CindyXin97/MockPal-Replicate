-- 创建用户资料历史表，记录所有修改
-- 这个表保存用户资料的完整修改历史

CREATE TABLE IF NOT EXISTS user_profile_history (
  id SERIAL PRIMARY KEY,
  
  -- 关联信息
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- 完整的资料快照（每次修改都保存完整状态）
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
  bio VARCHAR(1000),
  school VARCHAR(255),
  
  -- 变更元数据
  change_type VARCHAR(20) DEFAULT 'update', -- 'create', 'update', 'delete'
  changed_fields TEXT[], -- 记录哪些字段被修改了
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建索引提高查询效率
CREATE INDEX IF NOT EXISTS idx_profile_history_user_id ON user_profile_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_history_created_at ON user_profile_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_history_user_created ON user_profile_history(user_id, created_at DESC);

-- 添加注释
COMMENT ON TABLE user_profile_history IS '用户资料修改历史表，记录每次修改的完整快照';
COMMENT ON COLUMN user_profile_history.change_type IS '变更类型: create(创建), update(更新), delete(删除)';
COMMENT ON COLUMN user_profile_history.changed_fields IS '本次修改的字段列表';

-- 示例查询
-- 查看用户的修改历史:
-- SELECT * FROM user_profile_history WHERE user_id = 1 ORDER BY created_at DESC;

-- 查看某个字段的变化历史:
-- SELECT created_at, experience_level, change_type 
-- FROM user_profile_history 
-- WHERE user_id = 1 AND 'experience_level' = ANY(changed_fields)
-- ORDER BY created_at DESC;

-- 统计用户修改次数:
-- SELECT user_id, COUNT(*) as modification_count
-- FROM user_profile_history
-- GROUP BY user_id
-- ORDER BY modification_count DESC;

