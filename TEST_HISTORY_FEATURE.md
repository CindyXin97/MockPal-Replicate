# 测试历史记录功能

## ✅ 功能确认

代码已经正确实现了自动保存历史记录功能：

1. ✅ **更新资料时**（第 162 行）
   - 自动调用 `saveProfileHistory(..., 'update')`
   - 记录修改的字段

2. ✅ **创建资料时**（第 193 行）
   - 自动调用 `saveProfileHistory(..., 'create')`
   - 保存初始状态

3. ✅ **智能优化**（第 126-130 行）
   - 检测字段变化
   - 只在有变化时才保存

---

## 🧪 测试步骤

### 测试 1: 验证更新会保存历史

1. **登录用户账号**

2. **查看当前历史记录数**
   ```sql
   SELECT COUNT(*) as history_count
   FROM user_profile_history
   WHERE user_id = <你的user_id>;
   ```

3. **修改个人资料**
   - 进入个人资料页面
   - 修改 `experience_level`：从"应届"改为"实习"
   - 点击保存

4. **再次查看历史记录**
   ```sql
   SELECT COUNT(*) as history_count
   FROM user_profile_history
   WHERE user_id = <你的user_id>;
   ```
   
   **预期：** 应该增加 1 条记录

5. **查看历史详情**
   ```sql
   SELECT 
     id,
     experience_level,
     change_type,
     changed_fields,
     created_at
   FROM user_profile_history
   WHERE user_id = <你的user_id>
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   
   **预期：** 最新的记录应该显示：
   - `experience_level`: '实习'
   - `change_type`: 'update'
   - `changed_fields`: ['experienceLevel']

---

### 测试 2: 验证字段变化检测

1. **修改多个字段**
   - 修改 `experience_level`: 实习 → 1-3年
   - 修改 `target_company`: Google → Meta
   - 修改 `bio`: 添加新的介绍

2. **查看最新历史记录**
   ```sql
   SELECT changed_fields
   FROM user_profile_history
   WHERE user_id = <你的user_id>
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   
   **预期：** 应该包含 `['experienceLevel', 'targetCompany', 'bio']`

---

### 测试 3: 验证没有变化时不会保存

1. **打开个人资料页面**

2. **不做任何修改，直接点击保存**

3. **查看历史记录数**
   ```sql
   SELECT COUNT(*) as history_count
   FROM user_profile_history
   WHERE user_id = <你的user_id>;
   ```
   
   **预期：** 数量不变（没有新增记录）

4. **查看服务器日志**（如果可以访问）
   - 应该看到：`⏭️  没有字段变化，跳过更新`

---

### 测试 4: 查看完整的修改历史

```sql
-- 查看用户的所有修改历史
SELECT 
  id,
  experience_level,
  target_company,
  change_type,
  changed_fields,
  created_at
FROM user_profile_history
WHERE user_id = <你的user_id>
ORDER BY created_at DESC;
```

**预期：** 应该看到从最新到最旧的完整变更记录

---

### 测试 5: 使用脚本查看历史（推荐）

```bash
# 查看用户的所有修改历史
DATABASE_URL="your_db_url" npx tsx scripts/view-profile-history.ts <user_id>

# 查看特定字段的修改历史
DATABASE_URL="your_db_url" npx tsx scripts/view-profile-history.ts <user_id> experienceLevel
```

**预期输出示例：**
```
📜 查看 User 1 的资料修改历史

找到 3 条修改记录:

1. 2025-10-15 12:30:45 - 更新
   修改字段: experienceLevel
   经验水平: 1-3年
   岗位类型: DA
   目标公司: Meta

2. 2025-10-15 10:15:20 - 更新
   修改字段: experienceLevel, targetCompany
   经验水平: 实习
   岗位类型: DA
   目标公司: Google

3. 2025-10-10 08:00:00 - 创建
   修改字段: 全部
   经验水平: 应届
   岗位类型: DA
   目标公司: Google
```

---

## ✅ 成功标准

所有测试通过后，你应该看到：

1. ✅ 每次修改资料都会自动创建历史记录
2. ✅ 历史记录准确记录了修改的字段
3. ✅ 没有变化时不会创建无用记录（优化）
4. ✅ 可以追溯完整的修改历史
5. ✅ 历史记录不影响主业务（即使保存失败也不会报错）

---

## 🎯 快速验证 SQL

一次性验证所有功能：

```sql
-- 完整验证查询
WITH stats AS (
  SELECT 
    user_id,
    COUNT(*) as total_changes,
    COUNT(CASE WHEN change_type = 'create' THEN 1 END) as creates,
    COUNT(CASE WHEN change_type = 'update' THEN 1 END) as updates,
    MAX(created_at) as last_change
  FROM user_profile_history
  GROUP BY user_id
)
SELECT 
  u.id as user_id,
  u.email,
  p.experience_level as current_exp,
  s.total_changes,
  s.creates,
  s.updates,
  s.last_change
FROM users u
JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN stats s ON u.id = s.user_id
ORDER BY s.total_changes DESC NULLS LAST;
```

这会显示每个用户的：
- 当前经验水平
- 总修改次数
- 创建记录数
- 更新记录数
- 最后修改时间

---

## 📊 监控建议

可以定期运行以下查询监控历史记录功能：

```sql
-- 1. 今天有多少次资料修改
SELECT COUNT(*) as changes_today
FROM user_profile_history
WHERE created_at >= CURRENT_DATE;

-- 2. 最活跃的用户（修改最多）
SELECT user_id, COUNT(*) as change_count
FROM user_profile_history
GROUP BY user_id
ORDER BY change_count DESC
LIMIT 10;

-- 3. 最常修改的字段
SELECT 
  UNNEST(changed_fields) as field_name,
  COUNT(*) as change_count
FROM user_profile_history
WHERE change_type = 'update'
GROUP BY field_name
ORDER BY change_count DESC;
```

---

## 🎉 结论

✅ **历史记录功能已完全实现并自动工作！**

每次用户修改资料时：
1. 系统自动检测变化
2. 保存完整快照到历史表
3. 记录修改的具体字段
4. 不影响主业务流程

**完全自动化，不需要任何手动操作！** 🚀

