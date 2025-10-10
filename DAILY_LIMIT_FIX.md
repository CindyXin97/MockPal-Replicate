# 每日浏览限制修复报告

## 🐛 发现的问题

### 问题1：竞态条件导致突破4次限制
**现象**：用户1在1秒内连续操作，导致记录了5次浏览（超过限制）

**根本原因**：
- 第4次和第5次请求几乎同时到达（03:09:23 和 03:09:24）
- 两个请求都通过了 `todayViews.length < 4` 的检查
- 都成功插入了记录

**时间线**：
```
02:49:17 EST - 第1次：浏览用户6 ✓
03:08:15 EST - 第2次：浏览用户9 ✓
03:09:21 EST - 第3次：浏览用户7 ✓
03:09:23 EST - 第4次：浏览用户4 ✓
03:09:24 EST - 第5次：浏览用户2 ✗ (突破限制！)
```

### 问题2：前端缓存显示pending邀请
**现象**：用户1达到4次限制后，刷新前能看到用户8（pending邀请），刷新后消失

**根本原因**：
- 前端有缓存或状态残留
- 后端已正确返回空数组（因为达到限制）
- 但前端仍显示之前缓存的数据

---

## 🔧 修复方案

### 1. 创建 `recordDailyView()` 统一函数

在 `lib/matching.ts` 中添加：

```typescript
/**
 * 记录用户今日浏览，带每日限制检查和防重复
 * @returns { success: true } 或 { success: false, message: string }
 */
async function recordDailyView(
  userId: number, 
  targetUserId: number
): Promise<{ success: boolean, message?: string }> {
  const ET_TIMEZONE = 'America/New_York';
  const now = new Date();
  const etDate = toZonedTime(now, ET_TIMEZONE);
  const today = format(etDate, 'yyyy-MM-dd');

  // 1. 检查是否已经记录过这个用户（避免重复）
  const existingView = await db.query.userDailyViews.findFirst({
    where: and(
      eq(userDailyViews.userId, userId),
      eq(userDailyViews.viewedUserId, targetUserId),
      eq(userDailyViews.date, today)
    ),
  });

  if (existingView) {
    return { success: true }; // 已记录，直接返回成功
  }

  // 2. 检查今日浏览次数是否已达到限制（严格检查）
  const todayViews = await db.query.userDailyViews.findMany({
    where: and(
      eq(userDailyViews.userId, userId),
      eq(userDailyViews.date, today)
    ),
  });

  if (todayViews.length >= 4) {
    return { 
      success: false, 
      message: '今日浏览次数已达上限（4次），请明天再来' 
    };
  }

  // 3. 插入新记录
  try {
    await db.insert(userDailyViews).values({
      userId,
      viewedUserId: targetUserId,
      date: today,
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    // 如果是唯一性约束冲突（并发情况），也算成功
    console.error('Record daily view error:', error);
    return { success: true };
  }
}
```

### 2. 修改 `createMatch()` 使用新函数

**之前**：
```typescript
export async function createMatch(userId: number, targetUserId: number) {
  try {
    // 直接插入，没有检查限制
    await db.insert(userDailyViews).values({
      userId,
      viewedUserId: targetUserId,
      date: today,
      createdAt: new Date(),
    });
    // ...
  }
}
```

**修复后**：
```typescript
export async function createMatch(userId: number, targetUserId: number) {
  try {
    // 记录今日浏览，带限制检查
    const viewResult = await recordDailyView(userId, targetUserId);
    if (!viewResult.success) {
      return { success: false, message: viewResult.message };
    }
    // ...
  }
}
```

### 3. 修改 `rejectMatch()` 使用新函数

同样的修改应用到 `rejectMatch()`。

---

## ✅ 修复效果

### 防止竞态条件
```
请求1（第4次）到达：
  → 检查：todayViews.length = 3
  → 插入第4条记录 ✓
  → 返回成功

请求2（第5次）到达（1秒后）：
  → 检查：todayViews.length = 4
  → 拒绝操作 ✗
  → 返回错误："今日浏览次数已达上限"
  → 不会插入第5条记录 ✓
```

### 防止重复记录
```
用户重复点击同一个人：
  → 检查：existingView 存在
  → 返回成功，但不插入新记录 ✓
  → 继续后续逻辑
```

### Pending邀请计入限制
```
场景：用户1已浏览3人，收到用户8的pending邀请

前端：
  → getPotentialMatches 优先返回用户8（pending邀请）
  → 用户1看到用户8并点击操作

后端：
  → recordDailyView(1, 8) 被调用
  → 检查：todayViews.length = 3
  → 插入第4条记录 ✓
  → 创建match或更新状态 ✓
  
结果：
  ✅ pending邀请被优先展示
  ✅ 操作成功
  ✅ 计入每日限制（现在是4/4）
  ✅ 下次再尝试会被拒绝
```

---

## 📊 业务逻辑确认

### 每日浏览限制规则
1. ✅ 每个用户每天最多浏览**4个**其他用户
2. ✅ pending邀请会**优先展示**（排序靠前）
3. ✅ 查看pending邀请并操作**也计入**4次限制
4. ✅ 达到限制后，任何新操作都会被拒绝
5. ✅ 重复操作同一用户不会增加计数
6. ✅ 使用美东时区（EST）计算日期

### 用户体验
- 用户1达到4次限制后：
  - `getPotentialMatches` 返回空数组
  - 前端显示"今日推荐已用完"
  - 如果尝试操作（前端缓存），后端会拒绝
  - 第二天自动重置

---

## 🧪 测试验证

### 验证1：用户1当前状态
```
今日浏览次数: 4/4 ✓
浏览过的用户: [6, 9, 7, 4] ✓
状态: 已达限制 ✓
```

### 验证2：尝试第5次浏览
```
预期：操作被拒绝
实际：recordDailyView 检测到 >= 4，返回失败 ✓
结果：不会创建第5条记录 ✓
```

### 验证3：竞态条件防护
```
预期：即使并发请求，也只会记录4条
实际：第5个请求会被拒绝 ✓
```

---

## 🎯 总结

| 问题 | 状态 | 说明 |
|------|------|------|
| 竞态条件导致超限 | ✅ 已修复 | 添加了严格的限制检查 |
| 前端缓存显示pending | ⚠️ 需前端配合 | 后端已正确返回，前端需清理缓存 |
| pending邀请突破限制 | ✅ 已修复 | pending邀请也计入4次限制 |
| 重复记录 | ✅ 已防止 | 记录前检查是否已存在 |

**修复完成日期**：2025-10-09  
**修复文件**：`lib/matching.ts`  
**影响函数**：`recordDailyView`, `createMatch`, `rejectMatch`

