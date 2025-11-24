-- 给面试题目表添加语言字段
ALTER TABLE interview_questions 
ADD COLUMN language VARCHAR(10) DEFAULT 'zh' NOT NULL;

-- 创建索引以优化按语言筛选的查询
CREATE INDEX idx_interview_questions_language ON interview_questions(language);

-- 将英文公司的题目标记为英文（基于我们刚添加的题目）
UPDATE interview_questions 
SET language = 'en'
WHERE company IN (
  'Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix',
  'Airbnb', 'Uber', 'LinkedIn', 'Spotify', 'Stripe', 'DoorDash',
  'Apple', 'Tesla', 'Salesforce', 'Oracle', 'IBM'
)
AND created_at >= CURRENT_DATE - INTERVAL '1 day';

-- 其他题目保持默认的中文标记
COMMENT ON COLUMN interview_questions.language IS '题目语言: zh (中文) 或 en (英文)';

