-- 添加技能字段到用户资料表
ALTER TABLE user_profiles ADD COLUMN skills TEXT;

-- 添加技能字段到用户资料历史表
ALTER TABLE user_profile_history ADD COLUMN skills TEXT;

