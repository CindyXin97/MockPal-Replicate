# 🔔 通知系统和个人中心使用指南

## 📋 功能概述

全新的通知系统和个人中心已经上线！现在用户可以：

✅ **查看个人统计数据** - 浏览人数、匹配成功数、完成面试数  
✅ **接收站内通知** - 评论被回复、被@提到、题目有新评论  
✅ **管理通知设置** - 自定义哪些通知需要接收  
✅ **追踪社区活动** - 查看发布的题目、评论、点赞数据  

---

## 🎯 核心功能

### 1. 个人中心（/me）

访问路径：点击右上角用户名 → "🏠 我的"

**展示内容**：
- 👤 用户信息和等级徽章
- 📊 三大核心统计：
  - 👀 已浏览人数（今日 + 总计）
  - 💝 匹配成功数（等待中 + 已成功）
  - 🎤 完成面试数（经验值）
- 🔔 最新通知预览（最近3条）
- 📈 社区活动统计：
  - 发布的题目数
  - 评论数
  - 点赞数（给出 + 收到）

### 2. 通知功能

**通知类型**：

| 图标 | 类型 | 触发场景 |
|-----|------|---------|
| 💬 | 评论被回复 | 有人回复了你的评论 |
| 📢 | 被@提到 | 有人在评论中@你 |
| ✍️ | 题目有新评论 | 你发布的题目收到新评论 |
| 👍 | 被点赞 | 你的内容被点赞（默认关闭） |
| 💝 | 匹配成功 | 双方互相点赞成功 |

**通知位置**：
1. Header 用户名旁边的红色数字徽章
2. 用户菜单下拉中显示"X条未读通知"
3. 个人中心页面的通知预览
4. 完整通知列表（/me/notifications）

### 3. @提及功能

**如何@用户**：
在评论中输入 `@用户名`，例如：
```
@Cindy 你的方法很好，我也试试看！
```

**效果**：
- 被@的用户会收到站内通知
- 通知内容会显示评论预览
- 点击通知可直接跳转到该评论

---

## 🗄️ 数据库结构

### 新增表

#### 1. `user_notifications` - 用户通知表
```sql
- id: 通知ID
- user_id: 接收通知的用户
- type: 通知类型（comment_reply, comment_mention等）
- actor_id: 触发者ID
- actor_name: 触发者名称
- title: 通知标题
- content: 通知内容预览
- link: 跳转链接
- is_read: 是否已读
- is_deleted: 是否已删除
- created_at: 创建时间
- read_at: 阅读时间
```

#### 2. `user_notification_settings` - 通知设置表
```sql
- user_id: 用户ID
- notify_comment_reply: 是否通知评论回复（默认开）
- notify_mention: 是否通知@提及（默认开）
- notify_post_comment: 是否通知题目评论（默认开）
- notify_vote: 是否通知点赞（默认关）
- notify_match: 是否通知匹配成功（默认开）
- email_digest_enabled: 是否启用邮件摘要（默认开）
- email_digest_frequency: 邮件频率（weekly/daily/never）
```

#### 3. `user_achievements` 扩展字段
新增统计字段：
- `total_views`: 总浏览人数
- `total_matches`: 总匹配数
- `successful_matches`: 匹配成功数
- `posts_count`: 发布的题目数
- `comments_count`: 评论数
- `votes_given`: 点赞数

---

## 🚀 部署步骤

### 步骤1：运行数据库迁移

```bash
# 方式1：使用 tsx 运行迁移脚本
npx tsx scripts/run-notification-migration.ts

# 方式2：直接执行 SQL 文件
psql $DATABASE_URL -f migrations/0015_add_notifications_and_stats.sql
```

### 步骤2：验证迁移结果

检查表是否创建成功：
```sql
-- 查看新表
\dt user_notifications
\dt user_notification_settings

-- 查看 user_achievements 新增字段
\d user_achievements
```

### 步骤3：重启应用

```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

### 步骤4：测试功能

1. **测试通知功能**：
   - 用户A发布一个题目
   - 用户B评论该题目
   - 用户A应该收到通知

2. **测试@提及**：
   - 在评论中输入 `@用户名`
   - 被@的用户应该收到通知

3. **测试统计数据**：
   - 访问 /me 页面
   - 查看统计数据是否正确显示

---

## 📱 用户界面

### Header 导航栏
```
MockPal    个人资料  匹配管理  [👤 Cindyyy (3) ▼]
                                      ↑
                            红色徽章显示未读数
```

点击用户名展开菜单：
```
┌──────────────────────────┐
│ 🏠 我的                   │
│    3条未读通知             │
│                           │
│ 👤 编辑资料               │
│ ────────────────────     │
│ 🚪 退出登录               │
└──────────────────────────┘
```

### 个人中心页面布局

```
┌─────────────────────────────────────┐
│  👤 Cindyyy                         │
│  cindyyy@example.com                │
│  [面试新手]                         │
├─────────────────────────────────────┤
│  👀 已浏览    💝 匹配成功   🎤 完成面试 │
│    42人         8人         3次     │
├─────────────────────────────────────┤
│  🔔 消息 (3条未读)                   │
│                                      │
│  💬 Frances Ding 回复了你      3小时前│
│  📢 Pathy 在评论中提到了你      1天前 │
│  💝 你有新的匹配！             3天前 │
│                                      │
│  [查看全部通知]                      │
├─────────────────────────────────────┤
│  📊 我的活动                         │
│                                      │
│  📝 发布题目  💬 评论  👍 点赞  🔥 收赞│
│     2个        5条     12次    8次   │
└─────────────────────────────────────┘
```

---

## 🎨 设计特点

✅ **符合网站风格**：
- 使用蓝色主色调（blue-500/blue-600）
- 紫色渐变头像（from-blue-400 to-purple-500）
- 卡片式布局，柔和阴影
- 平滑的过渡动画

✅ **响应式设计**：
- 移动端自适应布局
- 统计卡片在小屏幕上单列显示
- 触摸友好的交互

✅ **用户体验**：
- 未读通知高亮显示（蓝色背景）
- 通知实时更新（30秒轮询）
- 一键标记全部已读
- 通知分类筛选

---

## 🔧 API 接口

### 1. 获取用户统计数据
```typescript
GET /api/user/stats

Response: {
  success: true,
  data: {
    user: { id, name, email },
    views: { total, today },
    matching: { totalLikes, successfulMatches, pendingMatches },
    interviews: { completed, experiencePoints, currentLevel },
    community: { postsCount, commentsCount, votesGiven, votesReceived },
    notifications: { unreadCount, recent: [...] }
  }
}
```

### 2. 获取通知列表
```typescript
GET /api/user/notifications?unread_only=true&limit=20&offset=0

Response: {
  success: true,
  data: {
    notifications: [...],
    total: 100,
    unreadCount: 5,
    hasMore: true
  }
}
```

### 3. 管理通知
```typescript
POST /api/user/notifications

// 标记单个通知为已读
Body: { action: 'mark_read', notificationId: 123 }

// 标记全部为已读
Body: { action: 'mark_all_read' }

// 删除通知
Body: { action: 'delete', notificationId: 123 }
```

---

## 💡 未来扩展

### 第二阶段功能（可选）
- [ ] @用户名自动补全下拉列表
- [ ] 实时通知（WebSocket）
- [ ] 邮件摘要通知
- [ ] 通知分组聚合
- [ ] 通知声音提示

### 第三阶段功能（可选）
- [ ] 用户关注功能
- [ ] 成就徽章系统
- [ ] 社区排行榜
- [ ] 数据统计图表
- [ ] 导出个人数据

---

## 🐛 故障排查

### 问题1：通知不显示

**可能原因**：
- 数据库迁移未运行
- 通知设置已关闭

**解决方法**：
```bash
# 检查表是否存在
psql $DATABASE_URL -c "\dt user_notifications"

# 检查通知设置
psql $DATABASE_URL -c "SELECT * FROM user_notification_settings WHERE user_id = YOUR_USER_ID"
```

### 问题2：统计数据不准确

**解决方法**：
```sql
-- 手动更新统计数据
UPDATE user_achievements 
SET 
  total_views = (SELECT COUNT(DISTINCT viewed_user_id) FROM user_daily_views WHERE user_id = YOUR_USER_ID),
  posts_count = (SELECT COUNT(*) FROM user_interview_posts WHERE user_id = YOUR_USER_ID),
  comments_count = (SELECT COUNT(*) FROM interview_comments WHERE user_id = YOUR_USER_ID)
WHERE user_id = YOUR_USER_ID;
```

### 问题3：@提及不工作

**检查**：
- 用户名是否正确（大小写敏感）
- 用户是否存在于数据库
- 评论API是否正常运行

---

## 📞 技术支持

如有问题，请检查：
1. 控制台日志（浏览器 + 服务器）
2. 数据库连接状态
3. API响应状态

相关文件位置：
- 数据库迁移：`migrations/0015_add_notifications_and_stats.sql`
- Schema定义：`lib/db/schema.ts`
- 通知服务：`lib/notification-service.ts`
- API接口：`app/api/user/notifications/route.ts`
- 页面组件：`app/me/page.tsx`

---

**版本**: 1.0.0  
**更新日期**: 2025-10-23  
**作者**: MockPal Team

🎉 享受全新的通知系统和个人中心！

