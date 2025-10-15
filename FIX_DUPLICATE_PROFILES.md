# 修复重复的 User Profile 记录

## 🔍 问题描述

发现 `user_profiles` 表中存在重复记录（如 user_7 和 user_8 有两条记录）。

**根本原因：**
- `user_profiles` 表的 `user_id` 字段没有唯一约束
- 在某些情况下（如并发请求、错误重试等），可能导致同一用户创建多条记录

## ✅ 解决方案

### 步骤 1: 检查并清理重复数据

运行清理脚本：

```bash
npx tsx scripts/fix-duplicate-profiles.ts
```

**脚本功能：**
- ✅ 自动检测所有有重复记录的用户
- ✅ 保留每个用户最新的记录（`updated_at` 最晚的）
- ✅ 删除旧的重复记录
- ✅ 验证清理结果

**预期输出：**
```
🔍 检查重复的 user_profile 记录...

⚠️  发现 2 个用户有重复记录:

📋 User 7: 2 条记录
   Profile IDs: [15, 12]
   最新记录 ID: 15 (保留)
   旧记录 IDs: 12 (将删除)

📋 User 8: 2 条记录
   Profile IDs: [16, 13]
   最新记录 ID: 16 (保留)
   旧记录 IDs: 13 (将删除)

🗑️  准备清理重复记录...

✅ 清理完成！
```

---

### 步骤 2: 添加唯一约束（防止再次出现）

运行迁移脚本：

```bash
psql $DATABASE_URL -f migrations/0011_add_unique_constraint_user_profiles.sql
```

或者直接运行 SQL：

```sql
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
```

**这个约束会：**
- ✅ 确保每个 `user_id` 在 `user_profiles` 表中只能有一条记录
- ✅ 如果尝试插入重复的 `user_id`，数据库会拒绝并报错
- ✅ 从根本上防止重复数据

---

### 步骤 3: 验证修复

检查是否还有重复：

```sql
SELECT user_id, COUNT(*) as count
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;
```

应该返回 0 行结果。

检查唯一约束是否存在：

```sql
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass 
AND conname = 'user_profiles_user_id_unique';
```

应该看到约束存在。

---

## 🎯 当前设计（正确的）

### User Profiles 表结构

```
user_profiles
├── id (PRIMARY KEY)
├── user_id (UNIQUE) ← 每个用户只能有一条记录
├── job_type
├── experience_level
├── ...
└── updated_at
```

### 保存逻辑

```typescript
// lib/profile.ts - saveUserProfile()

1. 检查用户是否已有 profile
   ↓
2a. 如果存在 → UPDATE 更新原记录
   ✅ user_1 修改资料 → 更新原数据
   
2b. 如果不存在 → INSERT 创建新记录  
   ✅ user_7 第一次创建 → 插入新数据
```

**这是正确的设计！** 每个用户只应该有一条最新的 profile 记录。

---

## ❓ 为什么会出现重复？

可能的原因：

1. **缺少唯一约束**：数据库层面没有防止重复
2. **应用逻辑问题**：
   - 并发请求（用户快速点击两次保存）
   - 网络问题导致请求重试
   - 之前的代码 bug 导致插入而非更新

3. **手动操作**：直接在数据库中 INSERT 数据

---

## 🛡️ 预防措施

添加唯一约束后，如果再次尝试插入重复的 `user_id`：

```typescript
// 会收到错误
Error: duplicate key value violates unique constraint 
"user_profiles_user_id_unique"
```

当前的 `saveUserProfile` 函数会正确处理：
1. 先查询是否存在 → `existingProfile`
2. 存在则 UPDATE，不存在则 INSERT
3. 有了唯一约束，即使逻辑有 bug，数据库也会拒绝重复

---

## 📊 总结

✅ **保持单表设计**：`user_profiles` 表保存最新数据  
✅ **添加唯一约束**：防止重复记录  
✅ **UPDATE 而非 INSERT**：更新已存在的用户资料  
✅ **数据完整性**：每个用户一条记录  

**不需要改变设计！** 只需：
1. 清理现有重复数据
2. 添加唯一约束
3. 继续使用当前的保存逻辑

---

## 🔧 快速修复命令

```bash
# 1. 清理重复数据
npx tsx scripts/fix-duplicate-profiles.ts

# 2. 添加唯一约束（如果需要直接访问数据库）
# psql $DATABASE_URL -f migrations/0011_add_unique_constraint_user_profiles.sql

# 3. 验证
# psql $DATABASE_URL -c "SELECT user_id, COUNT(*) FROM user_profiles GROUP BY user_id HAVING COUNT(*) > 1;"
```

完成！✅

