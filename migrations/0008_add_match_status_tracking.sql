-- 添加匹配状态跟踪字段
ALTER TABLE matches 
ADD COLUMN contact_status VARCHAR(50) DEFAULT 'not_contacted',
ADD COLUMN contact_updated_at TIMESTAMP,
ADD COLUMN interview_scheduled_at TIMESTAMP,
ADD COLUMN last_reminder_sent TIMESTAMP;

-- 添加注释说明各字段用途
COMMENT ON COLUMN matches.contact_status IS '联系状态: not_contacted, contacted, scheduled, completed, no_response';
COMMENT ON COLUMN matches.contact_updated_at IS '联系状态最后更新时间';
COMMENT ON COLUMN matches.interview_scheduled_at IS '面试安排时间';
COMMENT ON COLUMN matches.last_reminder_sent IS '最后发送提醒的时间';

-- 为现有匹配设置默认状态
UPDATE matches 
SET contact_status = 'not_contacted' 
WHERE contact_status IS NULL; 