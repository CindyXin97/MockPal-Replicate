# 配额奖励系统 - 功能说明

## 📊 功能概述

通过真题互动获得额外匹配配额，激励用户贡献内容，解决"刷不够人"的问题。

---

## 🎯 核心机制

### 基础规则

```
基础配额：4个/天（所有用户）
奖励配额：最多+3个/天（通过完成任务获得）
奖励余额：可累积，上限6个
总配额范围：4-7个/天
```

### 任务奖励

#### 📝 发布真题
- **奖励**：+2个配额
- **条件**：每天第1篇发帖有奖励
- **限制**：每天只能获得一次

#### 💬 评论真题
- **奖励**：+1个配额
- **条件**：今天累计评论3条（≥10字）
- **限制**：每天只能获得一次

### 奖励余额

- ✅ 可以跨天累积使用
- ✅ 上限6个（防止囤积）
- ✅ 今天发帖，明天用也OK
- ✅ 使用顺序：先用基础配额，再用奖励余额

---

## 📱 用户界面

### 1. 个人界面（/me）

显示**配额进度卡片**：

```
┌─────────────────────────────────────┐
│ 💎 每日匹配配额    今日可用: 6个   │
├─────────────────────────────────────┤
│ 基础配额: 2/4  ████░░              │
│ 奖励余额: 3个  💰                   │
│                                     │
│ 📝 今日任务                         │
│                                     │
│ ✅ 发布1条真题 → +2个配额           │
│    已完成！恭喜获得奖励             │
│                                     │
│ 📊 评论进度 → +1个配额              │
│    █████░░░░░  1/3条                │
│    还差2条评论即可获得奖励          │
│                                     │
│ [去发布真题]  [去评论]              │
└─────────────────────────────────────┘
```

### 2. 匹配页面（/matches）

顶部显示当前可用配额和提示

---

## 🛠️ 技术实现

### 数据库表

**user_daily_bonus**：记录每日奖励情况

```sql
- user_id: 用户ID
- date: 日期（YYYY-MM-DD）
- posts_today: 今日发帖数
- comments_today: 今日评论数
- bonus_quota: 当天新增的奖励配额
- bonus_balance: 奖励配额余额（可累积，上限6）
```

### API接口

1. **GET /api/user/match-quota**
   - 获取用户今日配额信息
   - 返回：基础配额、奖励余额、任务进度

2. **POST /api/interview-posts**
   - 发布真题时自动检查并发放奖励
   - 返回：帖子信息 + 奖励信息

3. **POST /api/interview-comments**
   - 评论时自动累计，达到3条发放奖励
   - 返回：评论信息 + 奖励进度/奖励信息

### 匹配逻辑

修改 `lib/matching.ts`：
- `getUserDailyMatchLimit()`: 获取总配额（基础+奖励）
- `recordDailyView()`: 使用总配额进行限制检查

---

## 🚀 部署步骤

### 1. 运行数据库迁移

```bash
# 连接到生产数据库
psql "your_database_connection_string"

# 运行迁移文件
\i migrations/0014_add_quota_bonus_system.sql

# 验证表创建成功
\d user_daily_bonus
```

### 2. 部署代码

```bash
# 推送代码到main分支
git add .
git commit -m "feat: 添加配额奖励系统"
git push origin main

# Vercel会自动部署
```

### 3. 验证功能

1. 访问 `/me` 页面，查看配额卡片
2. 发布一条真题，验证+2配额
3. 评论3条，验证+1配额
4. 去匹配页面，验证可以使用更多配额

---

## 📊 数据监控

### 关键指标

```sql
-- 1. 每日奖励发放统计
SELECT 
  date,
  COUNT(DISTINCT user_id) as active_users,
  SUM(CASE WHEN posts_today > 0 THEN 1 ELSE 0 END) as users_posted,
  SUM(CASE WHEN comments_today >= 3 THEN 1 ELSE 0 END) as users_commented,
  AVG(bonus_balance) as avg_bonus_balance
FROM user_daily_bonus
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- 2. 用户奖励获取情况
SELECT 
  user_id,
  COUNT(*) as active_days,
  SUM(bonus_quota) as total_earned,
  MAX(bonus_balance) as max_balance
FROM user_daily_bonus
GROUP BY user_id
ORDER BY total_earned DESC
LIMIT 20;

-- 3. 真题发布增长
SELECT 
  DATE(created_at) as date,
  COUNT(*) as posts_count
FROM user_interview_posts
WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 预期效果

基于数据分析：
- 预计20%活跃用户会发帖 → 每周+8篇真题
- 预计30%活跃用户会评论 → 每周+60条评论
- 真题库2-4周内可达50+篇
- 社区氛围明显改善

---

## ⚙️ 配置调整

如果需要调整奖励额度，修改以下位置：

### 发帖奖励（当前+2）

```typescript
// app/api/interview-posts/route.ts
const newBalance = Math.min(existingBonus.bonusBalance + 2, 6); // 修改这里
```

### 评论奖励（当前3条评论+1配额）

```typescript
// app/api/interview-comments/route.ts
if (newCommentsCount === 3 && ...) { // 修改评论数要求
  const newBalance = Math.min(existingBonus.bonusBalance + 1, 6); // 修改奖励数
}
```

### 余额上限（当前6个）

```typescript
// 全局搜索并替换所有 "bonusBalance < 6" 和 "bonusBalance + X, 6"
```

---

## 🐛 常见问题

### Q1: 为什么发帖了没有获得奖励？
A: 可能原因：
- 今天已经发过帖获得过奖励（每天限1次）
- 奖励余额已满(6/6)

### Q2: 评论了为什么没有奖励？
A: 可能原因：
- 评论少于10字（质量控制）
- 还没达到3条评论
- 奖励余额已满

### Q3: 奖励配额会过期吗？
A: 不会过期，可以一直累积使用，上限6个

### Q4: 如何查看我的奖励余额？
A: 访问 `/me` 个人界面，顶部有配额进度卡片

---

## 📝 更新日志

**2025-10-23**
- ✅ 创建数据库表 `user_daily_bonus`
- ✅ 实现配额查询API `/api/user/match-quota`
- ✅ 修改匹配逻辑支持奖励配额
- ✅ 发帖API集成奖励发放
- ✅ 评论API集成奖励发放
- ✅ 创建个人界面配额进度卡片
- ✅ 完整文档和说明

---

## 🎉 总结

这个系统通过**适度激励**的方式：
1. ✅ 解决用户"刷不够人"的痛点
2. ✅ 激励用户贡献高质量内容
3. ✅ 建立活跃的社区氛围
4. ✅ 灵活可调整，可根据数据优化

**预期2周后真题区会明显活跃起来！** 🚀

