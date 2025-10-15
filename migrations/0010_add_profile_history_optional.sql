-- 可选：添加用户资料修改历史表（如果需要追踪历史）
-- 这个表是可选的，只在需要审计追踪时才需要创建

CREATE TABLE IF NOT EXISTS user_profile_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  profile_id INTEGER REFERENCES user_profiles(id),
  
  -- 记录修改的字段
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  -- 修改信息
  changed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  change_type VARCHAR(20) DEFAULT 'update' -- 'create', 'update', 'delete'
);

-- 创建索引提高查询效率
CREATE INDEX idx_profile_history_user_id ON user_profile_history(user_id);
CREATE INDEX idx_profile_history_changed_at ON user_profile_history(changed_at);

-- 示例：如何查询某个用户的修改历史
-- SELECT * FROM user_profile_history WHERE user_id = 1 ORDER BY changed_at DESC;

-- 示例：如何查询某个字段的修改历史
-- SELECT * FROM user_profile_history 
-- WHERE user_id = 1 AND field_name = 'experience_level' 
-- ORDER BY changed_at DESC;

