# 📧 MockPal 邮件系统总结

## 📊 邮件类型总览

目前系统共有 **3 种邮件**：

### 1️⃣ 登录验证邮件 (Login Verification)
**触发条件**：
- 用户在登录页面选择"邮箱验证登录"
- 输入邮箱并点击"发送验证邮件"

**邮件内容**：
- 📧 主题：`MockPal - 登录验证`
- 📝 标题：`欢迎登录 MockPal`
- 🔗 包含一个"登录 MockPal"按钮
- ⏰ 链接有效期：24小时

**代码位置**：
- `lib/email-service.ts` - `sendVerificationEmail()`
- `lib/auth-config.ts` - NextAuth 配置

---

### 2️⃣ 设置密码邮件 (Password Setup)
**触发条件**：
- 新用户注册时选择"邮箱密码注册"
- 用户输入邮箱并点击"发送设置密码链接"

**邮件内容**：
- 📧 主题：`MockPal - 设置密码`
- 📝 标题：`设置密码`
- 🔗 包含一个"设置密码"按钮
- ⏰ 链接有效期：24小时

**特殊限制**：
- ❌ 如果邮箱已经设置过密码，不允许重复注册
- ✅ 系统会自动检查并返回"该邮箱已注册，请直接登录"

**代码位置**：
- `lib/email-service.ts` - `sendPasswordSetupEmail()`
- `lib/auth.ts` - `sendPasswordSetupEmail()`

---

### 3️⃣ 匹配成功通知邮件 (Match Success)
**触发条件**：
- 用户A对用户B点赞（like）
- 用户B之前已经对用户A点赞过
- 双向匹配成功时，**双方都会收到邮件**

**邮件内容**：
- 📧 主题：`MockPal - 匹配成功通知`
- 📝 标题：`匹配成功啦！🎉`
- 💬 正文：`你与 [对方昵称] 已成功匹配，可以开始联系约面了～`
- 🔗 包含一个"前往查看匹配详情"按钮，链接到 `/matches` 页面

**代码位置**：
- `lib/email-service.ts` - `sendMatchSuccessEmail()`
- `lib/matching.ts` - `createMatch()` 函数第306-339行

**发送逻辑**：
```typescript
// 在 lib/matching.ts 中
if (partnerLatest?.actionType === 'like' && partnerLatest.status !== 'accepted') {
  // 创建 accepted 记录
  await db.insert(matches).values({...});
  
  // 并行发送邮件给双方
  await Promise.all([
    me?.email ? emailService.sendMatchSuccessEmail(me.email, {...}) : Promise.resolve(),
    partner?.email ? emailService.sendMatchSuccessEmail(partner.email, {...}) : Promise.resolve(),
  ]);
}
```

**容错机制**：
- ✅ 即使邮件发送失败，匹配仍然成功
- ✅ 只有用户填写了邮箱才会发送
- ✅ 使用 `try-catch` 包裹，失败不影响主流程

---

## 🔒 发送限制和配置

### 环境配置

#### 开发环境 (Development)
- ✅ **不发送真实邮件**
- ✅ 登录/设置密码链接直接在控制台打印
- ✅ 匹配成功通知在控制台显示
- 💡 方便本地调试，无需检查邮箱

#### 测试/生产环境 (Production)
- 📮 **发件人**：
  - 开发/测试：`MockPal <onboarding@resend.dev>`
  - 生产：`MockPal <noreply@mockpals.com>`

### Resend 服务限制

**免费版限制**：
- 📊 **每月 100 封邮件**
- ⚠️ 测试环境只能发送到注册邮箱 (xincindy924@gmail.com)
- ✅ 生产环境已验证 `mockpals.com` 域名，可发送到任意邮箱

**付费版**：
- 📈 根据套餐有更高的发送限制

---

## 📈 邮件发送统计（预估）

假设每天有 N 个活跃用户：

### 日常使用场景
- **登录验证**：每个新用户 1 封
- **设置密码**：每个新用户注册 1 封
- **匹配成功**：每次匹配成功，双方各 1 封（共 2 封）

### 月度预估
假设每月：
- 10 个新用户注册 = 20 封（登录+设置密码）
- 20 次匹配成功 = 40 封（每次双方各 1 封）
- **总计：约 60 封/月**（在免费版 100 封限额内）

---

## ⚙️ 邮件模板结构

### 通用样式
```html
- 最大宽度：600px
- 字体：-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- 主按钮：蓝色 (#3B82F6)，圆角 8px
- 底部提示：灰色 (#6b7280)
```

### 包含元素
1. ✅ 标题区域（居中）
2. ✅ 描述文字
3. ✅ 操作按钮（居中）
4. ✅ 备用链接（防止按钮失效）
5. ✅ 底部提示（有效期、安全提示）

---

## 🛡️ 安全机制

1. **链接有效期**：所有验证链接 24 小时后失效
2. **Token 生成**：使用 `randomBytes(32).toString('hex')` 生成随机 token
3. **数据库验证**：每次使用链接都会验证 token 和过期时间
4. **容错机制**：邮件发送失败不影响核心业务（如匹配成功）

---

## 📝 代码位置总结

| 邮件类型 | 服务方法 | 触发位置 | 模板 |
|---------|---------|---------|------|
| 登录验证 | `sendVerificationEmail()` | NextAuth 自动触发 | `getEmailTemplate(url, 'login')` |
| 设置密码 | `sendPasswordSetupEmail()` | `lib/auth.ts` | `getEmailTemplate(url, 'password')` |
| 匹配成功 | `sendMatchSuccessEmail()` | `lib/matching.ts` | 自定义 HTML |

---

## 🔍 日志和调试

所有邮件发送都有详细的控制台日志：
- 🔵 准备发送
- 📧 收件人信息
- 🔗 链接/URL
- ✅ 发送成功
- ❌ 发送失败（包含错误详情）

**查看日志**：
```bash
# 开发环境
npm run dev
# 日志会在控制台显示，包含登录链接

# 生产环境
# 检查服务器日志中的 [EmailService] 标记
```

---

## 📊 优化建议

### 当前已实现 ✅
1. 单例模式，避免重复创建 Resend 实例
2. 开发环境不发送真实邮件
3. 匹配成功邮件失败不影响业务
4. 详细的日志记录

### 未来可优化 💡
1. 添加邮件发送队列（如果用户量增大）
2. 添加邮件模板系统（支持多语言）
3. 添加邮件发送统计和监控
4. 添加用户邮件偏好设置（允许用户关闭某些通知）

---

生成时间：2025-10-17

