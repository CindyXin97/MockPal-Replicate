# 匹配系统数据流验证

## ✅ 确认：匹配系统使用最新数据

### 📊 数据表设计

```
┌─────────────────────────────────────────────────────────────┐
│                    数据流向图                                │
└─────────────────────────────────────────────────────────────┘

用户修改资料
    ↓
┌──────────────────────┐
│   saveUserProfile    │  ← lib/profile.ts
└──────────────────────┘
    ↓
    ├─→ UPDATE user_profiles (主表) ✅ 最新数据
    │   - 每个用户 1 条记录
    │   - 匹配系统使用这个表
    │
    └─→ INSERT user_profile_history (历史表) 📜
        - 每次修改 1 条记录
        - 仅用于审计和分析
        - 不影响匹配

匹配系统查询
    ↓
┌──────────────────────┐
│ getPotentialMatches  │  ← lib/matching.ts
└──────────────────────┘
    ↓
读取 user_profiles (主表) ✅
    ↓
返回最新的用户资料
```

---

## 🔍 代码验证

### 1. 匹配系统入口 (`lib/matching.ts`)

```typescript
// 第 14 行：获取当前用户的资料
const userProfile = await db.query.userProfiles.findFirst({
  where: eq(userProfiles.userId, userId),
});
// ✅ 使用 userProfiles 主表

// 第 113-128 行：获取候选用户
const potentialMatches = await db.query.users.findMany({
  where: and(
    not(eq(users.id, userId)),
    exists(
      db.select()
        .from(userProfiles)  // ✅ 使用 userProfiles 主表
        .where(eq(userProfiles.userId, users.id))
    )
  ),
  with: {
    profile: true,  // ✅ 关联 userProfiles 主表
  },
});

// 第 177-183 行：匹配算法使用资料数据
const overlap =
  (user.profile?.technicalInterview && userProfile.technicalInterview) ||
  (user.profile?.behavioralInterview && userProfile.behavioralInterview) ||
  // ... ✅ 所有数据来自 user.profile（主表）
```

### 2. 资料保存逻辑 (`lib/profile.ts`)

```typescript
// 第 119 行：检查是否已有资料
const existingProfile = await db.select()
  .from(userProfiles)  // ✅ 查询主表
  .where(eq(userProfiles.userId, userId))
  .limit(1);

if (existingProfile.length > 0) {
  // 第 156-159 行：更新主表
  await db.update(userProfiles)  // ✅ UPDATE 主表
    .set(updateData)
    .where(eq(userProfiles.userId, userId));
  
  // 第 162 行：保存历史记录
  await saveProfileHistory(...);  // 📜 INSERT 历史表
} else {
  // 第 173-189 行：创建新资料
  await db.insert(userProfiles).values({...});  // ✅ INSERT 主表
  await saveProfileHistory(...);  // 📜 INSERT 历史表
}
```

### 3. 历史记录功能 (`lib/profile-history.ts`)

```typescript
// 仅用于查询历史，不影响匹配
export async function getUserProfileHistory(userId: number) {
  const history = await db.select()
    .from(userProfileHistory)  // 📜 仅查询历史表
    .where(eq(userProfileHistory.userId, userId));
  // ✅ 历史表独立，不影响匹配系统
}
```

---

## ✅ 验证结果

### 匹配系统使用的表

| 操作 | 使用的表 | 说明 |
|------|---------|------|
| **获取用户资料** | `user_profiles` | ✅ 主表，最新数据 |
| **查找候选用户** | `user_profiles` | ✅ 主表，最新数据 |
| **匹配算法计算** | `user_profiles` | ✅ 主表，最新数据 |
| **保存修改历史** | `user_profile_history` | 📜 历史表，仅记录 |
| **查询历史记录** | `user_profile_history` | 📜 历史表，独立功能 |

### 确认要点

✅ **匹配系统永远使用 `user_profiles` 主表**
- 第 14 行：读取当前用户资料
- 第 119 行：查询其他用户资料
- 第 177-183 行：匹配算法计算

✅ **主表保存最新数据**
- UPDATE 操作更新已有记录
- 每个用户只有 1 条记录
- 添加 UNIQUE 约束防止重复

✅ **历史表独立运行**
- 仅在保存资料时 INSERT
- 不被匹配系统查询
- 用于审计和数据分析

---

## 🧪 运行验证脚本

验证匹配系统是否正确使用最新数据：

```bash
npx tsx scripts/verify-matching-uses-latest-data.ts
```

**脚本会检查：**
1. ✅ `user_profiles` 主表是否存在
2. ✅ `user_profile_history` 历史表是否存在（可选）
3. ✅ 匹配函数是否从主表读取数据
4. ✅ 主表和历史表的数据一致性

**预期输出：**
```
🔍 验证匹配系统使用最新数据

================================================================================

📊 步骤 1: 检查数据表

✅ user_profiles 表: 8 条记录
✅ user_profile_history 表: 15 条记录

📊 步骤 2: 验证匹配逻辑

测试用户 ID: 1

✅ 从 user_profiles 主表读取的最新资料:
   - 岗位类型: DA
   - 经验水平: 实习
   - 目标公司: Google
   - 学校: Stanford
   - 最后更新: 2025-10-15 01:30:45

📊 步骤 3: 测试匹配函数

✅ 匹配成功，找到 3 个候选人
   匹配系统正确使用了 user_profiles 主表

📊 步骤 4: 对比主表和历史表

✅ 用户有历史记录
   历史记录数: 15 条
   最新历史快照:
   - 岗位类型: DA
   - 经验水平: 实习
   - 记录时间: 2025-10-15 01:30:45

✅ 主表和最新历史记录一致

================================================================================
📋 验证结果总结

✅ user_profiles 主表: 存储最新数据
✅ 匹配系统: 使用 user_profiles 主表
✅ user_profile_history 历史表: 记录所有变更
✅ 历史表: 仅用于审计，不影响匹配

🎯 结论: 匹配系统正确使用最新数据！
```

---

## 📊 性能对比

### 查询速度

| 操作 | 使用主表 | 使用历史表（如果错误使用） |
|------|---------|------------------------|
| 获取用户最新资料 | ✅ 快速（1条记录） | ❌ 慢（需要找最新） |
| 匹配候选用户 | ✅ 简单 JOIN | ❌ 复杂子查询 |
| 数据一致性 | ✅ 保证唯一 | ❌ 可能重复 |

**示例查询对比：**

```sql
-- ✅ 正确方式（使用主表）
SELECT * FROM user_profiles WHERE user_id = 1;
-- 结果：1 条记录，立即返回

-- ❌ 错误方式（如果使用历史表）
SELECT * FROM user_profile_history 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
-- 结果：需要扫描所有历史记录，慢
```

---

## 🎯 总结

### ✅ 当前设计（正确）

```
匹配系统流程：
1. 用户 A 打开匹配页面
2. 系统从 user_profiles 读取 A 的最新资料
3. 系统从 user_profiles 读取候选用户的最新资料
4. 匹配算法基于最新资料计算匹配度
5. 返回推荐结果

数据更新流程：
1. 用户修改资料（如：应届 → 实习）
2. UPDATE user_profiles 主表（立即生效）
3. INSERT user_profile_history 历史表（记录变更）
4. 下次匹配使用新数据（实习）
```

### 🔒 保证

- ✅ 匹配系统**永远**使用最新数据
- ✅ 用户修改资料后**立即生效**
- ✅ 历史记录**不影响**匹配性能
- ✅ 每个用户**只有一条**最新记录

---

## 🛡️ 数据完整性保证

### 1. 主表唯一约束

```sql
-- user_profiles 表有 UNIQUE 约束
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
```

### 2. 应用层验证

```typescript
// lib/profile.ts 中的逻辑
// 1. 先查询是否存在
const existingProfile = await db.select()...;

if (existingProfile.length > 0) {
  // 2a. 存在 → UPDATE（不会创建新记录）
  await db.update(userProfiles)...;
} else {
  // 2b. 不存在 → INSERT（创建唯一记录）
  await db.insert(userProfiles)...;
}
```

### 3. 数据库层防护

- ✅ UNIQUE 约束防止重复
- ✅ 外键约束保证引用完整性
- ✅ 索引提高查询性能

---

## 📝 检查清单

在生产环境部署前，请确认：

- [ ] ✅ `user_profiles` 表有 UNIQUE 约束
- [ ] ✅ 清理了所有重复的 profile 记录
- [ ] ✅ 运行验证脚本确认匹配使用主表
- [ ] ✅ 历史表迁移已执行（如果需要）
- [ ] ✅ 测试用户修改资料后立即匹配

**快速验证命令：**

```bash
# 1. 清理重复数据
npx tsx scripts/fix-duplicate-profiles.ts

# 2. 验证匹配系统
npx tsx scripts/verify-matching-uses-latest-data.ts

# 3. 测试修改资料
# (在前端修改 experience_level，然后立即查看匹配结果)
```

---

## 🎉 结论

**✅ 匹配系统 100% 使用最新数据！**

- 主表设计：每个用户 1 条最新记录
- 匹配查询：直接从主表读取
- 历史功能：独立运行，不影响匹配
- 性能优秀：简单高效的查询
- 数据完整：UNIQUE 约束保护

**你的系统设计是正确的！** 🎯

