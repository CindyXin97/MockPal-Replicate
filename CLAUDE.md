# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MockPal 是专为数据专业人士（DA/DS/DE）设计的模拟面试匹配平台。它使用类似Tinder的匹配系统，根据兼容的标签和偏好连接求职者进行面试练习。

## 开发命令

```bash
# 启动开发服务器（自动检测可用端口）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 数据库迁移
npm run migrate

# 代码检查（ESLint已配置）
npm run lint
```

**重要提示**: 
- 开发服务器会自动检测可用端口（通常是3000、3001、3003等）
- 当前未配置测试框架

## 架构概述

### 技术栈
- **前端**: Next.js 15.3.2 with App Router
- **身份验证**: NextAuth.js 4.24.11 支持多种提供商
- **数据库**: Neon PostgreSQL with Drizzle ORM
- **UI组件**: shadcn/ui components with Tailwind CSS
- **状态管理**: Jotai
- **邮件服务**: Resend API 集中式服务层

### 核心架构模式

**数据库优先方法**: 应用程序围绕 `lib/db/schema.ts` 中的综合数据库架构构建，定义：
- 支持OAuth的用户管理（users, accounts, sessions, verification_tokens）
- 带有详细标签的个人资料系统（userProfiles）
- 状态跟踪的匹配系统（matches）
- 每日浏览限制（userDailyViews）
- 面试反馈系统（feedbacks）

**多提供商身份验证**: 支持三种身份验证方法：
1. Google OAuth（通过GoogleProvider）- 首次登录时自动创建账户
2. 邮箱魔法链接（通过EmailProvider和Resend）- 首次登录时自动创建账户
3. 邮箱/密码（通过CredentialsProvider）- 需要通过邮箱设置流程注册

所有身份验证都通过NextAuth和DrizzleAdapter处理，实现自动用户/账户管理。邮箱是主要用户标识符（无用户名字段）。

**匹配算法**: `lib/matching.ts` 中的核心业务逻辑实现：
- 优先级匹配（邀请+内容重叠 > 内容重叠 > 工作/经验匹配）
- 每日浏览限制（每天4个用户）
- 匹配状态管理（pending/accepted/rejected）
- 成功匹配后联系信息交换

**受保护路由系统**: 根级别中间件处理：
- 通过cookies进行基于会话的身份验证检查
- 受保护路由的自动重定向（/matches, /profile, /feedback）
- 已认证用户访问/auth时重定向到/matches

**集中式邮件服务**: 所有邮件功能通过 `lib/email-service.ts` 处理：
- 单例模式防止多个Resend实例
- 统一邮件模板和发送逻辑
- 被NextAuth用于验证邮件

### 关键配置文件

**环境变量**（完整设置见AUTH_SETUP.md）：
- NextAuth配置（URL, secret）
- Google OAuth凭据
- Resend API密钥用于邮件发送
- Neon数据库连接

**数据库架构**: 所有模型在 `lib/db/schema.ts` 中定义，使用Drizzle ORM建立适当关系。关键关系：
- Users -> UserProfiles（一对一）
- Users -> Matches（通过matches表多对多）
- Matches -> Feedbacks（一对多）

### 代码组织

**Actions层**（`app/actions/`）：服务器操作用于：
- 身份验证操作（auth.ts）
- 个人资料管理（profile.ts） 
- 匹配逻辑（matching.ts）

**API路由**（`app/api/`）：RESTful端点包括：
- NextAuth处理器在 `/api/auth/[...nextauth]`
- 自定义邮件验证在 `/api/auth/email-verify`
- 数据库测试在 `/api/test-db`

**组件结构**: 
- UI组件在 `components/ui/`（shadcn/ui）
- 布局组件（`public-layout.tsx`, `auth-layout.tsx`）
- 与页面集成的业务逻辑组件

### 身份验证流程

应用使用NextAuth 4.x和DrizzleAdapter。关键实现细节：
- Events.createUser回调异步创建用户资料
- 自定义sendVerificationRequest函数使用集中式邮件服务
- 会话策略设置为数据库以实现有状态身份验证
- 为Google启用自动OAuth账户链接
- DrizzleAdapter由于架构兼容性需要类型断言

### 匹配系统逻辑

用户基于以下条件看到潜在匹配：
1. 今天未互动过的用户（每日限制：4次）
2. 拥有完整资料的用户（基本信息+练习偏好+联系信息）
3. 优先级排序：相互兴趣且内容重叠 > 内容重叠 > 工作/经验匹配 > 其他
4. 当两个用户互相喜欢时自动接受匹配

### 开发说明

- 开发服务器自动检测可用端口（3000、3001、3003等）
- 数据库迁移通过 `npm run migrate` 处理
- 应用支持中文UI界面，错误消息使用英文
- 响应式设计针对移动优先体验优化
- 在 `/auth` 的统一身份验证页面，支持模式切换（?mode=register）
- 邮件服务使用单例模式 - 通过 `emailService.getInstance()` 访问
- 所有Resend邮件发送通过 `lib/email-service.ts`

### 身份验证系统详情

**注册流程**:
- 邮箱/密码注册发送设置密码邮件给用户
- 用户点击邮件链接在 `/auth/set-password` 设置密码
- Google/邮箱魔法链接注册在首次登录时自动完成

**用户资料管理**:
- 显示名称（`users.name`）是必填的，在个人资料页面强制执行
- 资料完成包括：名称、工作信息、联系方式、练习偏好
- 用户在资料完整前无法进入匹配页面
- 名称可在个人资料页面随时更新（与主表单集成）

**关键实现说明**:
- NextAuth会话策略使用数据库存储
- 用户显示名称来源于 `session.user.name` 字段
- 邮箱是主要唯一标识符（架构中无用户名字段）
- 资料和名称更新在单个表单提交中原子性处理

### 重要实现细节

**数据库架构**: 使用Drizzle ORM和Neon PostgreSQL。要点：
- 所有主键使用序列ID
- 邮箱是users表中的唯一标识符（无用户名字段）
- 用户资料与用户是一对一关系
- 匹配系统跟踪每日互动限制
- 基于会话的身份验证与数据库存储

**邮件配置**: 
- 集中式服务防止多个Resend实例
- 发件人：`MockPal <noreply@mockpals.com>` 
- 模板包含24小时过期提示
- 与NextAuth验证流程集成

**路由保护**:
- 中间件检查会话cookies进行身份验证
- 受保护路由：`/matches`, `/profile`, `/feedback`
- 自动重定向维护用户流程