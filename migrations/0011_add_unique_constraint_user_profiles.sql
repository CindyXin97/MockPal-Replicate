-- 添加唯一约束到 user_profiles 表的 user_id 字段
-- 确保每个用户只能有一条 profile 记录

-- 注意：运行此迁移前，请先清理重复数据
-- 可以运行: npx tsx scripts/fix-duplicate-profiles.ts

-- 检查是否已存在该约束
DO $$ 
BEGIN
    -- 如果约束不存在，则添加
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_user_id_unique'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
        
        RAISE NOTICE '✅ 已添加唯一约束: user_profiles_user_id_unique';
    ELSE
        RAISE NOTICE '⚠️  唯一约束已存在，跳过';
    END IF;
END $$;

-- 创建索引（如果使用 unique 约束会自动创建索引，但这里明确说明）
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 验证约束
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
AND conname = 'user_profiles_user_id_unique';

