-- 用户行为日志表
-- 记录用户的所有操作行为，用于数据分析和用户行为追踪

CREATE TABLE IF NOT EXISTS user_actions_log (
  id SERIAL PRIMARY KEY,
  
  -- 用户信息
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 行为类型
  action_type VARCHAR(50) NOT NULL, 
  -- 可能的值:
  -- 'login' - 登录
  -- 'profile_create' - 创建资料
  -- 'profile_update' - 更新资料
  -- 'profile_view' - 浏览他人资料
  -- 'profile_viewed' - 被他人浏览
  -- 'match_request' - 发起匹配请求(like)
  -- 'match_reject' - 拒绝匹配(dislike)
  -- 'match_success' - 匹配成功
  -- 'match_cancel' - 取消匹配
  -- 'post_create' - 发布面经题目
  -- 'post_view' - 浏览题目
  -- 'post_save' - 收藏题目
  -- 'comment_create' - 发表评论
  -- 'comment_receive' - 收到评论
  -- 'vote_give' - 点赞/踩
  -- 'vote_receive' - 收到赞/踩
  -- 'feedback_submit' - 提交面试反馈
  -- 'notification_receive' - 收到通知
  -- 'email_sent' - 发送邮件
  -- 'email_received' - 收到邮件
  -- 'search' - 搜索操作
  
  -- 行为详情
  target_type VARCHAR(50), -- 操作的目标类型: 'user', 'post', 'comment', 'match' 等
  target_id INTEGER, -- 目标对象的 ID
  
  -- 元数据（JSON格式，存储详细信息）
  metadata JSONB DEFAULT '{}',
  -- 示例:
  -- 对于 profile_view: {"viewed_user_job_type": "DA", "viewed_user_experience": "1-3年"}
  -- 对于 match_success: {"match_id": 123, "partner_user_id": 456}
  -- 对于 post_create: {"post_id": 789, "company": "Google", "question_type": "technical"}
  -- 对于 vote_give: {"post_id": 101, "vote_type": "up"}
  
  -- 会话信息
  session_id VARCHAR(255), -- 会话标识
  ip_address VARCHAR(50), -- IP地址
  user_agent TEXT, -- 浏览器信息
  
  -- 时间和日期
  action_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 行为日期（用于按日统计）
  action_timestamp TIMESTAMP NOT NULL DEFAULT NOW(), -- 精确时间戳
  
  -- 索引优化
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX idx_user_actions_user_id ON user_actions_log(user_id);
CREATE INDEX idx_user_actions_action_type ON user_actions_log(action_type);
CREATE INDEX idx_user_actions_action_date ON user_actions_log(action_date);
CREATE INDEX idx_user_actions_user_date ON user_actions_log(user_id, action_date);
CREATE INDEX idx_user_actions_target ON user_actions_log(target_type, target_id);
CREATE INDEX idx_user_actions_timestamp ON user_actions_log(action_timestamp DESC);

-- 创建用于分析的物化视图：每日用户行为统计
CREATE MATERIALIZED VIEW IF NOT EXISTS user_daily_stats AS
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  up.job_type,
  up.experience_level,
  up.job_seeking_status,
  up.school,
  ual.action_date,
  
  -- 基础行为统计
  COUNT(*) FILTER (WHERE ual.action_type = 'login') as login_count,
  COUNT(*) FILTER (WHERE ual.action_type = 'profile_view') as profile_views_count,
  COUNT(*) FILTER (WHERE ual.action_type = 'profile_viewed') as profile_viewed_count,
  
  -- 匹配相关统计
  COUNT(*) FILTER (WHERE ual.action_type = 'match_request') as match_requests_sent,
  COUNT(*) FILTER (WHERE ual.action_type = 'match_success') as matches_success,
  COUNT(*) FILTER (WHERE ual.action_type = 'match_reject') as match_rejects,
  
  -- 内容相关统计
  COUNT(*) FILTER (WHERE ual.action_type = 'post_create') as posts_created,
  COUNT(*) FILTER (WHERE ual.action_type = 'post_view') as posts_viewed,
  COUNT(*) FILTER (WHERE ual.action_type = 'post_save') as posts_saved,
  COUNT(*) FILTER (WHERE ual.action_type = 'comment_create') as comments_created,
  COUNT(*) FILTER (WHERE ual.action_type = 'vote_give') as votes_given,
  
  -- 互动统计
  COUNT(*) FILTER (WHERE ual.action_type = 'comment_receive') as comments_received,
  COUNT(*) FILTER (WHERE ual.action_type = 'vote_receive') as votes_received,
  COUNT(*) FILTER (WHERE ual.action_type = 'notification_receive') as notifications_received,
  
  -- 总活跃度
  COUNT(*) as total_actions,
  
  -- 最后活跃时间
  MAX(ual.action_timestamp) as last_active_at
  
FROM user_actions_log ual
LEFT JOIN users u ON ual.user_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
GROUP BY u.id, u.email, u.name, up.job_type, up.experience_level, up.job_seeking_status, up.school, ual.action_date;

-- 创建物化视图的索引
CREATE INDEX idx_user_daily_stats_user_id ON user_daily_stats(user_id);
CREATE INDEX idx_user_daily_stats_date ON user_daily_stats(action_date);
CREATE INDEX idx_user_daily_stats_user_date ON user_daily_stats(user_id, action_date);

-- 添加注释
COMMENT ON TABLE user_actions_log IS '用户行为日志表，记录所有用户操作行为用于数据分析';
COMMENT ON COLUMN user_actions_log.action_type IS '行为类型：login, profile_view, match_request, post_create 等';
COMMENT ON COLUMN user_actions_log.metadata IS 'JSON格式的元数据，存储行为的详细信息';
COMMENT ON COLUMN user_actions_log.action_date IS '行为日期，用于按日统计和分析';
COMMENT ON MATERIALIZED VIEW user_daily_stats IS '用户每日行为统计汇总视图，用于快速查询和 BI 展示';

