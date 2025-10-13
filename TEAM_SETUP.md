# 团队协作设置指南

## 🤝 如何加入 MockPal 开发

### 方式一：作为 GitHub 协作者（推荐）

#### 1. 接受 GitHub 仓库邀请
- 你会收到来自 `CindyXin97/MockPal-Replicate` 的邀请邮件
- 点击接受邀请

#### 2. 克隆项目到本地
```bash
git clone https://github.com/CindyXin97/MockPal-Replicate.git
cd MockPal-Replicate
npm install
```

#### 3. 配置环境变量
从项目管理员获取 `.env.local` 文件，或者：
```bash
cp .env.example .env.local
```
然后填写以下必需的环境变量（向管理员索取）：
- `DATABASE_URL`: 共享的 Neon 数据库连接
- `NEXTAUTH_SECRET`: 认证密钥
- `RESEND_API_KEY`: 邮件服务密钥
- `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`（可选）

#### 4. 启动开发服务器
```bash
npm run dev
```

#### 5. 创建分支开发
```bash
# 创建新功能分支
git checkout -b feature/your-feature-name

# 开发完成后提交
git add .
git commit -m "描述你的更改"
git push origin feature/your-feature-name

# 在 GitHub 创建 Pull Request
```

---

### 方式二：部署自己的 Vercel 实例（可选）

⚠️ **注意**: 这是可选的测试环境，项目管理员**无法访问**你的个人 Vercel 部署。

如果你想独立部署和测试：

#### 1. Fork 仓库（可选）
在 GitHub 上 Fork `CindyXin97/MockPal-Replicate`

#### 2. 连接到 Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 点击 **Add New** → **Project**
3. 导入你的 GitHub 仓库
4. 配置环境变量（同上）
5. 点击 **Deploy**

#### 3. 配置环境变量
在 Vercel Project Settings → Environment Variables 中添加：
```
DATABASE_URL=<向管理员索取>
NEXTAUTH_URL=<你的vercel域名>
NEXTAUTH_SECRET=<向管理员索取或自己生成>
RESEND_API_KEY=<向管理员索取>
GOOGLE_CLIENT_ID=<可选>
GOOGLE_CLIENT_SECRET=<可选>
```

#### 4. 重要说明
- 这是你的**个人测试环境**，项目管理员无法访问
- 主要的生产部署在项目管理员的 Vercel 账号
- 你的改动通过 GitHub PR 合并后，会自动部署到生产环境
- 不需要担心你的测试部署影响生产环境

---

## 📋 开发规范

### 分支命名规范
- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构

### 提交信息规范
```
feat: 添加新功能
fix: 修复某个问题
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建或辅助工具变动
```

### Pull Request 流程
1. 从 `main` 分支创建新分支
2. 开发并测试功能
3. 提交 PR 到 `main` 分支
4. 等待代码审查
5. 合并后自动部署到 Vercel

---

## 🔐 安全注意事项

⚠️ **重要提醒**：
- 不要将 `.env.local` 提交到 Git
- 不要在公开场合分享环境变量
- 使用加密方式（如 1Password、LastPass）共享敏感信息
- 生产环境密钥定期更换

---

## 🆘 常见问题

### Q: 如何获取环境变量？
A: 联系项目管理员（Cindy）获取 `.env.local` 文件或相关密钥。

### Q: 可以修改生产数据库吗？
A: 开发时使用共享的开发数据库。如需测试，可以运行：
```bash
npm run test-reset  # 重置测试数据
```

### Q: 如何同步最新代码？
A: 
```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main  # 合并最新代码到你的分支
```

### Q: 部署失败怎么办？
A: 检查：
1. 环境变量是否正确配置
2. 构建日志中的错误信息
3. 数据库连接是否正常
4. 联系团队成员协助

---

## 📞 联系方式

有任何问题请联系：
- **项目管理员**: Cindy (xincindy924@gmail.com)
- **GitHub Issues**: https://github.com/CindyXin97/MockPal-Replicate/issues

