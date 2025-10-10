# 匹配逻辑重大修复报告

## 🐛 发现的核心问题

用户发现了一个严重的逻辑bug："被动匹配邀请"机制存在问题。

### 问题表现

数据库中有10条 `rejected` 状态的匹配记录，但**接收方没有任何view记录**：

```
匹配#9: 用户6 → 用户3 (rejected)
  - 发起方(用户6)有view记录: ✅
  - 接收方(用户3)有view记录: ❌  ← 问题！
```

### 问题分析

如果匹配状态是 `rejected`，只有两种可能：
1. **接收方拒绝了邀请** → 应该有接收方的view记录 ✓
2. **发起方改变主意** → 不应该是rejected状态，应该删除或保持pending

但数据显示：**接收方没有view记录，状态却是rejected**！

这说明：**之前的代码允许发起方单方面把pending改成rejected**。

---

## 🔍 根本原因

### Bug 1: `rejectMatch` 函数没有检查用户身份

**之前的代码**（第299-304行）：

```typescript
if (existingMatch) {
  // 更新状态为拒绝
  await db
    .update(matches)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(eq(matches.id, existingMatch.id));
}
```

**问题**：无论当前用户是发起方还是接收方，都会直接更新为rejected！

**错误场景**：
```
1. 用户6向用户3发送邀请
   → match: 6→3 (pending)
   → view: 6→3

2. 用户6改变主意，点击"X"（拒绝）
   → 调用 rejectMatch(6, 3)
   → 找到 existingMatch (6→3, pending)
   → 直接更新为 rejected ❌
   
结果：
   → match: 6→3 (rejected)
   → view: 只有6→3
   → 用户3从未操作，但match已经是rejected了！
```

### Bug 2: `createMatch` 函数允许发起方单方面改状态

**之前的代码**（第247-254行）：

```typescript
// 自己已发出邀请，等待对方回应
if (existingMatch.user1Id === userId && existingMatch.status === 'pending') {
  await db
    .update(matches)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(eq(matches.id, existingMatch.id));

  return successResponse({ match: true }, '匹配成功！');
}
```

**问题**：发起方重复点击"匹配"按钮，会单方面把pending改成accepted！

**错误场景**：
```
1. 用户A向用户B发送邀请
   → match: A→B (pending)

2. 用户A再次点击"匹配"
   → 调用 createMatch(A, B)
   → 找到 existingMatch (A→B, pending)
   → 单方面更新为 accepted ❌
   
结果：
   → match: A→B (accepted)
   → 用户B从未操作，但已经"匹配成功"了！
```

---

## ✅ 修复方案

### 修复1: `rejectMatch` - 区分用户身份

```typescript
if (existingMatch) {
  // 检查当前用户的身份
  if (existingMatch.user1Id === userId) {
    // 情况1：当前用户是发起方
    // 场景：用户A之前向用户B发送了pending邀请，现在想取消
    // 正确做法：删除pending记录，不是改成rejected
    if (existingMatch.status === 'pending') {
      await db.delete(matches).where(eq(matches.id, existingMatch.id));
      return successResponse({}, '已取消对该用户的邀请');
    } else {
      // 如果状态已经是accepted或rejected，说明对方已经回应了
      return { success: false, message: '该匹配已完成，无法修改' };
    }
  } else if (existingMatch.user2Id === userId) {
    // 情况2：当前用户是接收方
    // 场景：用户B收到用户A的pending邀请，选择拒绝
    // 正确做法：更新为rejected
    await db
      .update(matches)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(matches.id, existingMatch.id));
    return successResponse({}, '已拒绝该匹配');
  }
}
```

### 修复2: `createMatch` - 防止重复点击改变状态

```typescript
// 自己已发出邀请，等待对方回应
if (existingMatch.user1Id === userId && existingMatch.status === 'pending') {
  // 不应该改变状态！只是重复点击而已
  return successResponse({ match: false }, '已收到你的喜欢！等待对方回应。');
}
```

### 修复3: `createMatch` - 正确处理rejected状态重新匹配

```typescript
if (existingMatch.status === 'rejected') {
  // 需要检查是谁拒绝的
  if (existingMatch.user1Id === userId) {
    // 情况1：自己之前发起并拒绝了对方（或被对方拒绝）
    // 现在想重新匹配，更新为pending
    await db.update(matches)
      .set({ 
        status: 'pending',
        user1Id: userId,
        user2Id: targetUserId,
        updatedAt: new Date() 
      })
      .where(eq(matches.id, existingMatch.id));
    return successResponse({ match: false }, '已收到你的喜欢！等待对方回应。');
  } else {
    // 情况2：对方之前发起并拒绝了自己
    // 现在自己想匹配对方，需要创建新的pending
    await db.insert(matches).values({
      user1Id: userId,
      user2Id: targetUserId,
      status: 'pending',
    });
    return successResponse({ match: false }, '已收到你的喜欢！等待对方回应。');
  }
}
```

---

## 📋 正确的业务逻辑

### 场景1: 用户A选择用户B（第一次）

```
操作：用户A点击"❤️"匹配用户B
结果：
  - view记录: A→B ✓
  - match记录: A→B (pending) ✓
  - 提示: "已收到你的喜欢！等待对方回应。"
```

### 场景2: 用户B看到并接受

```
操作：用户B看到用户A的邀请，点击"❤️"接受
结果：
  - view记录: A→B, B→A ✓
  - match记录: A↔B (accepted) ✓
  - 提示: "匹配成功！"
```

### 场景3: 用户B看到并拒绝

```
操作：用户B看到用户A的邀请，点击"✖️"拒绝
结果：
  - view记录: A→B, B→A ✓
  - match记录: A→B (rejected) ✓
  - 提示: "已拒绝该匹配"
```

### 场景4: 用户A取消邀请

```
操作：用户A之前向用户B发送了邀请，现在改变主意，点击"✖️"
结果：
  - view记录: A→B ✓
  - match记录: 删除 ✓
  - 提示: "已取消对该用户的邀请"
```

### 场景5: 用户A重复点击

```
操作：用户A已经向用户B发送了邀请，再次点击"❤️"
结果：
  - view记录: A→B ✓
  - match记录: A→B (pending) ✓ (状态不变)
  - 提示: "已收到你的喜欢！等待对方回应。"
```

### 场景6: 用户A第一次看到就拒绝

```
操作：用户A浏览到用户B，第一次见面就点击"✖️"
结果：
  - view记录: A→B ✓
  - match记录: A→B (rejected) ✓
  - 说明: 这是A主动拒绝，不是B的邀请
```

---

## 🎯 核心原则

### 1. Match状态的含义

- **pending**: 发起方向接收方发送邀请，等待回应
  - 只有发起方有view记录
  - 接收方还没操作

- **accepted**: 双方都同意匹配
  - 双方都有view记录
  - 可以看到联系方式

- **rejected**: 有人拒绝了匹配
  - 如果是接收方拒绝：双方都有view记录
  - 如果是发起方第一次就拒绝：只有发起方有view记录

### 2. 操作权限

| 操作 | 发起方 | 接收方 |
|------|--------|--------|
| 创建pending | ✅ | ✅ |
| 取消pending | ✅ (删除记录) | ❌ |
| 接受pending | ❌ | ✅ (→accepted) |
| 拒绝pending | ❌ | ✅ (→rejected) |
| 第一次就拒绝 | ✅ (创建rejected) | ✅ (创建rejected) |

### 3. View记录规则

- **每次点击操作（❤️或✖️）都必须先创建view记录**
- **接收方回应邀请时，也要创建view记录**
- **view记录计入每日4次限制**
- **包括回应pending邀请也计入限制**

### 4. "被动匹配邀请"的正确理解

**❌ 错误理解**：
- 收到邀请就是"被动匹配"
- 可以免费看到对方信息
- 不计入每日限制

**✅ 正确理解**：
- 收到pending邀请只是"优先展示"
- 点击操作时，仍然要计入每日限制
- 仍然要创建view记录
- 没有"免费"操作

---

## 🔧 历史数据清理

发现的10条不一致记录（rejected但接收方无view记录）：

```
1. 匹配#13: 用户5 → 用户1 (rejected)
2. 匹配#38: 用户2 → 用户8 (rejected)
3. 匹配#7: 用户6 → 用户5 (rejected)
4. 匹配#8: 用户6 → 用户4 (rejected)
5. 匹配#9: 用户6 → 用户3 (rejected)
6. 匹配#10: 用户5 → 用户4 (rejected)
7. 匹配#11: 用户5 → 用户3 (rejected)
8. 匹配#12: 用户5 → 用户2 (rejected)
9. 匹配#15: 用户7 → 用户5 (rejected)
10. 匹配#17: 用户7 → 用户3 (rejected)
```

**建议处理**：
1. 保留这些历史数据（作为bug的证据）
2. 或者删除这些rejected记录，让用户可以重新匹配

---

## ✅ 修复完成

- [x] 修复 `rejectMatch` 函数 - 区分用户身份
- [x] 修复 `createMatch` 函数 - 防止重复点击改状态
- [x] 修复 `createMatch` 函数 - 正确处理rejected重新匹配
- [x] 无linter错误
- [x] 业务逻辑清晰文档化

**修复日期**: 2025-10-09  
**修复文件**: `lib/matching.ts`  
**影响函数**: `createMatch`, `rejectMatch`

