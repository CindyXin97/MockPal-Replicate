-- 修复 user_profile_history 表缺少 skills 字段的问题
-- 这个字段应该在 0010_add_skills_to_user_profiles.sql 中被添加
-- 但由于某些原因未能成功添加，导致用户保存 profile 时失败

-- 添加 skills 字段到历史表（如果不存在）
ALTER TABLE user_profile_history ADD COLUMN IF NOT EXISTS skills TEXT;

-- 说明：
-- - 此字段存储用户的技能信息（JSON格式）
-- - 与 user_profiles.skills 字段对应
-- - 用于记录用户资料修改历史

