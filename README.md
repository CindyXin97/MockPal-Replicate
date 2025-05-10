# MockPal - 数据岗位模拟面试匹配平台

MockPal 是一个专为数据岗位(DA/DS/DE)求职者设计的模拟面试匹配平台，通过标签匹配系统帮助用户快速找到合适的练习伙伴。

## 功能特点

- 用户注册与标签填写
- 基于标签的候选人匹配
- 匹配结果展示与联系方式交换
- 类探探式的浏览/匹配机制

## 技术栈

- **前端框架**: Next.js
- **UI组件库**: shadcn/ui
- **样式**: Tailwind CSS
- **状态管理**: Jotai
- **数据库**: Vercel Neon (PostgreSQL)

## 开发环境设置

### 前提条件

- Node.js 18+ 
- PostgreSQL 数据库 (或 Vercel Neon 账号)

### 安装步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/yourusername/mockpal.git
   cd mockpal
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   ```
   # Create a .env.local file with the following
   DATABASE_URL="your-postgresql-connection-string"
   ```

4. 启动开发服务器
   ```bash
   npm run dev
   ```

5. 访问 http://localhost:3000 查看应用

## 项目结构

- `/app` - Next.js 应用页面和API路由
- `/components` - UI组件
- `/lib` - 工具函数和数据库连接
- `/public` - 静态资源

## 部署

该项目可以轻松部署到 Vercel:

1. 将代码推送到 GitHub 仓库
2. 连接 Vercel 账号
3. 导入项目并部署
4. 配置环境变量 (DATABASE_URL)

## 贡献

欢迎提交 Pull Request 和 Issue 来完善此项目！

## 许可

MIT

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
