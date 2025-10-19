-- 用户发布的面试题目表
CREATE TABLE IF NOT EXISTS user_interview_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- technical, behavioral, case_study, stats
  difficulty VARCHAR(20) NOT NULL, -- easy, medium, hard
  interview_date DATE NOT NULL, -- 面试日期
  question TEXT NOT NULL,
  recommended_answer TEXT, -- 可选的推荐答案
  is_anonymous BOOLEAN DEFAULT FALSE, -- 是否匿名发布
  status VARCHAR(20) DEFAULT 'active', -- active, hidden, deleted
  views_count INTEGER DEFAULT 0, -- 浏览次数
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 评论表（支持系统题目和用户发布的题目）
CREATE TABLE IF NOT EXISTS interview_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type VARCHAR(20) NOT NULL, -- 'system' or 'user'
  post_id INTEGER NOT NULL, -- interview_questions.id 或 user_interview_posts.id
  content TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES interview_comments(id) ON DELETE CASCADE, -- 用于回复评论
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 点赞/踩表
CREATE TABLE IF NOT EXISTS interview_votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type VARCHAR(20) NOT NULL, -- 'system' or 'user'
  post_id INTEGER NOT NULL,
  vote_type VARCHAR(10) NOT NULL, -- 'up' or 'down'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- 确保每个用户对每个帖子只能投一次票
  UNIQUE(user_id, post_type, post_id)
);

-- 索引优化 - 用户发帖表
CREATE INDEX IF NOT EXISTS idx_user_posts_user_id ON user_interview_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_company ON user_interview_posts(company);
CREATE INDEX IF NOT EXISTS idx_user_posts_position ON user_interview_posts(position);
CREATE INDEX IF NOT EXISTS idx_user_posts_status ON user_interview_posts(status);
CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_interview_posts(created_at DESC);

-- 索引优化 - 评论表
CREATE INDEX IF NOT EXISTS idx_comments_post ON interview_comments(post_type, post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON interview_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON interview_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON interview_comments(created_at DESC);

-- 索引优化 - 投票表
CREATE INDEX IF NOT EXISTS idx_votes_post ON interview_votes(post_type, post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON interview_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_vote_type ON interview_votes(vote_type);

-- 添加评论到现有表，便于获取用户名
COMMENT ON TABLE user_interview_posts IS '用户发布的面试题目';
COMMENT ON TABLE interview_comments IS '面试题目评论表（支持系统题和用户题）';
COMMENT ON TABLE interview_votes IS '面试题目点赞/踩表';

