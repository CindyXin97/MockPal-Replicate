# 生产环境部署指南

## 📋 部署概述

本次部署包括：
1. ✅ 添加"实习"经验水平选项
2. ✅ 实现用户资料历史记录功能
3. ✅ 修复重复的 profile 记录问题
4. ✅ 添加数据库唯一约束

---

## 🚀 部署步骤

### 步骤 1: 代码部署

代码已经准备好，直接推送到 GitHub：

```bash
# 确认当前状态
git status

# 添加所有更改
git add -A

# 提交更改
git commit -m "feat: 添加实习经验选项和资料历史记录功能

- 添加实习选项到经验水平
- 实现双表设计（主表+历史表）
- 修复重复profile记录问题
- 添加数据库唯一约束
- 更新匹配系统使用最新数据"

# 推送到 GitHub
git push origin main
```

---

### 步骤 2: 数据库迁移（生产环境）

⚠️ **重要：请在生产数据库上按顺序执行以下操作**

#### 2.1 清理重复数据（如果有）

```bash
# 方式 1: 在本地连接生产数据库运行脚本
DATABASE_URL="your_production_db_url" npx tsx scripts/fix-duplicate-profiles.ts
```

或者手动在数据库执行：

```sql
-- 查看是否有重复
SELECT user_id, COUNT(*) as count
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 如果有重复，清理（保留最新的）
-- 对每个重复的 user_id 执行：
DELETE FROM user_profiles 
WHERE user_id = <重复的user_id> 
  AND id != (
    SELECT id FROM user_profiles 
    WHERE user_id = <重复的user_id> 
    ORDER BY updated_at DESC 
    LIMIT 1
  );
```

#### 2.2 添加唯一约束

```sql
-- 在生产数据库执行
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);

-- 验证约束已添加
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass 
  AND conname = 'user_profiles_user_id_unique';
```

或者运行迁移文件：

```bash
psql $DATABASE_URL -f migrations/0011_add_unique_constraint_user_profiles.sql
```

#### 2.3 创建历史表（可选，推荐）

```sql
-- 在生产数据库执行
-- 运行 migrations/0012_create_profile_history_table.sql 的内容

CREATE TABLE IF NOT EXISTS user_profile_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- 完整的资料快照
  job_type VARCHAR(50),
  experience_level VARCHAR(50),
  target_company VARCHAR(255),
  target_industry VARCHAR(255),
  other_company_name VARCHAR(255),
  technical_interview BOOLEAN,
  behavioral_interview BOOLEAN,
  case_analysis BOOLEAN,
  stats_questions BOOLEAN,
  email VARCHAR(255),
  wechat VARCHAR(255),
  linkedin VARCHAR(255),
  bio VARCHAR(1000),
  school VARCHAR(255),
  
  -- 变更元数据
  change_type VARCHAR(20) DEFAULT 'update',
  changed_fields TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profile_history_user_id 
  ON user_profile_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_history_created_at 
  ON user_profile_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_history_user_created 
  ON user_profile_history(user_id, created_at DESC);
```

或者运行迁移文件：

```bash
psql $DATABASE_URL -f migrations/0012_create_profile_history_table.sql
```

---

### 步骤 3: 验证部署

#### 3.1 验证数据库更改

```sql
-- 1. 验证唯一约束
SELECT conname FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass;

-- 2. 验证历史表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_profile_history'
);

-- 3. 检查是否还有重复
SELECT user_id, COUNT(*) 
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;
-- 应该返回 0 行

-- 4. 统计数据
SELECT 
  (SELECT COUNT(*) FROM user_profiles) as profile_count,
  (SELECT COUNT(DISTINCT user_id) FROM user_profiles) as unique_users,
  (SELECT COUNT(*) FROM user_profile_history) as history_count;
```

#### 3.2 测试前端功能

1. **测试新增的"实习"选项**
   - 登录用户账号
   - 进入个人资料页面
   - 检查经验水平下拉菜单是否有"实习"选项
   - 选择"实习"并保存
   - 刷新页面，确认选项保存成功

2. **测试资料更新**
   - 修改用户资料（如改变经验水平）
   - 保存后立即去匹配页面
   - 验证匹配推荐基于最新资料

3. **测试历史记录（如果已创建历史表）**
   ```bash
   # 在本地或服务器运行
   DATABASE_URL="your_production_db_url" \
   npx tsx scripts/view-profile-history.ts <user_id>
   ```

---

## 📊 部署检查清单

### 代码部署
- [ ] 代码已推送到 GitHub
- [ ] Vercel 自动部署成功
- [ ] 前端页面可以访问

### 数据库迁移
- [ ] 清理了重复的 profile 记录
- [ ] 添加了 user_profiles.user_id 的 UNIQUE 约束
- [ ] 创建了 user_profile_history 表（可选）
- [ ] 创建了相关索引

### 功能测试
- [ ] "实习"选项在前端显示
- [ ] 用户可以选择"实习"并保存
- [ ] 资料修改后立即生效
- [ ] 匹配推荐使用最新资料
- [ ] 不会创建重复的 profile 记录

### 数据验证
- [ ] 没有重复的 user_id 记录
- [ ] UNIQUE 约束生效
- [ ] 历史记录正常保存（如果启用）

---

## 🔧 生产环境命令汇总

```bash
# ========================================
# 1. 代码部署
# ========================================

git add -A
git commit -m "feat: 添加实习经验选项和资料历史记录功能"
git push origin main

# ========================================
# 2. 数据库迁移（需要数据库访问权限）
# ========================================

# 连接到生产数据库
psql $DATABASE_URL

# 或者使用 Neon Console 的 SQL Editor

# 执行以下 SQL：

-- Step 1: 清理重复数据
DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, updated_at DESC
);

-- Step 2: 添加唯一约束
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);

-- Step 3: 创建历史表（复制 migrations/0012_create_profile_history_table.sql 的内容）

# ========================================
# 3. 验证部署
# ========================================

# 检查约束
SELECT conname FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass;

# 检查重复
SELECT user_id, COUNT(*) 
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;
```

---

## ⚠️ 回滚计划（如果需要）

如果部署后出现问题，可以回滚：

### 代码回滚

```bash
# 回滚到上一个提交
git revert HEAD
git push origin main
```

### 数据库回滚

```sql
-- 1. 删除唯一约束（如果导致问题）
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_unique;

-- 2. 删除历史表（如果导致问题）
DROP TABLE IF EXISTS user_profile_history CASCADE;
```

---

## 📞 常见问题

### Q1: 如果有用户正在修改资料时部署，会有影响吗？

**A:** 不会。代码是向后兼容的：
- 新代码可以处理旧数据
- 数据库迁移不影响已有数据
- 用户只需刷新页面即可看到新选项

### Q2: 历史表是必须的吗？

**A:** 不是必须的。历史表是可选功能：
- 如果不需要审计追踪，可以不创建
- 即使不创建历史表，系统也能正常工作
- 可以之后再添加

### Q3: 清理重复数据是否安全？

**A:** 是的，清理脚本会：
- 保留每个用户最新的记录（updated_at 最晚的）
- 只删除旧的重复记录
- 建议先在测试环境验证

### Q4: 唯一约束会影响性能吗？

**A:** 不会，反而会提高性能：
- UNIQUE 约束自动创建索引
- 查询速度更快
- 防止数据错误

---

## 🎯 预期结果

部署完成后：

1. **前端**
   - ✅ 经验水平选项：实习、应届、1-3年、3-5年、5年以上
   - ✅ 用户可以选择"实习"
   - ✅ 邮件通知正确显示（Intern）

2. **数据库**
   - ✅ user_profiles 表：每个用户 1 条最新记录
   - ✅ user_profile_history 表：所有修改历史（可选）
   - ✅ 唯一约束防止重复

3. **匹配系统**
   - ✅ 使用最新的用户资料
   - ✅ 用户修改后立即生效
   - ✅ 推荐更准确

---

## 📝 部署后验证脚本

```bash
# 在本地运行，连接生产数据库
DATABASE_URL="your_production_db_url" npx tsx scripts/verify-code-structure.ts

# 查看某个用户的资料历史
DATABASE_URL="your_production_db_url" npx tsx scripts/view-profile-history.ts 1
```

---

## ✅ 完成确认

部署完成后，请在此标记：

- [ ] 代码已部署
- [ ] 数据库已迁移
- [ ] 功能已测试
- [ ] 团队已通知

**部署日期：** _____________

**部署人员：** _____________

**验证人员：** _____________

---

需要帮助？查看相关文档：
- `PROFILE_HISTORY_GUIDE.md` - 历史记录功能详细说明
- `MATCHING_DATA_FLOW.md` - 匹配系统数据流验证
- `FIX_DUPLICATE_PROFILES.md` - 重复数据修复指南

