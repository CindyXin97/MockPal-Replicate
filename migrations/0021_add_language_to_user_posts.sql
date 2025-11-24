-- 给用户发布的题目表添加语言字段
ALTER TABLE user_interview_posts 
ADD COLUMN language VARCHAR(10) DEFAULT 'zh' NOT NULL;

-- 创建索引
CREATE INDEX idx_user_interview_posts_language ON user_interview_posts(language);

-- 注释
COMMENT ON COLUMN user_interview_posts.language IS '题目语言: zh (中文) 或 en (英文)';

