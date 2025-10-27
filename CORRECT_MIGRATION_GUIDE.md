# 正确的数据库迁移顺序

## ✅ 正确的思路

1. **先创建历史表** - 准备好存储位置
2. **保存所有现有数据到历史表** - 包括重复的记录！
3. **然后清理主表的重复数据** - 这时数据已经安全保存在历史表了
4. **添加唯一约束** - 防止将来出现重复

这样确保：
- ✅ 不会丢失任何数据
- ✅ 所有历史都被保存
- ✅ 主表保持干净（每个用户一条记录）

---

## 🚀 正确的执行步骤

### 步骤 1: 检查当前状态

```sql
-- 查看现在有多少数据
SELECT 
  COUNT(*) as total_profiles,
  COUNT(DISTINCT user_id) as unique_users
FROM user_profiles;

-- 查看是否有重复
SELECT user_id, COUNT(*) as count,
       ARRAY_AGG(id ORDER BY updated_at DESC) as profile_ids
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;
```

记下结果！这很重要。

---

### 步骤 2: 创建历史表（先创建，才能保存数据）

```sql
CREATE TABLE IF NOT EXISTS user_profile_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  job_type VARCHAR(50),
  experience_level VARCHAR(50),
  target_company VARCHAR(255),
  target_industry VARCHAR(255),
  other_company_name VARCHAR(255),
  technical_interview BOOLEAN,
  behavioral_interview BOOLEAN,
  case_analysis BOOLEAN,
  stats_questions BOOLEAN,
  email VARCHAR(255),
  wechat VARCHAR(255),
  linkedin VARCHAR(255),
  bio VARCHAR(1000),
  school VARCHAR(255),
  
  change_type VARCHAR(20) DEFAULT 'update',
  changed_fields TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profile_history_user_id 
  ON user_profile_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_history_created_at 
  ON user_profile_history(created_at DESC);
```

验证表已创建：
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_profile_history'
) as table_exists;
```

---

### 步骤 3: 保存所有现有数据到历史表（包括重复的！）

```sql
-- 将所有现有记录（包括重复的）都保存到历史表
INSERT INTO user_profile_history (
  user_id, profile_id, job_type, experience_level, target_company,
  target_industry, other_company_name, technical_interview,
  behavioral_interview, case_analysis, stats_questions, email,
  wechat, linkedin, bio, school, change_type, created_at
)
SELECT 
  user_id, id, job_type, experience_level, target_company,
  target_industry, other_company_name, technical_interview,
  behavioral_interview, case_analysis, stats_questions, email,
  wechat, linkedin, bio, school, 
  'create' as change_type,  -- 标记为初始创建
  created_at
FROM user_profiles
ORDER BY user_id, created_at;
```

**验证数据已保存：**
```sql
-- 应该等于步骤1中的 total_profiles
SELECT COUNT(*) as history_count
FROM user_profile_history;

-- 查看每个用户有多少条历史记录
SELECT user_id, COUNT(*) as history_count
FROM user_profile_history
GROUP BY user_id
ORDER BY history_count DESC;
```

---

### 步骤 4: 现在可以安全地清理主表的重复数据了

```sql
-- 保留每个用户最新的记录
DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, updated_at DESC
);
```

**验证清理成功：**
```sql
-- 应该没有重复了
SELECT user_id, COUNT(*) 
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;
-- 应该返回 0 行

-- 主表应该只有 unique_users 这么多条记录
SELECT COUNT(*) as profiles_after_cleanup,
       COUNT(DISTINCT user_id) as unique_users
FROM user_profiles;
```

---

### 步骤 5: 添加唯一约束

```sql
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
```

验证约束已添加：
```sql
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass 
  AND conname = 'user_profiles_user_id_unique';
```

---

### 步骤 6: 最终验证

```sql
-- 完整的状态检查
SELECT 
  '主表记录数' as metric, 
  COUNT(*)::text as value 
FROM user_profiles
UNION ALL
SELECT 
  '唯一用户数', 
  COUNT(DISTINCT user_id)::text 
FROM user_profiles
UNION ALL
SELECT 
  '历史记录数', 
  COUNT(*)::text 
FROM user_profile_history
UNION ALL
SELECT 
  '是否有重复', 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_profiles 
      GROUP BY user_id HAVING COUNT(*) > 1
    ) THEN '是 ⚠️'
    ELSE '否 ✅'
  END
UNION ALL
SELECT 
  '唯一约束', 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'user_profiles'::regclass 
        AND conname = 'user_profiles_user_id_unique'
    ) THEN '已添加 ✅'
    ELSE '未添加 ⚠️'
  END;
```

---

## 📊 预期结果

执行完所有步骤后，你应该看到：

| 指标 | 值 |
|------|---|
| 主表记录数 | 8 (假设有8个用户) |
| 唯一用户数 | 8 |
| 历史记录数 | 10 (假设原来有2个重复) |
| 是否有重复 | 否 ✅ |
| 唯一约束 | 已添加 ✅ |

**关键点：**
- 主表记录数 = 唯一用户数 ✅
- 历史记录数 >= 主表记录数 ✅（因为包含了被删除的重复记录）

---

## 🎯 数据流示例

假设你有 user_7 的两条记录：

**原始状态：**
```
user_profiles:
- id: 12, user_id: 7, experience_level: '应届', updated_at: 2025-01-01
- id: 15, user_id: 7, experience_level: '实习', updated_at: 2025-01-15 (最新)
```

**执行步骤 3 后（保存所有数据到历史表）：**
```
user_profile_history:
- id: 1, user_id: 7, profile_id: 12, experience_level: '应届', created_at: 2025-01-01
- id: 2, user_id: 7, profile_id: 15, experience_level: '实习', created_at: 2025-01-15
```

**执行步骤 4 后（清理主表重复）：**
```
user_profiles:
- id: 15, user_id: 7, experience_level: '实习', updated_at: 2025-01-15 (保留最新)

user_profile_history:
- id: 1, user_id: 7, profile_id: 12, experience_level: '应届', created_at: 2025-01-01 ✅ 旧数据保留
- id: 2, user_id: 7, profile_id: 15, experience_level: '实习', created_at: 2025-01-15 ✅ 新数据保留
```

**结果：**
- ✅ 主表只有最新数据（实习）
- ✅ 历史表保留了完整的变更历史（应届 → 实习）
- ✅ 没有丢失任何数据！

---

## ⚠️ 如果历史功能不重要

如果你不需要保留历史数据，可以跳过步骤 2-3，直接执行：

```sql
-- 直接清理重复
DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, updated_at DESC
);

-- 添加约束
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
```

但这样会**永久丢失**被删除的记录。

---

## 💡 推荐做法

**保留历史是推荐的！** 因为：
1. ✅ 不会丢失任何数据
2. ✅ 可以追溯用户的变更历史
3. ✅ 如果出问题可以恢复
4. ✅ 对性能影响很小

**所以建议按完整步骤 1-6 执行！**

---

## ❓ 需要帮助？

在执行过程中遇到任何问题，告诉我：
1. 在哪一步出错？
2. 错误信息是什么？
3. 步骤 1 的结果是什么？

我会帮你解决！

