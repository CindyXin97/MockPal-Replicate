# 🚀 通知系统快速部署清单

## ✅ 部署步骤（5分钟完成）

### 1️⃣ 运行数据库迁移
```bash
npx tsx scripts/run-notification-migration.ts
```

**预期输出**：
```
🚀 开始运行通知系统迁移...
📝 执行 SQL 迁移...
✅ 迁移执行成功！
```

---

### 2️⃣ 重启应用

**开发环境**：
```bash
npm run dev
```

**生产环境**：
```bash
npm run build
npm start
```

---

### 3️⃣ 验证功能（测试清单）

#### ✓ Header 导航栏
- [ ] 右上角用户名旁边显示头像圆圈
- [ ] 点击用户名展开菜单
- [ ] 菜单中显示"🏠 我的"选项

#### ✓ 个人中心页面
- [ ] 访问 `/me` 显示个人中心
- [ ] 显示三大统计卡片（浏览、匹配、面试）
- [ ] 显示通知预览区域
- [ ] 显示社区活动统计

#### ✓ 通知功能
- [ ] 发布评论后，题目作者收到通知
- [ ] 回复评论后，原评论作者收到通知
- [ ] 评论中@用户后，被@用户收到通知
- [ ] Header显示未读通知数量徽章

#### ✓ 通知列表页面
- [ ] 访问 `/me/notifications` 显示完整通知列表
- [ ] 可以标记单个通知为已读
- [ ] 可以一键标记全部为已读
- [ ] 可以筛选"全部"和"未读"

---

## 📁 修改的文件列表

### 新增文件
```
migrations/0015_add_notifications_and_stats.sql
app/api/user/notifications/route.ts
app/api/user/stats/route.ts
app/me/page.tsx
app/me/notifications/page.tsx
lib/notification-service.ts
scripts/run-notification-migration.ts
NOTIFICATION_SYSTEM_GUIDE.md
DEPLOY_NOTIFICATION_SYSTEM.md
```

### 修改的文件
```
lib/db/schema.ts                     ← 添加新表定义
components/header.tsx                ← 添加通知徽章
app/api/interview-comments/route.ts  ← 集成通知触发
```

---

## 🔍 常见问题

### Q1: 迁移脚本报错 "relation does not exist"
**A**: 确保数据库连接配置正确，检查 `.env.local` 中的 `DATABASE_URL`

### Q2: Header 没有显示通知徽章
**A**: 清除浏览器缓存，刷新页面。检查 API `/api/user/notifications` 是否正常返回

### Q3: 评论后没有收到通知
**A**: 
1. 检查数据库表是否创建成功
2. 查看服务器日志是否有错误
3. 确认不是自己给自己评论（不会触发通知）

---

## 🎯 功能验证命令

### 检查表是否创建
```sql
\dt user_notifications
\dt user_notification_settings
\d user_achievements
```

### 查看通知数据
```sql
SELECT * FROM user_notifications LIMIT 5;
SELECT * FROM user_notification_settings LIMIT 5;
```

### 手动创建测试通知
```sql
INSERT INTO user_notifications (user_id, type, actor_id, actor_name, title, content)
VALUES (1, 'comment_reply', 2, '测试用户', '测试通知', '这是一条测试通知');
```

---

## 📊 监控指标

部署后可以监控以下指标：

```sql
-- 通知总数
SELECT COUNT(*) FROM user_notifications;

-- 未读通知数
SELECT COUNT(*) FROM user_notifications WHERE is_read = false;

-- 通知类型分布
SELECT type, COUNT(*) FROM user_notifications GROUP BY type;

-- 今日新增通知
SELECT COUNT(*) FROM user_notifications 
WHERE created_at >= CURRENT_DATE;
```

---

## ✨ 部署完成！

如果所有测试通过，恭喜你！通知系统已成功部署。

用户现在可以：
- 👀 在个人中心查看统计数据
- 🔔 接收评论、@提及等通知
- 💬 与其他用户更好地互动
- 📈 追踪自己的社区活动

---

**下一步**：查看 `NOTIFICATION_SYSTEM_GUIDE.md` 了解完整功能说明

