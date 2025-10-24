-- 用户每日奖励配额表
CREATE TABLE IF NOT EXISTS user_daily_bonus (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  posts_today INTEGER DEFAULT 0,      -- 今日发帖数
  comments_today INTEGER DEFAULT 0,   -- 今日评论数
  bonus_quota INTEGER DEFAULT 0,      -- 当天新增的奖励配额
  bonus_balance INTEGER DEFAULT 0,    -- 奖励配额余额（可累积，上限6）
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, date)  -- 每人每天一条记录
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_daily_bonus_user_date ON user_daily_bonus(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_bonus_date ON user_daily_bonus(date);

-- 注释
COMMENT ON TABLE user_daily_bonus IS '用户每日奖励配额记录表';
COMMENT ON COLUMN user_daily_bonus.posts_today IS '今日发帖数（用于判断是否已获得发帖奖励）';
COMMENT ON COLUMN user_daily_bonus.comments_today IS '今日评论数（用于计算评论奖励进度）';
COMMENT ON COLUMN user_daily_bonus.bonus_quota IS '当天新增的奖励配额';
COMMENT ON COLUMN user_daily_bonus.bonus_balance IS '奖励配额余额，可累积使用，上限6个';

