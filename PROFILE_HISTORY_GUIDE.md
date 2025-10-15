# 用户资料修改历史功能

## 📋 功能概述

现在系统会自动记录用户资料的所有修改历史，包括：
- ✅ 每次修改的完整快照
- ✅ 修改的具体字段
- ✅ 修改时间
- ✅ 操作类型（创建/更新）

## 🏗️ 数据库设计

### 主表：`user_profiles`
保存用户的**最新资料**（用于快速查询和匹配）

- 每个用户只有 1 条记录
- UPDATE 更新原记录
- 添加了 `UNIQUE` 约束防止重复

### 历史表：`user_profile_history`
保存用户的**所有修改历史**（用于审计追踪）

- 每次修改创建 1 条新记录
- 保存完整的资料快照
- 记录修改的字段和时间

```sql
-- 表结构
user_profile_history
├── id (主键)
├── user_id (用户ID)
├── profile_id (关联的 profile ID)
├── job_type, experience_level, ... (完整快照)
├── change_type (操作类型: create/update)
├── changed_fields[] (修改的字段数组)
└── created_at (修改时间)
```

---

## 🚀 使用方式

### 1. 创建历史表

运行迁移脚本：

```bash
psql $DATABASE_URL -f migrations/0012_create_profile_history_table.sql
```

### 2. 查看用户的修改历史

```bash
# 查看 user_1 的所有修改历史
npx tsx scripts/view-profile-history.ts 1

# 查看 user_1 的 experienceLevel 字段修改历史
npx tsx scripts/view-profile-history.ts 1 experienceLevel

# 查看 user_7 的历史
npx tsx scripts/view-profile-history.ts 7
```

**示例输出：**
```
📜 查看 User 1 的资料修改历史

================================================================================

找到 3 条修改记录:

1. 2025-10-15 01:30:45
   操作: 更新
   修改字段: experienceLevel
   经验水平: 实习
   岗位类型: DA
   目标公司: Google
   学校: Stanford

2. 2025-10-14 18:20:30
   操作: 更新
   修改字段: targetCompany, bio
   经验水平: 应届
   岗位类型: DA
   目标公司: Meta
   学校: Stanford

3. 2025-10-10 10:15:00
   操作: 创建
   修改字段: 全部
   经验水平: 应届
   岗位类型: DA
   目标公司: Google
   学校: Stanford

================================================================================
✅ 查询完成
```

### 3. 在代码中使用

```typescript
import { getUserProfileHistory, getFieldHistory } from '@/lib/profile-history';

// 获取用户最近10条修改记录
const { history } = await getUserProfileHistory(userId, 10);

// 获取 experienceLevel 字段的修改历史
const { history: expHistory } = await getFieldHistory(userId, 'experienceLevel');

// 查看用户经验水平的变化轨迹
expHistory.forEach(record => {
  console.log(`${record.createdAt}: ${record.experienceLevel}`);
});
// 输出：
// 2025-10-15: 实习
// 2025-10-10: 应届
```

---

## 📊 数据查询示例

### SQL 查询

```sql
-- 1. 查看用户的所有修改历史
SELECT * 
FROM user_profile_history 
WHERE user_id = 1 
ORDER BY created_at DESC;

-- 2. 查看用户 experience_level 的变化历史
SELECT created_at, experience_level, change_type, changed_fields
FROM user_profile_history
WHERE user_id = 1 
  AND 'experienceLevel' = ANY(changed_fields)
ORDER BY created_at DESC;

-- 3. 统计每个用户的修改次数
SELECT 
  user_id,
  COUNT(*) as total_changes,
  MAX(created_at) as last_change
FROM user_profile_history
GROUP BY user_id
ORDER BY total_changes DESC;

-- 4. 查看最近 24 小时的所有修改
SELECT u.email, h.experience_level, h.change_type, h.created_at
FROM user_profile_history h
JOIN users u ON h.user_id = u.id
WHERE h.created_at > NOW() - INTERVAL '24 hours'
ORDER BY h.created_at DESC;

-- 5. 查看哪些字段被修改最频繁
SELECT 
  UNNEST(changed_fields) as field_name,
  COUNT(*) as change_count
FROM user_profile_history
WHERE change_type = 'update'
GROUP BY field_name
ORDER BY change_count DESC;
```

---

## 🎯 工作流程

### 用户修改资料时

```
1. 用户提交资料修改
   ↓
2. 系统检查是否有变化
   ↓
3. 如果有变化：
   a. UPDATE user_profiles 表（更新最新数据）
   b. INSERT user_profile_history 表（记录历史）
   ↓
4. 返回成功
```

### 示例场景

**用户 1 的操作时间线：**

```
Day 1, 10:00 AM - 创建资料
  - 岗位: DA
  - 经验: 应届
  - 公司: Google
  
  → user_profiles: INSERT 新记录
  → user_profile_history: INSERT (change_type: 'create')

Day 3, 2:00 PM - 修改目标公司
  - 公司: Google → Meta
  
  → user_profiles: UPDATE 现有记录
  → user_profile_history: INSERT (change_type: 'update', changed_fields: ['targetCompany'])

Day 5, 6:00 PM - 修改经验水平
  - 经验: 应届 → 实习
  
  → user_profiles: UPDATE 现有记录
  → user_profile_history: INSERT (change_type: 'update', changed_fields: ['experienceLevel'])
```

**结果：**
- `user_profiles` 表：1 条记录（最新状态）
- `user_profile_history` 表：3 条记录（完整历史）

---

## 🔍 数据分析用例

### 1. 用户行为分析

```typescript
// 分析用户修改资料的频率
const stats = await db.execute(`
  SELECT 
    DATE_TRUNC('day', created_at) as day,
    COUNT(*) as changes_count
  FROM user_profile_history
  GROUP BY day
  ORDER BY day DESC
  LIMIT 30
`);
```

### 2. 职业发展轨迹

```typescript
// 追踪用户从实习到全职的转变
const { history } = await getFieldHistory(userId, 'experienceLevel');

console.log('用户职业发展轨迹:');
history.reverse().forEach(record => {
  console.log(`${record.createdAt}: ${record.experienceLevel}`);
});
// 输出：实习 → 应届 → 1-3年 → 3-5年
```

### 3. 热门目标公司趋势

```sql
SELECT 
  target_company,
  COUNT(*) as mentions,
  COUNT(DISTINCT user_id) as unique_users
FROM user_profile_history
WHERE target_company IS NOT NULL
GROUP BY target_company
ORDER BY mentions DESC
LIMIT 10;
```

---

## ⚙️ 配置选项

### 关闭历史记录功能

如果不需要历史记录（节省存储空间），只需注释掉保存历史的代码：

```typescript
// lib/profile.ts 中

// 注释掉这两行
// await saveProfileHistory(userId, oldProfile.id, profileData, 'update', changedFields);
// await saveProfileHistory(userId, newProfileId, profileData, 'create');
```

### 历史记录保留策略

可以定期清理旧的历史记录：

```sql
-- 删除 90 天前的历史记录
DELETE FROM user_profile_history
WHERE created_at < NOW() - INTERVAL '90 days';

-- 或者只保留每个用户最近 20 条记录
DELETE FROM user_profile_history h1
WHERE id NOT IN (
  SELECT id FROM user_profile_history h2
  WHERE h2.user_id = h1.user_id
  ORDER BY created_at DESC
  LIMIT 20
);
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **保持主表简洁**：`user_profiles` 只存最新数据
2. **历史表用于分析**：不在匹配逻辑中查询历史表
3. **定期归档**：超过一定时间的历史可以归档到冷存储
4. **索引优化**：确保 `user_id` 和 `created_at` 有索引

### ❌ 避免做法

1. **不要在历史表中 UPDATE**：历史应该是不可变的
2. **不要删除单条历史**：除非是批量清理策略
3. **不要在实时业务中频繁查询历史**：会影响性能

---

## 📊 性能考虑

### 存储空间估算

假设每个用户每月修改 3 次资料：
- 每条历史记录 ~500 bytes
- 1000 用户 × 3 次/月 × 12 月 = 36,000 条记录
- 36,000 × 500 bytes ≈ **18 MB/年**

非常轻量！对于大多数应用完全可以接受。

### 查询性能

- ✅ 按 `user_id` 查询：有索引，很快
- ✅ 按时间范围查询：有索引，很快
- ⚠️  全表扫描：避免，数据量大时会慢

---

## 🎉 总结

现在你的系统：

✅ **主表保存最新数据**（快速查询，用于匹配）  
✅ **历史表记录所有变更**（审计追踪，数据分析）  
✅ **自动追踪变化**（无需手动操作）  
✅ **性能优秀**（轻量级设计）  

**完美的双表设计！** 🎯

---

## 🔧 快速开始

```bash
# 1. 创建历史表
psql $DATABASE_URL -f migrations/0012_create_profile_history_table.sql

# 2. 测试：修改用户资料
# (在前端页面修改 user_1 的 experience_level)

# 3. 查看历史
npx tsx scripts/view-profile-history.ts 1

# 4. 查看特定字段
npx tsx scripts/view-profile-history.ts 1 experienceLevel
```

完成！✅

