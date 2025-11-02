-- 用户邀请码表
CREATE TABLE IF NOT EXISTS user_invite_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(12) NOT NULL UNIQUE,  -- 邀请码，12位字符
  times_used INTEGER DEFAULT 0,             -- 使用次数
  total_referrals INTEGER DEFAULT 0,        -- 总邀请人数
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id)  -- 每个用户只有一个邀请码
);

-- 邀请码使用记录表
CREATE TABLE IF NOT EXISTS invite_code_usage (
  id SERIAL PRIMARY KEY,
  invite_code VARCHAR(12) NOT NULL REFERENCES user_invite_codes(invite_code),
  referrer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(20) DEFAULT 'quota',  -- 奖励类型：quota (配额奖励)
  reward_amount INTEGER DEFAULT 2,          -- 奖励数量：每次邀请+2配额
  used_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  UNIQUE(referred_user_id)  -- 每个新用户只能使用一次邀请码
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_invite_code_user ON user_invite_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_code_code ON user_invite_codes(invite_code);
CREATE INDEX IF NOT EXISTS idx_invite_usage_code ON invite_code_usage(invite_code);
CREATE INDEX IF NOT EXISTS idx_invite_usage_referrer ON invite_code_usage(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_invite_usage_referred ON invite_code_usage(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_invite_usage_date ON invite_code_usage(used_at);

-- 注释
COMMENT ON TABLE user_invite_codes IS '用户邀请码表 - 每个用户都有一个专属邀请码';
COMMENT ON COLUMN user_invite_codes.invite_code IS '邀请码，唯一标识';
COMMENT ON COLUMN user_invite_codes.times_used IS '邀请码被使用的次数';
COMMENT ON COLUMN user_invite_codes.total_referrals IS '总邀请成功人数';

COMMENT ON TABLE invite_code_usage IS '邀请码使用记录表 - 记录每次邀请的详细信息';
COMMENT ON COLUMN invite_code_usage.reward_type IS '奖励类型';
COMMENT ON COLUMN invite_code_usage.reward_amount IS '奖励数量（配额）';

