# 简单安全的数据库迁移指南

## ⚠️ 遇到 "ROLLBACK required" 错误？

这是正常的，说明原来的脚本太复杂了。让我们用更简单的方式！

---

## 🎯 推荐方式：分步执行（最安全）

打开 **Neon Console SQL Editor**，按顺序复制粘贴并执行以下步骤：

### 📋 步骤 1: 检查当前状态

```sql
-- 查看是否有重复数据
SELECT user_id, COUNT(*) as count
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**如果返回空（0行）**：说明没有重复，跳到步骤 3  
**如果有结果**：记下有重复的 user_id，继续步骤 2

---

### 📋 步骤 2: 清理重复数据（只在有重复时执行）

```sql
-- 保留最新的记录，删除旧的
DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, updated_at DESC
);
```

执行后会显示删除了多少条记录，例如：`DELETE 2`

**验证清理成功：**
```sql
-- 应该返回 0 行
SELECT user_id, COUNT(*) 
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;
```

---

### 📋 步骤 3: 添加唯一约束

```sql
-- 添加约束防止将来出现重复
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
```

如果显示成功，会返回：`ALTER TABLE`

**如果提示约束已存在**，那很好，说明之前已经添加了，跳过即可。

---

### 📋 步骤 4: 创建历史表（可选但推荐）

```sql
-- 创建历史表
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
```

成功会显示：`CREATE TABLE`

---

### 📋 步骤 5: 创建索引

```sql
-- 添加索引提高查询速度
CREATE INDEX IF NOT EXISTS idx_profile_history_user_id 
  ON user_profile_history(user_id);

CREATE INDEX IF NOT EXISTS idx_profile_history_created_at 
  ON user_profile_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_history_user_created 
  ON user_profile_history(user_id, created_at DESC);
```

每个成功会显示：`CREATE INDEX`

---

### 📋 步骤 6: 为现有用户创建初始历史记录

```sql
-- 为所有现有用户创建初始历史快照
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
  wechat, linkedin, bio, school, 'create', created_at
FROM user_profiles;
```

成功会显示插入的行数，例如：`INSERT 0 8`（表示为8个用户创建了历史记录）

---

### 📋 步骤 7: 最终验证

```sql
-- 验证所有操作成功
SELECT 
  (SELECT COUNT(*) FROM user_profiles) as profiles,
  (SELECT COUNT(DISTINCT user_id) FROM user_profiles) as unique_users,
  (SELECT COUNT(*) FROM user_profile_history) as history_records;
```

**预期结果：**
- `profiles` = `unique_users` （每个用户1条记录）
- `history_records` >= `profiles` （至少有初始记录）

---

## ✅ 最小迁移（如果只想快速上线）

如果你不需要历史记录功能，只需要执行：

```sql
-- 1. 清理重复（如果有）
DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, updated_at DESC
);

-- 2. 添加唯一约束
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
```

就完成了！历史表可以之后再添加。

---

## 🔍 如果某一步失败了

### 错误 1: "constraint already exists"
**原因：** 约束已经存在  
**解决：** 这是好事！跳过这一步继续

### 错误 2: "duplicate key value violates unique constraint"
**原因：** 还有重复数据没清理  
**解决：** 重新执行步骤 2 的清理脚本

### 错误 3: "table already exists"
**原因：** 历史表已经创建  
**解决：** 跳过创建表，直接执行步骤 5（创建索引）

### 错误 4: "relation does not exist"
**原因：** 某个表不存在  
**解决：** 确保按顺序执行，检查表名是否正确

---

## 📞 需要帮助？

请告诉我：
1. 在执行哪一步时出错？
2. 完整的错误信息是什么？
3. 步骤 1 返回了什么结果？

我会帮你解决！

---

## 🎯 迁移完成后

测试前端功能：
1. 访问个人资料页面
2. 查看经验水平是否有"实习"选项
3. 尝试修改并保存
4. 刷新页面确认保存成功

完成！🎉

