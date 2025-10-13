# Matches 表时间戳字段分析报告

## 📊 字段定义

```typescript
// lib/db/schema.ts
export const matches = pgTable('matches', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## 🔍 当前使用情况

### 1. `created_at` 的使用 ✅

#### 使用场景 A：查询历史记录并排序

```typescript
// lib/matching.ts - createMatch 函数（Line 286-289）
const allRecords = await db.select()
  .from(matches)
  .where(matchBetweenUsers(userId, targetUserId))
  .orderBy(desc(matches.createdAt)); // ← 按创建时间倒序

// 目的：找到每个用户对的最新操作记录
const myLatest = myRecords[0]; // 最新记录
const partnerLatest = partnerRecords[0];
```

**作用**：在历史记录模式下，通过 `created_at` 排序来找到用户的最新操作。

#### 使用场景 B：获取用户的喜欢列表

```typescript
// lib/matching.ts - getUserLikes 函数（Line 62-64）
.orderBy(desc(matches.createdAt));

// 目的：按时间倒序显示用户的 like 记录
```

#### 使用场景 C：显示匹配信息

```typescript
// lib/matching.ts - getMatchesWithFeedback 函数（Line 470）
createdAt: match.createdAt?.toISOString()

// 用途：返回给前端显示匹配创建时间
```

**总结**：`created_at` 是关键字段 ✅
- ✅ 用于排序查询
- ✅ 用于找到最新记录
- ✅ 用于显示创建时间

---

### 2. `updated_at` 的使用 ⚠️

#### 唯一使用场景：更新联系状态

```typescript
// app/api/matches/update-status/route.ts（Line 69）
await db.update(matches)
  .set({
    contactStatus,
    contactUpdatedAt: new Date(),
    updatedAt: new Date(), // ← 只在这里使用
  })
```

**作用**：当用户更新 `contact_status`（联系进度）时，同时更新 `updated_at`。

#### 核心问题：历史记录模式下的意义

在历史记录模式下：
- ❌ `createMatch()` 和 `rejectMatch()` **不会修改旧记录**，只会插入新记录
- ❌ 新插入的记录中，`created_at` 和 `updated_at` 相同（都是插入时间）
- ✅ **只有** `contact_status` 更新时，`updated_at` 才会改变

---

## 📈 数据示例分析

### 情况 1：历史记录模式下的正常流程

```sql
-- 记录 1: User A 第一次 like User B
INSERT: created_at = '2025-10-01 10:00:00', updated_at = '2025-10-01 10:00:00'

-- 记录 2: User B like User A，匹配成功
INSERT: created_at = '2025-10-02 11:00:00', updated_at = '2025-10-02 11:00:00'
        status = 'accepted'

-- 记录 2 的更新：User A 添加了联系方式
UPDATE: updated_at = '2025-10-03 12:00:00' ← 这时 updated_at 才会改变
        contact_status = 'contacted'
        contact_updated_at = '2025-10-03 12:00:00'
```

### 情况 2：用户改变主意

```sql
-- 记录 1: User A dislike User C
INSERT: created_at = '2025-10-01 10:00:00', updated_at = '2025-10-01 10:00:00'
        action_type = 'dislike', status = 'rejected'

-- 记录 2: User A 第二轮改变主意，like User C
INSERT: created_at = '2025-10-05 15:00:00', updated_at = '2025-10-05 15:00:00'
        action_type = 'like', status = 'pending'
```

**观察**：
- 每条新记录的 `created_at` = `updated_at`（插入时）
- 只有 `contact_status` 更新时，`updated_at` 才会不同

---

## 🎯 在匹配逻辑中的应用

### 当前匹配逻辑使用的字段 ✅

```typescript
// 1. 查询最新记录 → 使用 created_at
.orderBy(desc(matches.createdAt))

// 2. 判断最新操作 → 基于 created_at 排序后的第一条记录
const myLatest = myRecords[0];  // 最新的 action_type
const partnerLatest = partnerRecords[0];

// 3. 决策逻辑
if (partnerLatest?.actionType === 'like') { /* 双向匹配 */ }
if (myLatest?.actionType === 'like') { /* 避免重复 */ }
```

**结论**：匹配逻辑 **只使用 `created_at`**，不使用 `updated_at`。

### `updated_at` 的实际用途 ⚠️

```typescript
// 唯一用途：contact_status 更新
// 场景：匹配成功后，用户更新联系进度

User 查看联系方式 → contact_status = 'contacted', updated_at = NOW()
User 安排面试 → contact_status = 'scheduled', updated_at = NOW()
User 完成面试 → contact_status = 'completed', updated_at = NOW()
```

**问题**：
- `updated_at` 和 `contact_updated_at` 功能重复 ❌
- `contact_updated_at` 更明确，专门用于联系状态更新 ✅

---

## 💡 问题分析

### 问题 1：`updated_at` 的意义不大 ⚠️

在历史记录模式下：
1. ✅ **核心逻辑依赖 `created_at`**（用于排序和查找最新记录）
2. ⚠️ **`updated_at` 只在 `contact_status` 更新时有用**
3. ❓ **但已经有 `contact_updated_at` 字段了**

### 问题 2：字段冗余

```typescript
// 这两个字段功能重复
updated_at: timestamp('updated_at')           // 通用更新时间
contact_updated_at: timestamp('contact_updated_at') // 联系状态更新时间

// 在实际使用中
.set({
  contactStatus: 'contacted',
  updatedAt: new Date(),       // ← 这个
  contactUpdatedAt: new Date() // ← 和这个总是同时更新
})
```

---

## 📋 优化建议

### 方案 A：保留现状（推荐）✅

**理由**：
1. ✅ 符合常见数据库设计规范（大多数表都有 `created_at` 和 `updated_at`）
2. ✅ 为未来扩展预留空间
3. ✅ 不需要修改现有代码
4. ✅ 不占用多少存储空间

**结论**：保持不变 ✅

### 方案 B：移除 `updated_at`（不推荐）❌

如果只保留 `contact_updated_at`：

**优点**：
- ✅ 减少冗余字段
- ✅ 语义更清晰

**缺点**：
- ❌ 不符合常见设计模式
- ❌ 需要修改数据库和代码
- ❌ 如果未来有其他更新需求，又要加回来

---

## 🎯 总结

### `created_at` 的作用 ✅

| 用途 | 重要性 | 说明 |
|-----|--------|------|
| **排序查询** | ⭐⭐⭐⭐⭐ | 核心功能：找到最新记录 |
| **判断最新操作** | ⭐⭐⭐⭐⭐ | 匹配逻辑的基础 |
| **显示时间** | ⭐⭐⭐⭐ | 前端显示匹配时间 |

### `updated_at` 的作用 ⚠️

| 用途 | 重要性 | 说明 |
|-----|--------|------|
| **contact_status 更新** | ⭐⭐⭐ | 与 contact_updated_at 重复 |
| **匹配逻辑** | ⭐ | 不使用此字段 |
| **历史记录模式** | ⭐ | 新记录时无意义 |

### 匹配逻辑使用的字段

```typescript
✅ created_at     - 核心字段，用于排序和查找最新记录
✅ action_type    - 判断用户的操作类型
✅ status         - 判断匹配状态
❌ updated_at     - 不使用
```

### 最终建议

**保留 `created_at` 和 `updated_at` 两个字段** ✅

**原因**：
1. ✅ `created_at` 是核心字段，绝对需要
2. ✅ `updated_at` 虽然使用少，但符合设计规范
3. ✅ 未来可能会有其他更新需求（如添加备注、修改 action_type 等）
4. ✅ 保持数据库设计的一致性和可扩展性

---

## 📊 补充说明

### 为什么历史记录模式下 `created_at` 如此重要？

```typescript
// 场景：User A 对 User B 的操作历史
[
  { id: 1, action_type: 'dislike', created_at: '2025-10-01' },  // 第一次
  { id: 5, action_type: 'like',    created_at: '2025-10-05' },  // 改变主意
  { id: 8, action_type: 'cancel',  created_at: '2025-10-08' },  // 又取消了
]

// 查询逻辑
.orderBy(desc(matches.createdAt)) // ← 按时间倒序
const myLatest = myRecords[0]     // ← 获取最新记录 (id: 8)

// 决策
if (myLatest.action_type === 'cancel') {
  // 用户最新操作是取消，可以显示为 "已取消"
}
```

**结论**：`created_at` 是历史记录模式的核心，用于追踪用户的最新状态。

---

## 🔧 实现细节

### Drizzle ORM 的 defaultNow()

```typescript
createdAt: timestamp('created_at').defaultNow().notNull()
updatedAt: timestamp('updated_at').defaultNow().notNull()
```

**行为**：
- `defaultNow()` 只在 **INSERT** 时自动设置
- **UPDATE** 时需要手动设置

**这意味着**：
```typescript
// INSERT 时
db.insert(matches).values({
  user1Id: 1,
  user2Id: 2,
  actionType: 'like',
  // created_at 和 updated_at 自动设置为 NOW()
})

// UPDATE 时
db.update(matches).set({
  contactStatus: 'contacted',
  updatedAt: new Date(), // ← 必须手动设置
})
```

---

## 最终建议总结

✅ **保留 `created_at` 和 `updated_at`**
- `created_at`：核心字段，用于历史记录排序
- `updated_at`：虽然使用少，但符合设计规范
- 两者都不占用多少空间
- 为未来扩展预留空间

❌ **不建议删除任何时间戳字段**

📝 **当前状态**：设计合理，无需修改

