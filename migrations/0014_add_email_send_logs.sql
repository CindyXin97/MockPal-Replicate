-- 创建邮件发送记录表
CREATE TABLE IF NOT EXISTS email_send_logs (
  id SERIAL PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX idx_email_send_logs_recipient_sent_at ON email_send_logs(recipient_email, sent_at);
CREATE INDEX idx_email_send_logs_email_type ON email_send_logs(email_type);

-- 添加注释
COMMENT ON TABLE email_send_logs IS '邮件发送记录表 - 用于频率限制和审计';
COMMENT ON COLUMN email_send_logs.recipient_email IS '收件人邮箱地址';
COMMENT ON COLUMN email_send_logs.email_type IS '邮件类型：login, password_setup, match_success';
COMMENT ON COLUMN email_send_logs.subject IS '邮件主题';
COMMENT ON COLUMN email_send_logs.status IS '发送状态：sent(成功), failed(失败), skipped(跳过-超出限制)';
COMMENT ON COLUMN email_send_logs.error_message IS '错误信息（如果发送失败）';
COMMENT ON COLUMN email_send_logs.sent_at IS '发送时间';


