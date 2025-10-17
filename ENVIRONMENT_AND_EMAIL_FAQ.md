# 环境配置和邮件发送常见问题

生成时间：2025-10-17

---

## ❓ 问题1：所有登录方式的用户都能收到匹配成功邮件吗？

### ✅ 答案：是的！

**所有登录方式的用户都能收到匹配成功邮件**，只要用户在 `users` 表中有 `email` 字段。

### 📊 各种登录方式对比：

| 登录方式 | email 存储来源 | 是否收到匹配邮件？ | 代码位置 |
|---------|--------------|------------------|---------|
| **Google OAuth** | Google账户邮箱 | ✅ 会收到 | `lib/auth-config.ts` L46-53 |
| **邮箱验证登录** | 用户输入邮箱 | ✅ 会收到 | `lib/auth-config.ts` L55-58 |
| **邮箱密码登录** | 注册时邮箱 | ✅ 会收到 | `lib/auth-config.ts` L59-90 |

### 🔍 代码逻辑（lib/matching.ts L344-353）：

```typescript
// 查询双方用户信息
const me = await db.query.users.findFirst({ where: eq(users.id, userId) });
const partner = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });

// 只要有 email 就发送，没有就跳过
await Promise.all([
  me?.email ? emailService.sendMatchSuccessEmail(me.email, {...}) : Promise.resolve(),
  partner?.email ? emailService.sendMatchSuccessEmail(partner.email, {...}) : Promise.resolve(),
]);
```

### 💡 关键点：

1. ✅ **Google 登录用户**：登录时系统会自动保存 Google 账户的邮箱到 `users.email` 字段
2. ✅ **邮箱登录用户**：使用的就是邮箱，肯定有 email
3. ✅ **容错机制**：如果某个用户没有 email，只是不发送给他，不影响另一方

---

## ⚙️ 问题2：NODE_ENV 在哪里查看？现在是什么阶段？

### 📍 当前配置状态：

```
📍 NODE_ENV: 未设置（默认）
🌐 NEXTAUTH_URL: http://localhost:3000
📧 RESEND_API_KEY: 已配置 ✅
🔑 GOOGLE_CLIENT_ID: 已配置 ✅
```

### 🎯 重要说明：

**你不需要手动设置 NODE_ENV**！Next.js 会根据运行命令自动设置：

| 运行命令 | NODE_ENV 自动设为 | 环境类型 | 邮件行为 |
|---------|-----------------|---------|---------|
| `npm run dev` | `development` | 开发环境 | 不发真实邮件，链接打印在控制台 |
| `npm run build` | `production` | 构建 | - |
| `npm start` | `production` | 生产环境 | 发送真实邮件到用户邮箱 |

### 🔍 判断当前是什么环境：

#### 方法1：看你运行的命令
```bash
# 如果你运行的是：
npm run dev
# → 开发环境 (development)

# 如果你运行的是：
npm start
# → 生产环境 (production)
```

#### 方法2：运行检查脚本
```bash
npx tsx scripts/check-current-env.ts
```

#### 方法3：在代码中查看
在任何文件中添加：
```typescript
console.log('当前环境:', process.env.NODE_ENV);
```

### 📧 不同环境的邮件行为：

#### 开发环境 (npm run dev)
```typescript
// lib/email-service.ts L131-136
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 [开发环境] 邮件登录链接：');
  console.log('🔗 请复制此链接到浏览器中登录:');
  console.log(url);
  return { data: { id: 'dev-mode-skip' }, error: null };
}
```
- ✅ **不发送真实邮件**
- ✅ 登录/设置密码链接**直接打印在控制台**
- ✅ 匹配成功通知也只在控制台显示
- 💡 方便本地调试，无需检查邮箱

#### 生产环境 (npm start 或 Vercel)
```typescript
// lib/email-service.ts L140-143
const isProduction = process.env.NODE_ENV === 'production';
const fromEmail = isProduction 
  ? 'MockPal <noreply@mockpals.com>'  // 生产
  : 'MockPal <onboarding@resend.dev>'; // 测试
```
- 📮 **真实发送邮件**
- 📧 使用 `noreply@mockpals.com` 作为发件人
- ✅ 可以发送到任意邮箱（已验证域名）

---

## 🎯 你现在的状态：

### 根据 `NEXTAUTH_URL: http://localhost:3000` 判断：

你现在是 **本地开发环境**

### 判断依据：
1. ✅ NEXTAUTH_URL 指向 localhost:3000
2. ✅ 如果运行 `npm run dev`，那就是开发环境
3. ✅ 如果运行 `npm start`，虽然地址是 localhost，但 NODE_ENV 是 production

### 📋 快速检查：

运行这个命令查看进程：
```bash
ps aux | grep "next"
```

- 如果看到 `next dev` → 开发环境
- 如果看到 `next start` → 生产环境（本地）

---

## 🚀 如果想在本地测试真实邮件发送

### 方法1：临时设置生产环境
```bash
# 先构建
npm run build

# 然后以生产模式运行
npm start
```

### 方法2：修改代码强制发送（不推荐）
临时注释掉开发环境的判断：
```typescript
// if (process.env.NODE_ENV === 'development') {
//   console.log('开发环境，跳过发送');
//   return;
// }
```

---

## 📝 总结

### 关于匹配成功邮件：
✅ **所有用户都能收到**，无论是 Google 登录还是邮箱登录  
✅ 只要 `users.email` 字段有值就会发送  
✅ Google 登录时会自动保存用户的 Google 邮箱

### 关于环境配置：
✅ **不需要手动设置 NODE_ENV**  
✅ Next.js 会根据 `npm run dev` 或 `npm start` 自动设置  
✅ 开发环境不发真实邮件，生产环境才发送  
✅ 你目前是 **开发环境**（基于 localhost:3000）

### 如何查看当前环境：
```bash
# 运行检查脚本
npx tsx scripts/check-current-env.ts
```

---

生成时间：2025-10-17  
相关文档：`EMAIL_SYSTEM_SUMMARY.md`, `DEPLOYMENT_GUIDE.md`

