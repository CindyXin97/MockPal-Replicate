-- =====================================================
-- 用户通知和统计系统
-- 创建时间: 2025-10-23
-- =====================================================

-- 1. 创建用户通知表
CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 通知类型
  type VARCHAR(50) NOT NULL,
  -- 可选值:
  --   'comment_reply' - 评论被回复
  --   'comment_mention' - 被@提到
  --   'post_comment' - 我的题目有新评论
  --   'vote_up' - 被点赞
  --   'match_success' - 匹配成功
  --   'interview_complete' - 匹配的人完成了面试
  
  -- 触发者信息
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255), -- 冗余存储，防止用户被删除
  
  -- 关联内容
  post_type VARCHAR(20), -- 'system' or 'user'
  post_id INTEGER,
  comment_id INTEGER REFERENCES interview_comments(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  
  -- 通知内容
  title VARCHAR(255) NOT NULL,
  content TEXT, -- 预览内容（前100字）
  link TEXT, -- 跳转链接
  
  -- 状态
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- 创建索引优化查询性能
CREATE INDEX idx_user_notifications_user_unread ON user_notifications(user_id, is_read, created_at DESC)
  WHERE is_deleted = FALSE;
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX idx_user_notifications_type ON user_notifications(type);

-- 2. 扩展用户成就表，添加统计字段
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS 
  total_views INTEGER DEFAULT 0; -- 总浏览人数（去重）

ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS 
  total_matches INTEGER DEFAULT 0; -- 总匹配数（包括pending）

ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS 
  successful_matches INTEGER DEFAULT 0; -- 匹配成功数（accepted）

ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS 
  posts_count INTEGER DEFAULT 0; -- 发布的题目数

ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS 
  comments_count INTEGER DEFAULT 0; -- 评论数

ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS 
  votes_given INTEGER DEFAULT 0; -- 点赞数

-- 3. 创建用户通知设置表
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- 站内通知开关
  notify_comment_reply BOOLEAN DEFAULT TRUE,
  notify_mention BOOLEAN DEFAULT TRUE,
  notify_post_comment BOOLEAN DEFAULT TRUE,
  notify_vote BOOLEAN DEFAULT FALSE, -- 点赞通知默认关闭（太频繁）
  notify_match BOOLEAN DEFAULT TRUE,
  
  -- 邮件通知开关
  email_digest_enabled BOOLEAN DEFAULT TRUE,
  email_digest_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'never'
  last_digest_sent TIMESTAMP, -- 上次发送摘要时间
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 为所有现有用户创建默认通知设置
INSERT INTO user_notification_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_notification_settings)
ON CONFLICT (user_id) DO NOTHING;

-- 4. 添加注释
COMMENT ON TABLE user_notifications IS '用户通知表 - 存储站内通知';
COMMENT ON TABLE user_notification_settings IS '用户通知设置表 - 控制通知偏好';
COMMENT ON COLUMN user_achievements.total_views IS '总浏览人数（去重）';
COMMENT ON COLUMN user_achievements.successful_matches IS '匹配成功数（accepted状态）';
COMMENT ON COLUMN user_achievements.posts_count IS '用户发布的题目数量';
COMMENT ON COLUMN user_achievements.comments_count IS '用户发表的评论数量';
COMMENT ON COLUMN user_achievements.votes_given IS '用户点赞的总数';

-- 5. 创建触发器：自动为新用户创建通知设置
CREATE OR REPLACE FUNCTION create_user_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_notification_settings
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_notification_settings();

-- 完成
SELECT 'Migration 0015 completed successfully!' AS status;

