# Resend 域名验证错误解决方案

## ❌ 错误信息
```
statusCode: 403
message: 'The mockpals.com domain is not verified. 
         Please, add and verify your domain on https://resend.com/domains'
name: 'validation_error'
```

---

## 🔍 错误原因分析

### 不是以下问题：
- ❌ **不是**本地环境问题
- ❌ **不是** VPN 问题
- ❌ **不是**代码错误

### 真正原因：
✅ **Resend 账户中 `mockpals.com` 域名未验证**

当代码以**生产模式**运行时：
1. 系统尝试使用 `noreply@mockpals.com` 发送邮件
2. Resend 检查域名验证状态
3. 发现 `mockpals.com` 未验证
4. 拒绝发送（返回 403 错误）

---

## ✅ 解决方案

### 方案1：使用开发模式（推荐给同事）

**适用场景**：本地开发、测试

```bash
# 1. 停止当前进程（Ctrl+C）

# 2. 以开发模式运行
npm run dev

# 3. 验证是否正确运行
# 应该看到类似输出：
# - ready started server on 0.0.0.0:3000, url: http://localhost:3000
# - NODE_ENV: development (自动设置)
```

**开发模式下的行为**：
- ✅ 邮件**不会真实发送**
- ✅ 登录链接**直接打印在终端控制台**
- ✅ 匹配成功通知也在控制台显示
- ✅ **不需要验证域名**
- ✅ **不需要配置 Resend**

**在控制台查看登录链接**：
```bash
🚀 [开发环境] 邮件登录链接：
🔗 请复制此链接到浏览器中登录:
http://localhost:3000/api/auth/callback/email?token=xxx...
```

---

### 方案2：临时使用测试域名

**适用场景**：需要真实发送邮件测试，但不想验证域名

**步骤**：

1. 修改代码强制使用测试域名：

编辑 `lib/email-service.ts` 第151-153行：

```typescript
// 临时修改（测试完记得改回来）
const fromEmail = 'MockPal <onboarding@resend.dev>'; // 强制使用测试域名
```

2. **限制**：
   - ⚠️ Resend 免费版只能发送到**你的注册邮箱**
   - ⚠️ 无法发送到其他用户邮箱
   - ⚠️ 不适合多人测试

---

### 方案3：验证 mockpals.com 域名（生产环境）

**适用场景**：准备上线生产环境

**步骤**：

1. 登录 Resend Dashboard：https://resend.com/domains

2. 点击 "Add Domain"

3. 输入域名：`mockpals.com`

4. 添加 DNS 记录到域名服务商：
   ```
   记录类型: TXT
   名称: _resend
   值: [Resend 提供的验证码]
   ```

5. 等待 DNS 传播（通常 5-30 分钟）

6. 在 Resend 中点击 "Verify Domain"

7. 验证成功后，`noreply@mockpals.com` 就可以使用了

---

## 🔍 如何判断当前环境？

### 方法1：查看运行命令

```bash
# 如果运行的是：
npm run dev     → 开发环境 (development)
npm start       → 生产环境 (production)
```

### 方法2：运行检查脚本

```bash
npx tsx scripts/check-current-env.ts
```

输出示例：
```
📍 NODE_ENV: development
🌐 NEXTAUTH_URL: http://localhost:3000
📧 RESEND_API_KEY: 已配置 ✅

📋 邮件发送行为：
   🚀 开发环境：邮件不会真实发送，链接会打印在控制台
```

### 方法3：查看控制台日志

邮件发送时会打印：
- 开发环境：`🚀 [开发环境] 邮件登录链接`
- 生产环境：`📮 发件人: MockPal <noreply@mockpals.com>`

---

## 📋 环境对照表

| 环境 | 运行命令 | NODE_ENV | 发件地址 | 是否需要验证域名 |
|------|---------|----------|---------|----------------|
| **开发** | `npm run dev` | `development` | 不发送 | ❌ 不需要 |
| **本地生产** | `npm start` | `production` | `noreply@mockpals.com` | ✅ 需要 |
| **Vercel** | 自动部署 | `production` | `noreply@mockpals.com` | ✅ 需要 |

---

## 💡 给同事的快速解决方案

**最简单的解决办法**：

```bash
# 1. 停止当前服务（Ctrl+C）

# 2. 确保使用开发模式
npm run dev

# 3. 打开网站
# http://localhost:3000

# 4. 测试登录
# 登录链接会直接显示在终端，复制粘贴即可
```

**不需要**：
- ❌ 不需要修改代码
- ❌ 不需要配置 Resend
- ❌ 不需要验证域名
- ❌ 不需要检查邮箱

---

## 🚨 常见误区

### 误区1："我需要在 .env.local 设置 NODE_ENV"
❌ **不需要！** Next.js 会根据命令自动设置。

### 误区2："域名验证失败是网络问题"
❌ **不是！** 这是 Resend 账户配置问题，跟网络/VPN 无关。

### 误区3："本地开发也需要验证域名"
❌ **不需要！** 只要用 `npm run dev`，完全不需要配置域名。

---

## 📞 需要帮助？

如果上述方案都无法解决，请检查：

1. ✅ 是否真的在运行 `npm run dev`？
2. ✅ 终端是否显示 `ready started server on ...`？
3. ✅ 是否有多个 node 进程在运行？（`ps aux | grep node`）
4. ✅ 端口 3000 是否被占用？（`lsof -i:3000`）

---

生成时间：2025-10-17  
相关文档：`ENVIRONMENT_AND_EMAIL_FAQ.md`, `EMAIL_SYSTEM_SUMMARY.md`

