# 邮件发送配置说明

## 当前状态

邮件发送功能已经配置完成，使用的是 Resend 邮件服务。

## 配置详情

✅ **域名已验证**：
- 已验证域名：`mockpal.com`
- 发件人地址：`noreply@mockpal.com`
- 可以发送邮件到任意邮箱地址

## 如何测试

1. 在登录/注册页面选择"邮箱验证"
2. 输入任意有效的邮箱地址
3. 点击"发送验证邮件"
4. 检查邮箱收件箱（包括垃圾邮件文件夹）

## 发送限制

**Resend 账户限制**：
- 免费版：每月可发送 100 封邮件
- 付费版：根据套餐有更高的发送限制

## 配置文件位置

- API Key 配置：`.env.local` 中的 `RESEND_API_KEY`
- 邮件模板：`lib/auth-config.ts` 中的 `sendVerificationRequest` 函数

## 故障排查

如果邮件发送失败：

1. 检查服务器日志中的 `[Email]` 前缀信息
2. 确认 API key 正确
3. 确认收件人邮箱地址
4. 检查 Resend Dashboard 中的发送日志

## API 响应示例

```json
// 成功发送
{
  "id": "email_id",
  "from": "onboarding@resend.dev",
  "to": "qq007523@gmail.com",
  "created_at": "2025-08-08T00:00:00.000Z"
}

// 限制错误
{
  "statusCode": 403,
  "error": "You can only send testing emails to your own email address..."
}
```