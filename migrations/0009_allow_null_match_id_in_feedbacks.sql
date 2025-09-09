-- 允许feedbacks表的match_id字段为null，用于存储系统级反馈
ALTER TABLE feedbacks ALTER COLUMN match_id DROP NOT NULL; 