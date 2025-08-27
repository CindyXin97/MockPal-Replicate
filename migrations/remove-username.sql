-- 移除username字段的迁移脚本
-- 注意：此迁移保留现有数据，只是从schema中移除username字段的使用

-- 1. 首先确保所有用户都有邮箱（如果没有，使用username@mockpal.com作为默认邮箱）
UPDATE users 
SET email = COALESCE(email, CONCAT(username, '@mockpal.com'))
WHERE email IS NULL OR email = '';

-- 2. 确保所有用户都有name（如果没有，使用username作为name）
UPDATE users
SET name = COALESCE(name, username)
WHERE name IS NULL OR name = '';

-- 3. 注释：username字段暂时保留在数据库中，但应用层不再使用
-- 如果需要完全删除username字段，可以运行：
-- ALTER TABLE users DROP COLUMN username;

-- 4. 确保email字段有唯一索引
-- (如果还没有的话，但通常已经有了)
-- CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);