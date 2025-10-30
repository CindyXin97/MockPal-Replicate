-- 用户收藏题目表
CREATE TABLE IF NOT EXISTS user_saved_questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_type VARCHAR(20) NOT NULL, -- 'system' 或 'user'
  question_id INTEGER NOT NULL, -- interview_questions.id 或 user_interview_posts.id
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- 确保用户不能重复收藏同一题目
  UNIQUE(user_id, question_type, question_id)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_saved_questions_user_id ON user_saved_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_questions_type_id ON user_saved_questions(question_type, question_id);

-- 添加注释
COMMENT ON TABLE user_saved_questions IS '用户收藏的面试题目';
COMMENT ON COLUMN user_saved_questions.question_type IS '题目类型：system(系统题目) 或 user(用户发布)';
COMMENT ON COLUMN user_saved_questions.question_id IS '对应 interview_questions.id 或 user_interview_posts.id';

