# 🚀 生产环境推送检查清单

## ⚠️ 推送到生产环境前必须检查的配置

### 📧 邮件服务配置
- [ ] 确认 `lib/email-service.ts` 中的邮件发送配置
- [ ] 验证生产环境使用 `noreply@mockpals.com` 域名
- [ ] 确认 Resend 中 `mockpals.com` 域名已验证

### 🔧 环境变量检查
- [ ] `NODE_ENV=production`
- [ ] `NEXTAUTH_URL` 指向生产域名
- [ ] `RESEND_API_KEY` 使用生产环境密钥
- [ ] 数据库连接字符串指向生产数据库

### 🛡️ 安全检查
- [ ] 移除调试日志和测试代码
- [ ] 确认没有硬编码的测试数据
- [ ] 验证所有敏感信息都在环境变量中

## 🔄 快速检查命令

运行以下命令检查当前配置：

```bash
# 检查邮件配置
grep -n "onboarding@resend.dev" lib/email-service.ts

# 检查环境变量
echo "NODE_ENV: $NODE_ENV"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
```

## 📝 常见问题

**Q: 邮件发送失败怎么办？**
A: 检查域名是否在 Resend 中验证，确认 API 密钥正确

**Q: 如何快速切换到生产配置？**
A: 当前代码会根据 `NODE_ENV` 自动切换，确保生产环境设置正确的环境变量即可

---
⚠️ **重要提醒**: 推送前请逐项检查上述清单！ 