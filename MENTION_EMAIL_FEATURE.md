# @提及邮件通知功能

## 📋 功能概述

新增了用户被@时自动发送邮件通知的功能，确保用户能及时收到提及提醒。

## ✨ 核心特性

### 1. 智能频率限制
- **@提及邮件**：每天最多发送1封
- **其他邮件**：每周最多发送2封
- 自动记录发送日志，防止重复发送

### 2. 邮件模板设计
- 美观的HTML邮件模板
- 包含提及者信息和评论内容预览
- 直接跳转到相关评论的链接
- 提供关闭邮件通知的提示

### 3. 双重通知机制
- **站内通知**：立即创建站内通知
- **邮件通知**：异步发送邮件（失败不影响站内通知）

## 🔧 技术实现

### 邮件服务扩展 (`lib/email-service.ts`)

```typescript
// 新增@提及邮件发送方法
public async sendMentionEmail(to: string, opts: {
  actorName: string;
  content: string;
  postType: string;
  postId: number;
  commentUrl: string;
})

// 更新频率限制逻辑
private async checkEmailRateLimit(email: string, emailType: string)
// - mention类型：每日1封限制
// - 其他类型：每周2封限制
```

### 通知服务集成 (`lib/notification-service.ts`)

```typescript
export async function notifyMentioned(
  mentionedUserId: number,
  actorId: number,
  actorName: string,
  content: string,
  postType: string,
  postId: number
) {
  // 1. 创建站内通知
  const notification = await createNotification({...});
  
  // 2. 发送邮件通知
  try {
    const mentionedUser = await db.select({email: users.email})...;
    await emailService.sendMentionEmail(mentionedUser.email, {...});
  } catch (emailError) {
    // 邮件失败不影响站内通知
  }
  
  return notification;
}
```

## 📧 邮件模板

### 邮件主题
```
MockPal - {提及者姓名} 在评论中提到了你
```

### 邮件内容
- **标题**：有人@了你！📢
- **正文**：{提及者姓名} 在评论中提到了你
- **评论预览**：显示评论内容（前200字符）
- **操作按钮**：前往查看评论
- **提示信息**：可在个人中心关闭邮件通知

## 🎯 使用场景

### 触发条件
1. 用户在评论中输入 `@用户名`
2. 系统解析到有效的用户名
3. 被提及的用户不是评论作者本人

### 发送流程
```
用户A评论 → 解析@提及 → 创建站内通知 → 发送邮件通知
```

## 📊 数据库记录

### 邮件发送日志 (`email_send_logs`)
```sql
-- 新增邮件类型
email_type: 'mention'

-- 记录示例
INSERT INTO email_send_logs (
  recipient_email, 
  email_type, 
  subject, 
  status, 
  sent_at
) VALUES (
  'user@example.com',
  'mention',
  'MockPal - 张三 在评论中提到了你',
  'sent',
  NOW()
);
```

## 🧪 测试功能

### 测试页面
访问 `/test-mention-email` 页面可以测试@提及邮件功能：

1. **输入测试数据**：
   - 提及者姓名
   - 评论内容（包含@用户名）
   - 收件人邮箱
   - 帖子类型和ID

2. **验证功能**：
   - 开发环境：控制台打印邮件内容
   - 生产环境：真正发送邮件
   - 频率限制：同一天多次发送会被限制

### 测试脚本
```bash
# 运行测试脚本
npx tsx scripts/test-mention-email.ts
```

## ⚙️ 配置说明

### 环境变量
```env
# 邮件服务配置
RESEND_API_KEY=your_resend_api_key
NEXTAUTH_URL=http://localhost:3000  # 用于生成跳转链接

# 生产环境邮件配置
NODE_ENV=production  # 生产环境会真正发送邮件
```

### 邮件发送限制
- **开发环境**：不发送真实邮件，控制台打印
- **生产环境**：发送真实邮件
- **频率限制**：@提及邮件每天1封，其他邮件每周2封

## 🔍 故障排查

### 常见问题

1. **邮件发送失败**
   - 检查 `RESEND_API_KEY` 配置
   - 查看服务器日志中的错误信息
   - 验证收件人邮箱格式

2. **频率限制不生效**
   - 检查 `email_send_logs` 表是否存在
   - 验证时间计算逻辑
   - 确认邮件类型字段正确

3. **@提及解析失败**
   - 检查用户名是否存在
   - 验证 `parseMentions` 函数
   - 确认正则表达式匹配

### 调试方法

```typescript
// 查看邮件发送记录
SELECT * FROM email_send_logs 
WHERE email_type = 'mention' 
ORDER BY sent_at DESC;

// 检查用户邮箱
SELECT id, name, email FROM users 
WHERE name = '被提及的用户名';
```

## 📈 未来优化

### 计划功能
- [ ] 邮件模板个性化设置
- [ ] 批量@提及优化
- [ ] 邮件摘要功能
- [ ] 用户邮件偏好设置

### 性能优化
- [ ] 异步邮件队列
- [ ] 邮件发送重试机制
- [ ] 发送状态实时更新

---

**版本**: 1.0.0  
**更新日期**: 2025-01-27  
**作者**: MockPal Team

🎉 @提及邮件通知功能已上线，用户再也不会错过重要的提及了！
