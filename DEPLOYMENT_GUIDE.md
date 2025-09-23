# 🚀 部署指南

## 📧 邮件服务配置

### 当前配置
项目已配置自动环境切换的邮件服务：

- **开发/测试环境**: 使用 `onboarding@resend.dev` (Resend默认验证域名)
- **生产环境**: 使用 `noreply@mockpals.com` (需要域名验证)

### 环境变量配置

#### 开发环境 (.env.local)
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key
```

#### 生产环境
```bash
NODE_ENV=production
NEXTAUTH_URL=https://your-production-domain.com
RESEND_API_KEY=your_production_resend_api_key
```

## 🔍 部署前检查

### 自动检查
运行以下命令检查配置：

```bash
# 检查生产环境配置
npm run check-production

# 或直接运行
node scripts/check-production-config.js
```

### 手动检查清单
详见: `scripts/production-checklist.md`

## 📝 测试邮件发送

### 开发环境测试
1. 访问 http://localhost:3000/auth
2. 输入测试邮箱（如: test@example.com）
3. 点击"发送验证邮件"
4. 检查邮箱是否收到邮件

### 生产环境准备
1. 在 Resend 控制台验证 `mockpals.com` 域名
2. 获取生产环境 API 密钥
3. 设置正确的环境变量
4. 运行 `npm run check-production` 确认配置

## ⚠️ 重要提醒

- 推送到生产前务必运行 `npm run check-production`
- 确保 `mockpals.com` 域名在 Resend 中已验证
- 生产环境必须设置 `NODE_ENV=production`
- 邮件配置会根据环境自动切换，无需手动修改代码

## 🛠️ 故障排除

### 邮件发送失败
1. 检查 RESEND_API_KEY 是否正确
2. 确认域名验证状态
3. 查看控制台日志获取详细错误信息

### 环境配置问题
1. 运行 `npm run check-production` 诊断
2. 检查环境变量是否正确设置
3. 确认 NODE_ENV 设置正确 