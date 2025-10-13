# 匹配系统逻辑说明（正确版本）

**更新日期**: 2025-10-13  
**版本**: v2.0

---

## 📚 核心概念

### 记录的含义

**每条匹配记录代表一个单向操作**：

```
user1_id → user2_id, status
```

**含义**：`user1_id` 对 `user2_id` 做了某个操作（status）

**三种状态**：
- `pending`: user1_id **喜欢** user2_id，等待对方回应
- `rejected`: user1_id **拒绝** user2_id
- `accepted`: 双方互相喜欢（**匹配成功**）

---

## 🎯 合法的记录组合

### 1. 单向记录（正常情况）

```
只有一条记录：
- User A → User B, pending   (A 喜欢 B，等待 B 回应)
- User A → User B, rejected  (A 拒绝了 B)
```

### 2. 双向不同状态（正常情况，**应该保留**）

```
两条不同方向的记录：
✅ (A→B, rejected) + (B→A, pending)
   含义: A拒绝了B，但B喜欢A
   
✅ (A→B, pending) + (B→A, rejected)
   含义: A喜欢B，但B拒绝了A
```

**重要**：这两种情况是**完全合法**的，记录了双方的独立操作，**不应该删除任何记录**！

### 3. 双向 pending（需要合并）

```
两条都是 pending：
⚠️  (A→B, pending) + (B→A, pending)
   含义: A喜欢B，B也喜欢A
   
操作: 应该合并为一条 accepted 记录
   → 保留较早的记录，更新为 accepted
   → 删除较晚的记录
```

### 4. 相同方向重复（异常情况，需要合并）

```
相同方向有多条记录：
❌ (A→B, rejected) + (A→B, pending)
   含义: A第一轮拒绝了B，第二轮改变主意喜欢B
   
操作: 只保留最新状态
   → 更新 rejected 为 pending
   → 不应该创建新记录
```

---

## 🔄 用户操作流程

### createMatch (用户点击"喜欢")

**场景分析**：

#### 场景1: 第一次操作
```
当前: 无记录
操作: User A like User B
结果: 创建 (A→B, pending)
```

#### 场景2: 对方已经喜欢我
```
当前: (B→A, pending)
操作: User A like User B
结果: 
  - 更新 (B→A, pending) → (B→A, accepted)
  - 不创建新记录
  - 返回"匹配成功"
```

#### 场景3: 我之前拒绝过，第二轮改变主意
```
当前: (A→B, rejected)
操作: User A like User B
结果:
  - 更新 (A→B, rejected) → (A→B, pending)
  - 不创建新记录
  - 返回"等待对方回应"
```

#### 场景4: 对方已经拒绝了我
```
当前: (B→A, rejected)
操作: User A like User B
结果:
  - 如果我有 rejected: 更新 (A→B, rejected) → (A→B, pending)
  - 否则: 创建 (A→B, pending)
  - 保留 (B→A, rejected) ✅
  - 返回"等待对方回应"
  
注意: B拒绝了A，但A仍然可以喜欢B（第二轮）
```

#### 场景5: 我已经发出过邀请
```
当前: (A→B, pending)
操作: User A like User B (重复点击)
结果:
  - 不做任何修改
  - 返回"等待对方回应"
```

### rejectMatch (用户点击"不喜欢")

**场景分析**：

#### 场景1: 第一次操作
```
当前: 无记录
操作: User A dislike User B
结果: 创建 (A→B, rejected)
```

#### 场景2: 取消自己的邀请
```
当前: (A→B, pending)
操作: User A dislike User B
结果:
  - 删除 (A→B, pending)
  - 返回"已取消邀请"
```

#### 场景3: 拒绝对方的邀请
```
当前: (B→A, pending)
操作: User A dislike User B
结果:
  - 更新 (B→A, pending) → (B→A, rejected)
  - 不删除记录 ✅
  - 返回"已拒绝匹配"
```

#### 场景4: 我已经拒绝过（重复操作）
```
当前: (A→B, rejected)
操作: User A dislike User B
结果:
  - 更新时间戳
  - 返回"操作成功"
```

---

## 📊 数据示例

### 示例1: 单方面喜欢

```
Time 1: User 17 like User 7
  → 创建: (17→7, pending)
  
当前状态:
  记录 53: User 17 → User 7, pending ✅
  
含义: User 17 等待 User 7 回应
```

### 示例2: 双向匹配成功

```
Time 1: User 17 like User 7
  → 创建: (17→7, pending)
  
Time 2: User 7 like User 17
  → 更新: (17→7, pending) → (17→7, accepted)
  
当前状态:
  记录 53: User 17 → User 7, accepted ✅
  
含义: 双方互相喜欢，匹配成功
```

### 示例3: 单方面拒绝（**应该保留两条记录**）

```
Time 1: User 20 dislike User 7
  → 创建: (20→7, rejected)
  
Time 2: User 7 like User 20
  → 创建: (7→20, pending)
  
当前状态:
  记录 72: User 20 → User 7, rejected ✅
  记录 73: User 7 → User 20, pending  ✅
  
含义: 
  - User 20 拒绝了 User 7
  - User 7 喜欢 User 20（不知道被拒绝了）
  
**重要**: 这两条记录都应该保留！不是重复！
```

### 示例4: 第二轮改变主意

```
Time 1: User A dislike User B (第一轮)
  → 创建: (A→B, rejected)
  
Time 2: User A like User B (第二轮)
  → 更新: (A→B, rejected) → (A→B, pending)
  
当前状态:
  记录: User A → User B, pending ✅
  
含义: User A 第二轮改变主意了
```

---

## 🔍 推荐系统的排除逻辑

在 `getPotentialMatches` 中，需要正确排除用户：

### 第一轮浏览

**排除规则**：
```typescript
// 排除所有已浏览过的用户（userDailyViews中的记录）
excludedIds = [userId, ...allViewedUserIds];

// 但是：对方发起的pending邀请不应该排除（优先展示）
const pendingInvitationsToMe = matches.filter(m => 
  m.user2Id === userId && 
  m.status === 'pending'
).map(m => m.user1Id);

excludedIds = excludedIds.filter(id => !pendingInvitationsToMe.includes(id));
```

### 第二轮浏览（浏览完所有人后）

**排除规则**：
```typescript
// 只排除 accepted 用户
const acceptedUserIds = matches.filter(m => 
  m.status === 'accepted'
).map(m => m.user1Id === userId ? m.user2Id : m.user1Id);

excludedIds = [userId, ...acceptedUserIds, ...viewedTodayIds];
```

**重要**：第二轮**不排除** rejected 用户，允许用户改变主意！

---

## ✅ 正确的处理逻辑总结

### createMatch 逻辑

```typescript
1. 查询所有相关记录（双向）
2. 按方向分类：myRecords vs partnerRecords
3. 按状态分类：pending, rejected, accepted
4. 优先级处理：
   a. 如果有 accepted → 返回"已匹配"
   b. 如果对方有 pending → 更新为 accepted（匹配成功）
      - 删除自己的 pending/rejected（如果有）
   c. 如果对方有 rejected → 创建/更新自己的 pending
      - **保留对方的 rejected** ✅
   d. 如果自己有 pending → 返回"等待回应"
   e. 如果自己有 rejected → 更新为 pending
   f. 否则 → 创建新 pending
```

### rejectMatch 逻辑

```typescript
1. 查询所有相关记录（双向）
2. 按方向分类：myRecords vs partnerRecords
3. 按状态分类：pending, rejected, accepted
4. 优先级处理：
   a. 如果有 accepted → 返回"无法修改"
   b. 如果自己有 pending → 删除（取消邀请）
      - **不影响对方的任何记录** ✅
   c. 如果对方有 pending → 更新为 rejected（拒绝邀请）
      - **不删除，只更新状态** ✅
   d. 如果自己有 rejected → 更新时间戳
   e. 否则 → 创建新 rejected
```

---

## ⚠️ 重要提醒

### 什么情况下删除记录？

**只有以下情况才删除记录**：

1. ✅ 双向 pending 合并为 accepted 时，删除其中一条
2. ✅ 取消自己的 pending 邀请时，删除自己的记录
3. ✅ 匹配成功时，删除自己的多余状态（pending/rejected）

### 什么情况下**不应该**删除？

**以下情况绝对不能删除**：

1. ❌ 不同方向的 rejected 和 pending 记录
2. ❌ 对方的任何记录（除非是双向 pending 合并）
3. ❌ 第一轮的数据记录

---

## 🐛 之前的错误

### 错误的修复脚本（已回滚）

```typescript
// ❌ 错误：删除了 rejected 记录
处理 User 7 ↔ User 20:
  pending: 1, accepted: 0, rejected: 1
  → 保留 pending，删除 rejected  // ❌ 不应该删除！
  
// ✅ 正确：应该保留两条记录
处理 User 7 ↔ User 20:
  pending: 1, accepted: 0, rejected: 1
  → 保留两条记录（不同方向，合法）
```

### 正确的判断

```typescript
// 判断是否是真正的重复
function isRealDuplicate(records) {
  // 情况1: 相同方向有多条 → 重复
  if (records.filter(r => r.user1Id === records[0].user1Id).length > 1) {
    return true;
  }
  
  // 情况2: 双向 pending → 需要合并
  if (records.filter(r => r.status === 'pending').length === 2) {
    return true;
  }
  
  // 其他情况：不是重复，保留所有记录
  return false;
}
```

---

## 📋 测试用例

### 测试1: 正常匹配流程
```
1. User A like User B → (A→B, pending)
2. User B like User A → (A→B, accepted)
期望: 只有一条 accepted 记录
```

### 测试2: 单方面拒绝
```
1. User A dislike User B → (A→B, rejected)
2. User B like User A → (B→A, pending)
期望: 两条记录都保留
```

### 测试3: 第二轮改变主意
```
1. User A dislike User B → (A→B, rejected)
2. (第二轮) User A like User B → 更新为 (A→B, pending)
期望: 只有一条 pending 记录，updated_at 更新
```

### 测试4: 双向拒绝
```
1. User A dislike User B → (A→B, rejected)
2. User B dislike User A → (B→A, rejected)
期望: 两条 rejected 记录都保留
```

### 测试5: 先拒绝后接受
```
1. User A like User B → (A→B, pending)
2. User B dislike User A → 更新为 (A→B, rejected)
3. (第二轮) User B like User A → 创建 (B→A, pending)
期望: (A→B, rejected) + (B→A, pending)
```

---

## 📈 数据一致性检查

定期运行以下检查：

```typescript
// 检查1: 相同方向不应该有多条记录
SELECT user1_id, user2_id, COUNT(*) 
FROM matches 
GROUP BY user1_id, user2_id 
HAVING COUNT(*) > 1;
// 应该返回空结果

// 检查2: 双向 pending 应该合并为 accepted
// 手动检查或通过脚本自动修复

// 检查3: accepted 记录应该只有一条
SELECT user1_id, user2_id 
FROM matches 
WHERE status = 'accepted' 
GROUP BY LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)
HAVING COUNT(*) > 1;
// 应该返回空结果
```

---

## 🎓 总结

**关键原则**：
1. 每条记录代表一个单向操作
2. 不同方向的记录可以且应该共存
3. 只有相同方向的重复和双向 pending 需要处理
4. 不要随意删除记录，特别是对方的记录
5. 第二轮浏览应该允许用户改变主意

**数据完整性优先于简洁性**！

