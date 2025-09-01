# MockPal - 数据岗位模拟面试匹配平台

MockPal 是专为数据专业人士（DA/DS/DE/BA）设计的模拟面试匹配平台。使用类似Tinder的匹配机制，基于标签和偏好智能连接求职者进行面试练习。

## ✨ 功能特点

### 🔐 多样化认证系统
- **Google OAuth**: 一键Google账号登录
- **邮箱魔法链接**: 无密码邮箱验证登录  
- **邮箱密码**: 传统邮箱密码认证
- 首次登录自动创建用户资料

### 🎯 智能匹配系统
- **优先级匹配**: 相互邀请+内容重叠 > 内容重叠 > 工作经验匹配
- **每日限制**: 每天最多浏览5个候选人，避免疲劳刷选
- **类Tinder体验**: 卡片式浏览，喜欢/跳过操作
- **即时匹配**: 双向喜欢立即建立联系

### 📋 完整用户资料系统
- **基本信息**: 岗位类型(DA/DS/DE/BA)、经验等级、目标公司/行业
- **练习偏好**: 技术面试、行为面试、案例分析
- **联系方式**: 邮箱、微信、LinkedIn（匹配成功后交换）

### 💬 面试反馈系统
- 面试完成状态记录
- 详细反馈内容
- 历史匹配管理

## 🛠️ 技术架构

### 核心技术栈
- **前端框架**: Next.js 15.3.2 with App Router
- **身份验证**: NextAuth.js 4.24.11 多提供商支持
- **数据库**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM (类型安全)
- **UI组件**: shadcn/ui + Tailwind CSS
- **状态管理**: Jotai
- **邮件服务**: Resend API

### 架构特点
- **数据库优先设计**: 围绕完整schema构建应用
- **Server Actions**: 现代化的服务器端数据处理
- **类型安全**: 从数据库到前端的完整TypeScript支持
- **响应式设计**: 移动优先的用户体验
- **中间件保护**: 自动路由保护和重定向

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL数据库（推荐使用Neon）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/MockPal-Replicate.git
   cd MockPal-Replicate
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   
   复制环境变量模板:
   ```bash
   cp .env.example .env.local
   ```
   
   配置必需的环境变量:
   ```env
   # 数据库连接
   DATABASE_URL="your-neon-postgresql-url"
   
   # NextAuth配置
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # 邮件服务
   RESEND_API_KEY="re_xxxxxxxxxxxxx"
   ```

4. **数据库初始化**
   ```bash
   npm run migrate
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   开发服务器会自动检测可用端口（通常是3000、3001、3003等）

6. **访问应用**
   
   打开 http://localhost:3000 查看应用

## 📁 项目结构

```
MockPal-Replicate/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   ├── api/               # API路由
│   ├── auth/              # 认证相关页面
│   ├── matches/           # 匹配功能页面
│   ├── profile/           # 用户资料页面
│   └── feedback/          # 反馈系统页面
├── components/            # UI组件
│   ├── ui/               # shadcn/ui基础组件
│   └── ...               # 业务组件
├── lib/                   # 核心业务逻辑
│   ├── db/               # 数据库配置和Schema
│   ├── auth-config.ts    # NextAuth配置
│   ├── matching.ts       # 匹配算法
│   ├── profile.ts        # 资料管理
│   └── email-service.ts  # 邮件服务
├── middleware.ts          # 路由中间件
└── docs/                 # 详细文档
```

## 🔧 开发命令

```bash
# 启动开发服务器（自动端口检测）
npm run dev

# 构建生产版本  
npm run build

# 启动生产服务器
npm start

# 数据库迁移
npm run migrate

# 代码检查
npm run lint
```

## 📖 详细文档

- **[数据库架构](./DATABASE_ARCHITECTURE.md)**: 完整的数据库设计和技术链路
- **[认证配置](./AUTH_SETUP.md)**: 多提供商认证配置指南
- **[邮件配置](./EMAIL_SETUP.md)**: Resend邮件服务配置
- **[开发指南](./CLAUDE.md)**: 详细的开发说明和架构文档

## 🔐 安全特性

- 会话加密和安全存储
- CSRF保护
- 安全的密码散列(bcryptjs)
- 环境变量保护敏感信息
- 中间件级别的路由保护

## 🌍 部署

### Vercel部署（推荐）

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 环境变量配置
确保在生产环境中配置以下变量：
- `DATABASE_URL`: Neon数据库连接
- `NEXTAUTH_URL`: 生产域名  
- `NEXTAUTH_SECRET`: 强密码
- `GOOGLE_CLIENT_*`: Google OAuth凭据
- `RESEND_API_KEY`: 邮件服务密钥

## 🤝 贡献

欢迎提交Issue和Pull Request来完善这个项目！

## 📄 许可

MIT License