# 邮件发送频率限制功能

## 📋 功能概述

为了防止邮件滥用和保护用户体验，系统现在实施了邮件发送频率限制：

**每个用户每周最多收到 2 封邮件**

## 🎯 限制规则

### 时间窗口
- **7天滚动窗口**：从当前时间往前推算7天
- 不是按自然周（周一到周日），而是连续的168小时

### 计数规则
- 只计算**成功发送**的邮件（`status = 'sent'`）
- 不计算失败的邮件（`status = 'failed'`）
- 不计算被跳过的邮件（`status = 'skipped'`）

### 限制数量
- **2封/周**：任意7天内最多2封邮件

---

## 📊 邮件类型

系统跟踪三种邮件类型：

| 邮件类型 | 标识符 | 触发场景 | 超限行为 |
|---------|-------|---------|---------|
| **登录验证** | `login` | 用户选择邮箱登录时 | 抛出错误，提示用户 |
| **设置密码** | `password_setup` | 新用户注册时 | 抛出错误，提示用户 |
| **匹配成功** | `match_success` | 双方互相点赞成功时 | 静默跳过，不影响匹配 |

---

## 🗄️ 数据库设计

### 新增表：`email_send_logs`

```sql
CREATE TABLE email_send_logs (
  id SERIAL PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,    -- 收件人邮箱
  email_type VARCHAR(50) NOT NULL,          -- 邮件类型
  subject VARCHAR(255),                     -- 邮件主题
  status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 发送状态
  error_message TEXT,                       -- 错误信息
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()  -- 发送时间
);

-- 索引
CREATE INDEX idx_email_send_logs_recipient_sent_at 
  ON email_send_logs(recipient_email, sent_at);
CREATE INDEX idx_email_send_logs_email_type 
  ON email_send_logs(email_type);
```

### 字段说明

- **recipient_email**: 接收邮件的邮箱地址
- **email_type**: 邮件类型（login, password_setup, match_success）
- **subject**: 邮件主题（便于审计）
- **status**: 发送状态
  - `sent`: 发送成功
  - `failed`: 发送失败
  - `skipped`: 因超限被跳过
- **error_message**: 如果失败或跳过，记录原因
- **sent_at**: 邮件发送时间（用于计算频率）

---

## 💻 实现细节

### 核心逻辑

```typescript
// 1. 检查频率限制
private async checkEmailRateLimit(
  email: string, 
  emailType: string
): Promise<{ allowed: boolean; message?: string; sentCount?: number }>

// 2. 记录邮件发送
private async logEmailSend(
  email: string,
  emailType: string,
  subject: string,
  status: 'sent' | 'failed' | 'skipped',
  errorMessage?: string
): Promise<void>
```

### 执行流程

```
1. 用户触发邮件发送
   ↓
2. 检查开发环境？
   ├─ 是 → 跳过限制，打印到控制台
   └─ 否 → 继续
   ↓
3. 调用 checkEmailRateLimit()
   ├─ 查询过去7天内发送给该邮箱的邮件数
   └─ 判断是否 >= 2
   ↓
4. 是否超限？
   ├─ 是 → 记录 skipped，返回/抛出错误
   └─ 否 → 继续发送
   ↓
5. 调用 Resend API 发送
   ↓
6. 成功？
   ├─ 是 → 记录 sent
   └─ 否 → 记录 failed，抛出错误
```

---

## 🎭 不同邮件类型的处理

### 1. 登录验证邮件（login）

**超限行为**：抛出错误

```typescript
if (!rateLimitCheck.allowed) {
  await this.logEmailSend(email, 'login', 'MockPal - 登录验证', 'skipped', ...);
  throw new Error(`邮件发送已达到限制：${rateLimitCheck.message}`);
}
```

**用户体验**：
- 用户会看到错误提示
- 建议等待一段时间后再试
- 或使用其他登录方式（Google OAuth）

---

### 2. 设置密码邮件（password_setup）

**超限行为**：抛出错误

```typescript
if (!rateLimitCheck.allowed) {
  await this.logEmailSend(email, 'password_setup', 'MockPal - 设置密码', 'skipped', ...);
  throw new Error(`邮件发送已达到限制：${rateLimitCheck.message}`);
}
```

**用户体验**：
- 用户会看到错误提示
- 建议使用邮箱验证登录（如果已有账号）
- 或等待限制重置

---

### 3. 匹配成功通知（match_success）

**超限行为**：静默跳过

```typescript
if (!rateLimitCheck.allowed) {
  await this.logEmailSend(to, 'match_success', 'MockPal - 匹配成功通知', 'skipped', ...);
  return { 
    data: { id: 'rate-limit-skip' }, 
    error: null,
    skipped: true,
    reason: 'rate_limit'
  };
}
```

**用户体验**：
- **匹配仍然成功**
- 只是不发送邮件通知
- 用户可以在网站上看到匹配结果
- 不影响核心业务流程

**设计理由**：
- 匹配成功通知是**非关键邮件**
- 优先保障登录和注册邮件
- 避免因通知邮件消耗配额

---

## 📈 统计和监控

### 查询发送统计

```sql
-- 查看某个邮箱的发送历史
SELECT * FROM email_send_logs
WHERE recipient_email = 'user@example.com'
ORDER BY sent_at DESC;

-- 查看过去7天的发送统计
SELECT 
  email_type,
  status,
  COUNT(*) as count
FROM email_send_logs
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY email_type, status;

-- 查看被跳过的邮件（超限）
SELECT * FROM email_send_logs
WHERE status = 'skipped'
  AND sent_at >= NOW() - INTERVAL '7 days'
ORDER BY sent_at DESC;
```

---

## 🛡️ 安全特性

### 1. 容错机制

```typescript
// 如果检查失败，默认允许发送（避免影响正常业务）
return { allowed: true };
```

**设计理由**：
- 数据库连接失败时不应阻止邮件发送
- 保障核心业务连续性
- 记录失败不影响主流程

### 2. 只计算成功发送

```sql
eq(emailSendLogs.status, 'sent') -- 只计算成功发送的
```

**设计理由**：
- 失败的邮件不应计入配额
- 避免用户因系统错误被限制

### 3. 开发环境豁免

```typescript
if (process.env.NODE_ENV === 'development') {
  // 跳过所有限制
  return { data: { id: 'dev-mode-skip' }, error: null };
}
```

**设计理由**：
- 开发调试不消耗配额
- 不影响生产数据

---

## 🔧 配置和调整

### 调整限制数量

修改 `lib/email-service.ts` 第46行：

```typescript
if (sentCount >= 2) {  // 修改这个数字
  return { allowed: false, ... };
}
```

### 调整时间窗口

修改 `lib/email-service.ts` 第29-30行：

```typescript
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);  // 修改天数
```

---

## 📊 使用示例

### 示例1：正常发送

```
用户: user@example.com
过去7天发送: 1封

请求: 登录验证邮件
结果: ✅ 发送成功（1/2）
```

### 示例2：达到限制

```
用户: user@example.com
过去7天发送: 2封

请求: 登录验证邮件
结果: ❌ 超限，抛出错误
日志: status='skipped', error_message='该邮箱在过去7天内已收到2封邮件'
```

### 示例3：匹配成功通知静默跳过

```
用户: user@example.com
过去7天发送: 2封

请求: 匹配成功通知
结果: ✅ 匹配成功（但不发送邮件）
日志: status='skipped', error_message='已达到每周限制'
用户: 仍然可以在网站上看到匹配
```

---

## 🚀 部署步骤

### 1. 运行数据库迁移

```bash
# 在生产数据库运行
psql $DATABASE_URL -f migrations/0014_add_email_send_logs.sql
```

### 2. 验证表创建

```sql
-- 检查表是否存在
\dt email_send_logs

-- 检查索引
\di idx_email_send_logs_*
```

### 3. 测试功能

```bash
# 开发环境测试（不受限制）
npm run dev

# 生产环境测试
npm run build
npm start
```

---

## 📝 FAQ

### Q1: 为什么是每周2封而不是更多？

A: 
- 考虑到 Resend 免费版每月100封限制
- 平衡用户体验和资源消耗
- 可以根据实际情况调整

### Q2: 匹配成功通知为什么静默跳过？

A:
- 匹配功能本身不受影响
- 用户可以在网站查看
- 优先保障登录等关键邮件

### Q3: 用户如何知道被限制了？

A:
- 登录/注册邮件：会显示错误提示
- 匹配通知：不显示（静默）

### Q4: 限制何时重置？

A:
- 7天滚动窗口，不是固定周期
- 例如：周一发2封，下周一自动重置

### Q5: 会影响已有用户吗？

A:
- 不会，从部署后开始计数
- 历史邮件不计入

---

## 🎯 最佳实践

### 1. 监控超限情况

定期检查被跳过的邮件：

```sql
SELECT 
  recipient_email, 
  COUNT(*) as skipped_count
FROM email_send_logs
WHERE status = 'skipped'
  AND sent_at >= NOW() - INTERVAL '30 days'
GROUP BY recipient_email
HAVING COUNT(*) > 5
ORDER BY skipped_count DESC;
```

### 2. 优化用户引导

- 提示用户使用 Google 登录（不消耗邮件配额）
- 在超限时提供清晰的错误信息
- 考虑添加"限制将在X天后重置"的提示

### 3. 定期清理

旧数据不影响功能，但可以定期清理：

```sql
-- 保留90天数据
DELETE FROM email_send_logs
WHERE sent_at < NOW() - INTERVAL '90 days';
```

---

生成时间：2025-10-17  
相关文件：
- `lib/email-service.ts` - 核心逻辑
- `lib/db/schema.ts` - 数据库Schema
- `migrations/0014_add_email_send_logs.sql` - 数据库迁移

