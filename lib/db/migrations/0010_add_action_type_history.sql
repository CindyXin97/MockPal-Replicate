-- 添加 action_type 字段以记录用户的实际操作
-- 这样可以保留所有历史记录而不修改旧数据

-- 1. 添加 action_type 字段
ALTER TABLE matches ADD COLUMN IF NOT EXISTS action_type VARCHAR(20);

-- 2. 填充历史数据的 action_type
UPDATE matches SET action_type = 
  CASE 
    WHEN status = 'pending' THEN 'like'
    WHEN status = 'rejected' THEN 'dislike'
    WHEN status = 'accepted' THEN 'like'
    ELSE 'like' -- 默认为 like
  END
WHERE action_type IS NULL;

-- 3. 移除 UNIQUE 约束（允许相同方向的多条记录以记录历史）
-- 注意：这个约束名可能因数据库而异
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user1_id_user2_id_key;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user1_id_user2_id_unique;

-- 4. 添加索引以优化查询性能
-- 查询某两个用户之间的所有历史记录
CREATE INDEX IF NOT EXISTS idx_matches_users_action ON matches(user1_id, user2_id, action_type);

-- 按时间倒序查询（用于找最新记录）
CREATE INDEX IF NOT EXISTS idx_matches_created_desc ON matches(created_at DESC);

-- 查询用户的所有操作历史
CREATE INDEX IF NOT EXISTS idx_matches_user1_created ON matches(user1_id, created_at DESC);

-- 查询特定状态的记录（如 accepted）
CREATE INDEX IF NOT EXISTS idx_matches_status_users ON matches(status, user1_id, user2_id);

-- 5. 添加注释
COMMENT ON COLUMN matches.action_type IS '用户的实际操作: like, dislike, cancel';
COMMENT ON COLUMN matches.status IS '匹配状态: pending(等待), accepted(成功), rejected(拒绝)';

