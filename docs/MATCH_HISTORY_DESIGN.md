# 匹配系统历史记录设计方案

**目标**：记录每个用户的所有操作 touch points，不修改历史记录

---

## 方案对比

### 方案 A：添加 action_type 字段（推荐）

**数据库 Schema**：
```sql
ALTER TABLE matches ADD COLUMN action_type VARCHAR(20);
-- action_type: 'like' | 'dislike' | NULL (历史数据)

-- status 保留，表示该记录对匹配状态的影响
-- 'pending': 单方面 like，等待回应
-- 'accepted': 双方 like，匹配成功
-- 'rejected': 单方面 dislike，或拒绝对方
```

**记录示例**：
```
记录 1: user1_id=A, user2_id=B, action_type='like', status='pending'
  含义: A 喜欢 B，等待 B 回应

记录 2: user1_id=B, user2_id=A, action_type='like', status='accepted'
  含义: B 喜欢 A，双方匹配成功
  
记录 3: user1_id=A, user2_id=C, action_type='dislike', status='rejected'
  含义: A 不喜欢 C (第一次)

记录 4: user1_id=A, user2_id=C, action_type='dislike', status='rejected'
  含义: A 不喜欢 C (第二次，第二轮)
  
记录 5: user1_id=A, user2_id=C, action_type='like', status='pending'
  含义: A 改变主意，喜欢 C (第三次)
```

**优点**：
- ✅ action_type 记录用户真实操作
- ✅ status 方便快速查询当前状态
- ✅ 兼容现有逻辑（只需添加字段）
- ✅ 可以分析用户行为变化

**缺点**：
- status 字段有点冗余（但提升查询性能）

---

### 方案 B：纯历史记录（最简单）

**数据库 Schema**：
```sql
-- 移除 UNIQUE 约束
-- 只保留：
- id
- user1_id
- user2_id
- action: 'like' | 'dislike'
- created_at
```

**记录示例**：
```
记录 1: A, B, 'like', 2025-10-09
记录 2: B, A, 'like', 2025-10-10
记录 3: A, C, 'dislike', 2025-10-09
记录 4: A, C, 'dislike', 2025-10-12
记录 5: A, C, 'like', 2025-10-13
```

**优点**：
- ✅ 最简单的设计
- ✅ 完全历史记录

**缺点**：
- ❌ 查询当前状态需要复杂的聚合逻辑
- ❌ 性能问题（每次都要扫描所有历史）
- ❌ 需要重写所有查询逻辑

---

### 方案 C：双表设计（最复杂但最完整）

**Schema 1: match_actions（历史表）**
```sql
CREATE TABLE match_actions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  target_user_id INT NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'like' | 'dislike'
  created_at TIMESTAMP NOT NULL
);
```

**Schema 2: match_states（状态表）**
```sql
-- 保留现有的 matches 表
-- 但改为通过触发器或应用逻辑维护
```

**优点**：
- ✅ 完全分离历史和状态
- ✅ 查询性能最优
- ✅ 数据分析最方便

**缺点**：
- ❌ 最复杂
- ❌ 需要同步逻辑
- ❌ 改动最大

---

## 推荐：方案 A 实现细节

### 1. 数据库迁移

```sql
-- 添加 action_type 字段
ALTER TABLE matches ADD COLUMN action_type VARCHAR(20);

-- 填充历史数据
UPDATE matches SET action_type = 
  CASE 
    WHEN status = 'pending' THEN 'like'
    WHEN status = 'rejected' THEN 'dislike'
    WHEN status = 'accepted' THEN 'like'
  END;

-- 移除 UNIQUE 约束（允许相同方向的多条记录）
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user1_id_user2_id_key;

-- 添加索引以提升查询性能
CREATE INDEX idx_matches_users_action ON matches(user1_id, user2_id, action_type);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);
```

### 2. 修改后的逻辑

#### createMatch (用户点击"喜欢")

```typescript
export async function createMatch(userId: number, targetUserId: number) {
  // 1. 记录今日浏览
  await recordDailyView(userId, targetUserId);

  // 2. 查询所有历史记录
  const allRecords = await db.select()
    .from(matches)
    .where(matchBetweenUsers(userId, targetUserId))
    .orderBy(desc(matches.createdAt)); // 按时间倒序

  // 3. 查找最新的相关记录
  const myLatest = allRecords.find(r => r.user1Id === userId);
  const partnerLatest = allRecords.find(r => r.user1Id === targetUserId);

  // 4. 检查是否已经匹配成功
  const hasAccepted = allRecords.some(r => r.status === 'accepted');
  if (hasAccepted) {
    return { success: true, match: true, message: '已经匹配成功！' };
  }

  // 5. 检查对方最新状态
  if (partnerLatest?.action_type === 'like' && partnerLatest.status !== 'accepted') {
    // 对方喜欢我，创建新的 accepted 记录
    await db.insert(matches).values({
      user1Id: userId,
      user2Id: targetUserId,
      action_type: 'like',
      status: 'accepted',
    });
    
    return { success: true, match: true, message: '匹配成功！' };
  }

  // 6. 检查自己最新状态
  if (myLatest?.action_type === 'like') {
    // 已经发过 like 了，不重复记录
    return { success: true, match: false, message: '已收到你的喜欢！等待对方回应。' };
  }

  // 7. 创建新的 like 记录
  await db.insert(matches).values({
    user1Id: userId,
    user2Id: targetUserId,
    action_type: 'like',
    status: 'pending',
  });

  return { success: true, match: false, message: '已收到你的喜欢！等待对方回应。' };
}
```

#### rejectMatch (用户点击"不喜欢")

```typescript
export async function rejectMatch(userId: number, targetUserId: number) {
  // 1. 记录今日浏览
  await recordDailyView(userId, targetUserId);

  // 2. 查询所有历史记录
  const allRecords = await db.select()
    .from(matches)
    .where(matchBetweenUsers(userId, targetUserId))
    .orderBy(desc(matches.createdAt));

  // 3. 检查是否已经匹配成功
  const hasAccepted = allRecords.some(r => r.status === 'accepted');
  if (hasAccepted) {
    return { success: false, message: '该匹配已完成，无法修改' };
  }

  // 4. 查找自己最新的记录
  const myLatest = allRecords.find(r => r.user1Id === userId);

  // 5. 检查对方是否有待处理的 like
  const partnerPending = allRecords.find(
    r => r.user1Id === targetUserId && r.action_type === 'like' && r.status === 'pending'
  );

  if (partnerPending) {
    // 对方喜欢我，我拒绝了，创建 dislike 记录，视为拒绝对方
    // 或者更新对方的记录？这里需要讨论
    await db.insert(matches).values({
      user1Id: userId,
      user2Id: targetUserId,
      action_type: 'dislike',
      status: 'rejected',
    });
    
    return { success: true, message: '已拒绝该匹配' };
  }

  // 6. 如果自己最新是 like，则取消（但不删除记录）
  // 这里有个问题：如何表示"取消"？
  // 选项1: 创建一个 'cancel' action
  // 选项2: 创建一个 'dislike' 记录（表示改变主意）
  
  // 7. 创建新的 dislike 记录
  await db.insert(matches).values({
    user1Id: userId,
    user2Id: targetUserId,
    action_type: 'dislike',
    status: 'rejected',
  });

  return { success: true, message: '操作成功' };
}
```

### 3. 查询逻辑修改

#### getSuccessfulMatches (获取匹配成功的用户)

```typescript
export async function getSuccessfulMatches(userId: number) {
  // 查询所有 status = 'accepted' 的记录
  const acceptedMatches = await db.select()
    .from(matches)
    .where(
      and(
        or(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, userId)
        ),
        eq(matches.status, 'accepted')
      )
    );

  // 按用户对分组，每对只取最新的 accepted
  const uniqueMatches = new Map();
  
  for (const match of acceptedMatches) {
    const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
    const key = `${Math.min(userId, partnerId)}-${Math.max(userId, partnerId)}`;
    
    if (!uniqueMatches.has(key) || 
        match.createdAt! > uniqueMatches.get(key).createdAt!) {
      uniqueMatches.set(key, { ...match, partnerId });
    }
  }
  
  return Array.from(uniqueMatches.values());
}
```

#### getPotentialMatches (获取推荐用户)

```typescript
// 需要查询每个用户对的最新状态
export async function getPotentialMatches(userId: number) {
  // 1. 获取所有匹配记录
  const allMatches = await db.select()
    .from(matches)
    .where(
      or(
        eq(matches.user1Id, userId),
        eq(matches.user2Id, userId)
      )
    )
    .orderBy(desc(matches.createdAt));

  // 2. 按用户对分组，找到最新状态
  const latestStatusByUser = new Map();
  
  for (const match of allMatches) {
    const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;
    
    if (!latestStatusByUser.has(partnerId)) {
      latestStatusByUser.set(partnerId, match);
    }
  }

  // 3. 排除逻辑
  const excludedIds = [userId];
  
  for (const [partnerId, latestMatch] of latestStatusByUser.entries()) {
    // 排除已 accepted 的
    if (latestMatch.status === 'accepted') {
      excludedIds.push(partnerId);
    }
    
    // 第一轮：排除已操作过的（除非对方发起了 pending）
    // 第二轮：不排除 rejected 的
    // ... 具体逻辑
  }

  // 4. 查询潜在匹配
  // ...
}
```

---

## ⚠️ 需要注意的问题

### 1. "取消"操作如何记录？

**场景**：User A like User B，然后 User A 点击 dislike（想取消）

**选项**：
- A. 创建 `(A→B, dislike)` 记录 → 表示改变主意
- B. 添加 `action_type = 'cancel'` → 明确表示取消
- C. 不允许取消，只能等对方回应

**推荐**：选项 B，添加 'cancel' 类型

### 2. 重复点击如何处理？

**场景**：User A 多次点击 like User B

**选项**：
- A. 每次都创建新记录（完全历史）
- B. 检查最新记录，如果是相同操作则不创建
- C. 限制短时间内重复操作

**推荐**：选项 B，避免无意义的重复

### 3. 数据量增长

**问题**：每次操作都创建记录，数据会快速增长

**解决方案**：
- 定期归档旧数据
- 或者只在状态改变时创建记录
- 添加数据清理策略

---

## 📊 数据示例

### 完整的用户操作历史

```
User A 和 User B 的完整历史：

记录 1: 2025-10-09 10:00
  user1_id=17, user2_id=7, action_type='like', status='pending'
  含义: User 17 喜欢 User 7

记录 2: 2025-10-10 11:00
  user1_id=7, user2_id=17, action_type='like', status='accepted'
  含义: User 7 喜欢 User 17，双方匹配成功
  
User A 和 User C 的完整历史：

记录 1: 2025-10-09 10:00
  user1_id=7, user2_id=20, action_type='dislike', status='rejected'
  含义: User 7 不喜欢 User 20 (第一轮)

记录 2: 2025-10-12 10:00
  user1_id=7, user2_id=20, action_type='dislike', status='rejected'
  含义: User 7 不喜欢 User 20 (第二轮，再次确认)

记录 3: 2025-10-15 10:00
  user1_id=7, user2_id=20, action_type='like', status='pending'
  含义: User 7 改变主意，喜欢 User 20 (第三轮)
```

---

## 🎯 实施步骤

1. **数据库迁移**
   - 添加 `action_type` 字段
   - 移除 UNIQUE 约束
   - 添加索引

2. **修改代码逻辑**
   - createMatch: 总是插入新记录
   - rejectMatch: 总是插入新记录
   - 查询函数: 按时间排序，取最新状态

3. **测试**
   - 测试各种操作序列
   - 验证数据一致性
   - 性能测试

4. **监控**
   - 监控记录增长速度
   - 设置告警阈值

---

## 问题

1. **您倾向于哪个方案？**
   - 方案 A（推荐）
   - 方案 B（简单）
   - 方案 C（复杂）

2. **取消操作如何处理？**
   - 创建 dislike 记录
   - 添加 cancel 类型
   - 不允许取消

3. **重复点击如何处理？**
   - 每次都记录
   - 检查最新记录，避免重复

4. **是否需要数据归档策略？**

请告诉我您的选择，我会立即实现！

