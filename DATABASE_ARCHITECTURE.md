# MockPal 数据库架构与技术链路

## 🏗️ 整体架构概览

MockPal 采用现代化的全栈架构，以数据库为中心设计，实现高性能、类型安全的模拟面试匹配平台。

**核心技术栈**: Next.js 15 + Drizzle ORM + Neon PostgreSQL + NextAuth.js

**数据流向**: 用户操作 → 客户端组件 → Server Actions → 业务逻辑层 → ORM → 数据库

## 📊 数据库连接层

### 连接配置 (`lib/db/index.ts`)

```typescript
// Neon Serverless 数据库连接
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**技术特性**:
- **Neon Serverless**: 支持边缘计算和按需扩展
- **HTTP连接**: 使用 `@neondatabase/serverless` 和 `drizzle-orm/neon-http`
- **环境变量管理**: 通过 `DATABASE_URL` 统一管理连接串
- **Schema集成**: 自动导入完整的数据库schema定义

## 🗄️ 数据模型设计

### 核心表结构

#### 1. 用户认证系统
```sql
-- 用户主表
users (id, email, name, password_hash, created_at, updated_at)

-- NextAuth OAuth账户
accounts (id, user_id, provider, provider_account_id, ...)

-- 用户会话
sessions (session_token, user_id, expires, ...)

-- 验证令牌
verification_tokens (identifier, token, expires)
```

#### 2. 业务核心表
```sql
-- 用户详细资料
user_profiles (
  id, user_id, 
  job_type,           -- DA/DS/DE/BA
  experience_level,   -- 应届/1-3年/3-5年/5年以上
  target_company, target_industry,
  technical_interview, behavioral_interview, case_analysis,
  email, wechat, linkedin, bio
)

-- 匹配关系
matches (
  id, user1_id, user2_id,
  status,  -- pending/accepted/rejected
  created_at, updated_at
)

-- 每日浏览限制
user_daily_views (
  id, user_id, viewed_user_id,
  date,    -- YYYY-MM-DD格式
  created_at
)

-- 面试反馈
feedbacks (
  id, match_id, user_id,
  interview_status,  -- yes/no
  content, created_at
)
```

### 关系设计

**Drizzle Relations 定义**:
- **用户 ↔ 资料**: 一对一关系
- **用户 ↔ 匹配**: 多对多关系（通过matches表）
- **匹配 ↔ 反馈**: 一对多关系
- **用户 ↔ 浏览记录**: 一对多关系

## ⚙️ ORM 操作层

### Drizzle ORM 核心特性

#### 1. 类型安全查询
```typescript
// 关联查询示例
const userProfile = await db.query.userProfiles.findFirst({
  where: eq(userProfiles.userId, userId),
  with: {
    user: true  // 自动关联用户表
  }
});
```

#### 2. 复杂条件构建
```typescript
// 匹配算法中的复杂查询
const potentialMatches = await db.query.users.findMany({
  where: and(
    not(eq(users.id, userId)),
    exists(
      db.select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, users.id))
    )
  ),
  with: { profile: true },
  orderBy: [desc(users.createdAt)]
});
```

#### 3. 事务处理
```typescript
// 创建匹配时的原子操作
await db.transaction(async (tx) => {
  // 记录浏览
  await tx.insert(userDailyViews).values({...});
  // 创建匹配
  await tx.insert(matches).values({...});
});
```

## 🔄 业务逻辑层

### 分层架构

#### 1. 业务逻辑层 (`lib/` 目录)
- **`lib/profile.ts`**: 用户资料CRUD操作
- **`lib/matching.ts`**: 复杂匹配算法和查询逻辑  
- **`lib/auth-config.ts`**: NextAuth配置和DrizzleAdapter集成

#### 2. Server Actions层 (`app/actions/`)
```typescript
// 薄包装层，参数验证 + 业务调用
export async function fetchPotentialMatches(userId: number) {
  if (!userId) {
    return { success: false, message: '用户未登录' };
  }
  return getPotentialMatches(userId);
}
```

### 核心业务逻辑

#### 匹配算法实现 (`lib/matching.ts:93-123`)
```typescript
// 优先级排序算法
const invitedOverlapList = [];    // 相互邀请+内容重叠
const overlapList = [];           // 内容重叠  
const jobExpList = [];            // 工作经验匹配
const otherList = [];             // 其他

// 最终排序: 优先级递减
const finalList = [
  ...invitedOverlapList, 
  ...overlapList, 
  ...jobExpList, 
  ...otherList
].slice(0, 5);
```

#### 每日限制机制
- 每用户每天最多浏览5个候选人
- 通过 `user_daily_views` 表记录和控制
- 基于日期字符串 (YYYY-MM-DD) 进行限制

## 🌐 应用层调用

### 前端数据流

#### 1. 会话管理
```typescript
// NextAuth会话获取
const { data: session } = useSession();
const userId = parseInt(session.user.id);
```

#### 2. 状态管理
- **全局状态**: Jotai atoms (`potentialMatchesAtom`)
- **本地状态**: React hooks + useState
- **数据缓存**: 自动化的查询结果缓存

#### 3. 完整调用链
```typescript
// 客户端组件
const loadMatches = async () => {
  const result = await fetchPotentialMatches(user.id);
  setPotentialMatches(result.matches);
}

// Server Action (app/actions/matching.ts)
export async function fetchPotentialMatches(userId: number) {
  return getPotentialMatches(userId);
}

// 业务逻辑 (lib/matching.ts) 
export async function getPotentialMatches(userId: number) {
  // 复杂的多表关联查询
  // 优先级排序算法
  // 每日限制检查
  return { success: true, matches: [...] };
}
```

## 🔐 身份验证集成

### NextAuth + DrizzleAdapter

```typescript
// DrizzleAdapter配置 (lib/auth-config.ts:14-19)
adapter: DrizzleAdapter(db, {
  usersTable: users as any,
  accountsTable: accounts as any, 
  sessionsTable: sessions as any,
  verificationTokensTable: verificationTokens as any,
})
```

**认证提供商支持**:
1. **Google OAuth**: 自动账户创建和链接
2. **邮箱魔法链接**: 无密码验证（集成Resend）
3. **邮箱密码**: 传统认证方式

**自动化用户管理**:
- 首次登录自动创建用户资料
- 会话持久化到数据库
- OAuth账户自动关联

## 🎯 性能优化

### 查询优化
1. **索引策略**: 关键字段自动索引（email唯一索引等）
2. **关联预加载**: 使用 `with` 关键字避免N+1查询
3. **分页限制**: 匹配结果限制为5个，避免大数据集查询

### 连接优化  
1. **Serverless架构**: Neon自动扩缩容
2. **边缘计算**: HTTP连接支持全球部署
3. **连接池**: Drizzle自动管理连接生命周期

## 🔧 开发工具

### 数据库管理
```bash
# 数据库迁移
npm run migrate

# 开发服务器（自动端口检测）
npm run dev
```

### 调试工具
- **NextAuth Debug**: 开发环境自动启用
- **Drizzle Studio**: 可视化数据库管理
- **Console日志**: 分层错误追踪

## 📈 扩展性设计

### 架构优势
1. **类型安全**: 从数据库到前端的完整TypeScript支持
2. **模块化**: 清晰的分层架构，易于维护和测试  
3. **现代化**: 充分利用Next.js App Router和Server Actions
4. **可扩展**: Neon Serverless支持自动扩缩容

### 未来扩展点
- **缓存层**: Redis集成用于高频查询
- **消息队列**: 匹配成功通知系统
- **数据分析**: 用户行为追踪和匹配效果分析
- **多地部署**: 利用Neon的边缘网络能力

---

这个架构体现了现代全栈应用的最佳实践，在保证开发效率的同时，提供了高性能、高可用的技术基础。