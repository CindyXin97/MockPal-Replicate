# MockPal 认证系统配置指南

## 功能概述

MockPal 现已支持以下登录方式：
- **Google OAuth 登录** - 使用 Google 账号快速登录
- **邮箱魔术链接登录** - 无需密码，通过邮箱验证登录
- **传统用户名密码登录** - 保留原有登录方式

## 环境变量配置

请将 `.env.example` 复制为 `.env.local` 并配置以下环境变量：

```bash
cp .env.example .env.local
```

### 必需的环境变量

1. **NextAuth 配置**
```env
NEXTAUTH_URL="http://localhost:3000"  # 生产环境改为实际域名
NEXTAUTH_SECRET="your-secret-key"     # 使用 openssl rand -base64 32 生成
```

2. **Google OAuth 配置**
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建新项目或选择现有项目
   - 启用 Google+ API
   - 创建 OAuth 2.0 客户端 ID
   - 添加授权重定向 URI: `http://localhost:3000/api/auth/callback/google`
   - 复制客户端 ID 和密钥

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

3. **邮件发送配置 (Resend)**
   - 注册 [Resend](https://resend.com) 账号
   - 获取 API Key
   - 验证发送域名

```env
RESEND_API_KEY="re_xxxxxxxxxxxxx"
```

## 数据库迁移

项目已包含迁移脚本，运行以下命令更新数据库：

```bash
npm run migrate
```

## 功能说明

### 1. Google 登录
- 用户点击 "使用 Google 账号登录" 按钮
- 跳转至 Google 授权页面
- 授权成功后自动创建账号并登录
- 首次登录会自动创建用户资料

### 2. 邮箱魔术链接
- 用户输入邮箱地址
- 系统发送包含登录链接的邮件
- 点击链接即可完成登录
- 链接有效期为 24 小时

### 3. 传统登录
- 保留原有的用户名密码登录方式
- 支持用户注册和登录

## 页面保护

以下页面需要登录才能访问：
- `/matches` - 匹配页面
- `/profile` - 个人资料页面  
- `/feedback` - 反馈页面

未登录用户访问这些页面会自动重定向到登录页。

## 开发注意事项

1. **本地测试 Google OAuth**
   - 确保 `NEXTAUTH_URL` 设置为 `http://localhost:3000`
   - Google Console 中添加本地回调地址

2. **邮件测试**
   - 使用 Resend 的测试模式可以查看发送日志
   - 检查垃圾邮件文件夹

3. **生产环境部署**
   - 更新 `NEXTAUTH_URL` 为实际域名
   - 使用强密码生成 `NEXTAUTH_SECRET`
   - 在 Google Console 添加生产环境回调地址
   - 配置真实的邮件发送域名

## 故障排查

1. **Google 登录失败**
   - 检查客户端 ID 和密钥是否正确
   - 确认回调 URL 配置正确
   - 查看浏览器控制台错误信息

2. **邮件发送失败**
   - 验证 Resend API Key
   - 检查发送域名是否已验证
   - 查看 Resend 控制台的发送日志

3. **数据库连接问题**
   - 确认 DATABASE_URL 配置正确
   - 运行迁移脚本更新表结构

## 安全建议

1. 生产环境使用 HTTPS
2. 定期更新 NEXTAUTH_SECRET
3. 限制 OAuth 应用的权限范围
4. 启用双因素认证保护 Google Cloud 账号
5. 监控异常登录行为