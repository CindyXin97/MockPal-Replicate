# 外键约束问题解决方案 🔧

当您遇到 `cannot truncate a table referenced in a foreign key constraint` 错误时，这里是完整的解决方案。

## ❌ 问题原因

`users` 表被以下表通过外键约束引用，无法直接截断：

```
users (被引用的主表)
├── user_profiles.user_id → users.id
├── matches.user1_id → users.id  
├── matches.user2_id → users.id
├── feedbacks.user_id → users.id
├── user_achievements.user_id → users.id
├── user_daily_views.user_id → users.id
├── user_daily_views.viewed_user_id → users.id
├── accounts.user_id → users.id (CASCADE)
└── sessions.user_id → users.id (CASCADE)
```

## ✅ 解决方案

### 方案1：使用安全清理脚本（推荐）

我们提供了专门的安全清理脚本，按正确顺序删除数据：

```bash
# 安全清理所有用户数据（保留题库）
npm run safe-truncate-users -- --confirm-delete-all-users

# 同时重置自增ID序列
npm run safe-truncate-users -- --confirm-delete-all-users --reset-sequences
```

**执行顺序**：
1. `verification_tokens` (独立表)
2. `sessions` (引用users)  
3. `accounts` (引用users)
4. `feedbacks` (引用matches和users)
5. `user_daily_views` (引用users)
6. `user_achievements` (引用users)  
7. `matches` (引用users)
8. `user_profiles` (引用users)
9. `users` (最后删除)

### 方案2：手动SQL删除

如果您想手动执行，按以下顺序运行SQL：

```sql
-- 第1步：独立表
DELETE FROM verification_tokens;

-- 第2步：认证相关（有CASCADE，但建议手动删除）
DELETE FROM sessions;
DELETE FROM accounts;

-- 第3步：业务数据表（按依赖关系）
DELETE FROM feedbacks;
DELETE FROM user_daily_views;
DELETE FROM user_achievements;
DELETE FROM matches;
DELETE FROM user_profiles;

-- 第4步：最后删除用户表
DELETE FROM users;

-- 可选：重置自增序列
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE matches_id_seq RESTART WITH 1;
ALTER SEQUENCE feedbacks_id_seq RESTART WITH 1;
ALTER SEQUENCE user_achievements_id_seq RESTART WITH 1;
ALTER SEQUENCE user_daily_views_id_seq RESTART WITH 1;
ALTER SEQUENCE accounts_id_seq RESTART WITH 1;
ALTER SEQUENCE sessions_id_seq RESTART WITH 1;
```

### 方案3：使用CASCADE删除（谨慎）

**⚠️ 警告：此方法会删除所有相关数据，请谨慎使用！**

```sql
-- 临时禁用外键检查（PostgreSQL不直接支持，需要删除约束）
-- 或者使用CASCADE删除
DELETE FROM users CASCADE;
```

### 方案4：TRUNCATE with CASCADE（最危险）

**🚨 极度谨慎：会删除所有相关表的所有数据！**

```sql
TRUNCATE TABLE users CASCADE;
```

## 🔒 题库保护

**所有方案都会保护题库数据**：
- `interview_questions` 表是独立的，不依赖users表
- `interview_requests` 表也是独立的
- 无论使用哪种方案，题库都不会受到影响

## 📊 验证清理结果

清理完成后，验证数据状态：

```sql
-- 检查所有表的记录数
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles  
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'feedbacks', COUNT(*) FROM feedbacks
UNION ALL
SELECT 'user_achievements', COUNT(*) FROM user_achievements
UNION ALL
SELECT 'user_daily_views', COUNT(*) FROM user_daily_views
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'verification_tokens', COUNT(*) FROM verification_tokens
UNION ALL
SELECT 'interview_questions', COUNT(*) FROM interview_questions;
```

期望结果：
- 用户相关表：0条记录
- `interview_questions`：保持原有数量

## 🛠️ 预防措施

### 1. 定期备份
```bash
# 备份整个数据库
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 2. 测试环境先试
在本地或测试环境先验证清理脚本：
```bash
# 本地测试
npm run safe-truncate-users -- --confirm-delete-all-users
```

### 3. 分步执行
如果担心一次性删除太多数据，可以分步执行：
```bash
# 只清理测试数据
npm run clear-data

# 再清理特定表
DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
```

## 🆘 紧急恢复

如果误删了重要数据：

1. **立即停止所有操作**
2. **从最近的备份恢复**
3. **检查数据完整性**

```bash
# 从备份恢复（示例）
psql $DATABASE_URL < backup_20240101.sql
```

## 📋 常见问题

**Q: 为什么不能直接TRUNCATE？**
A: PostgreSQL的外键约束防止删除被引用的数据，确保数据完整性。

**Q: CASCADE删除安全吗？**  
A: CASCADE会自动删除所有相关数据，可能超出预期范围，建议手动控制删除顺序。

**Q: 题库会被删除吗？**
A: 不会！`interview_questions`表是独立的，不依赖用户数据。

**Q: 如何只删除测试用户？**
A: 使用条件删除，如：`DELETE FROM users WHERE email LIKE '%test%'`，但仍需按依赖顺序处理。

---

**建议**：优先使用我们提供的安全清理脚本，它已经处理了所有复杂的依赖关系！🚀 