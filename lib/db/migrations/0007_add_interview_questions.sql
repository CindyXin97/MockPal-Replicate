-- 创建面试真题表
CREATE TABLE interview_questions (
  id SERIAL PRIMARY KEY,
  company VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  question TEXT NOT NULL,
  recommended_answer TEXT,
  tags TEXT,
  source VARCHAR(100),
  year INTEGER NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX idx_interview_questions_company ON interview_questions(company);
CREATE INDEX idx_interview_questions_position ON interview_questions(position);
CREATE INDEX idx_interview_questions_type ON interview_questions(question_type);
CREATE INDEX idx_interview_questions_year ON interview_questions(year); 