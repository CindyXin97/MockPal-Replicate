# MockPal 数据库表结构详解 📊

本文档详细解释MockPal平台数据库中每个表的作用、字段含义和表间关系。

## 📋 表格总览

| 表名 | 中文名称 | 主要用途 | 记录数量 |
|------|----------|----------|----------|
| `users` | 用户表 | 存储用户基本信息和认证数据 | 用户数量 |
| `user_profiles` | 用户资料表 | 存储详细的用户资料和匹配标签 | 用户数量 |
| `matches` | 匹配表 | 记录用户间的匹配关系和状态 | 匹配记录 |
| `feedbacks` | 反馈表 | 存储面试反馈和体验记录 | 反馈记录 |
| `user_achievements` | 用户成就表 | 记录用户等级和成就数据 | 用户数量 |
| `user_daily_views` | 每日浏览记录表 | 限制每日浏览次数 | 浏览记录 |
| `interview_questions` | 面试真题表 | 存储面试题目和答案 | 题目数量 |
| `interview_requests` | 面经需求表 | 用户提交的题目需求 | 需求记录 |
| `accounts` | OAuth账户表 | NextAuth OAuth认证数据 | 认证记录 |
| `sessions` | 会话表 | NextAuth会话管理 | 会话记录 |
| `verification_tokens` | 验证令牌表 | NextAuth邮箱验证令牌 | 令牌记录 |

---

## 👤 用户相关表

### 1. `users` - 用户表
**作用**: 存储用户的基本信息和认证数据

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键，用户唯一标识 | 1, 2, 3... |
| `email` | varchar(255) | 用户邮箱，唯一索引 | user@example.com |
| `email_verified` | timestamp | 邮箱验证时间 | 2024-01-01 10:00:00 |
| `password_hash` | varchar(255) | 密码哈希值（bcrypt） | $2b$10$... |
| `image` | text | 用户头像URL | https://... |
| `name` | varchar(255) | 用户显示名称 | 张三 |
| `created_at` | timestamp | 创建时间 | 2024-01-01 10:00:00 |
| `updated_at` | timestamp | 更新时间 | 2024-01-01 10:00:00 |

**特点**:
- 支持多种登录方式：Google OAuth、邮箱魔法链接、邮箱密码
- 邮箱是主要用户标识符，没有用户名字段
- 支持头像存储（OAuth自动获取或用户上传）

### 2. `user_profiles` - 用户资料表
**作用**: 存储用户的详细资料和匹配算法所需的标签信息

#### 基础信息
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `user_id` | integer | 关联用户ID | 1 |
| `job_type` | varchar(50) | 职位类型（必填） | DA, DS, DE, BA |
| `experience_level` | varchar(50) | 经验水平（必填） | 应届, 1-3年, 3-5年, 5年以上 |

#### 目标信息
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `target_company` | varchar(255) | 目标公司 | Google, Microsoft |
| `target_industry` | varchar(255) | 目标行业 | 互联网, 金融 |
| `other_company_name` | varchar(255) | 自定义公司名称 | 小公司ABC |

#### 练习偏好（匹配算法核心）
| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|-------|
| `technical_interview` | boolean | 是否练习技术面试 | false |
| `behavioral_interview` | boolean | 是否练习行为面试 | false |
| `case_analysis` | boolean | 是否练习案例分析 | false |
| `stats_questions` | boolean | 是否练习统计问题 | false |

#### 联系方式（匹配成功后显示）
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `email` | varchar(255) | 联系邮箱 | contact@example.com |
| `wechat` | varchar(255) | 微信号 | wechat123 |
| `linkedin` | varchar(255) | LinkedIn链接 | linkedin.com/in/user |
| `bio` | varchar(255) | 个人简介 | 数据分析师，专注于... |

**匹配算法逻辑**:
1. 基于 `job_type` 和 `experience_level` 进行基础匹配
2. 根据练习偏好重叠度计算匹配分数
3. 考虑目标公司和行业的兼容性

### 3. `user_achievements` - 用户成就表
**作用**: 记录用户的面试经验和成就等级

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `user_id` | integer | 关联用户ID（唯一） | 1 |
| `total_interviews` | integer | 完成面试总次数 | 5 |
| `experience_points` | integer | 经验值 | 500 |
| `current_level` | varchar(50) | 当前等级 | 面试新星 |
| `created_at` | timestamp | 创建时间 | 2024-01-01 10:00:00 |
| `updated_at` | timestamp | 更新时间 | 2024-01-01 10:00:00 |

**等级系统**:
- 🌱 新用户 (0次面试)
- ⭐ 面试新手 (1-4次)  
- 🌟 面试新星 (5-9次)
- 🌙 面试达人 (10-14次)
- 👑 面试导师 (15次+)

---

## 🤝 匹配相关表

### 4. `matches` - 匹配表
**作用**: 记录用户间的匹配关系和状态跟踪

#### 基本匹配信息
| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `user1_id` | integer | 发起匹配的用户ID | 1 |
| `user2_id` | integer | 被匹配的用户ID | 2 |
| `status` | varchar(50) | 匹配状态 | pending, accepted, rejected |

#### 联系状态跟踪
| 字段名 | 类型 | 说明 | 可能值 |
|--------|------|------|-------|
| `contact_status` | varchar(50) | 联系状态 | not_contacted, contacted, scheduled, completed, no_response |
| `contact_updated_at` | timestamp | 联系状态更新时间 | 2024-01-01 10:00:00 |
| `interview_scheduled_at` | timestamp | 面试安排时间 | 2024-01-01 15:00:00 |
| `last_reminder_sent` | timestamp | 最后提醒时间 | 2024-01-01 09:00:00 |

**匹配流程**:
1. **pending**: 用户A喜欢用户B，等待B的回应
2. **accepted**: 双方互相喜欢，匹配成功
3. **rejected**: 一方拒绝，匹配失败

**约束条件**:
- 每对用户只能有一条匹配记录（唯一索引）
- 支持双向匹配逻辑

### 5. `user_daily_views` - 每日浏览记录表
**作用**: 限制用户每日浏览候选人的次数，防止刷量

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `user_id` | integer | 浏览者用户ID | 1 |
| `viewed_user_id` | integer | 被浏览的用户ID | 2 |
| `date` | varchar(10) | 浏览日期 | 2024-01-01 |
| `created_at` | timestamp | 创建时间 | 2024-01-01 10:00:00 |

**业务逻辑**:
- 每个用户每天最多浏览5个候选人
- 防止同一天重复浏览同一用户
- 每日凌晨自动重置计数

---

## 📝 反馈相关表

### 6. `feedbacks` - 反馈表
**作用**: 存储用户对面试体验的反馈

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `match_id` | integer | 关联匹配ID（可为空） | 1 |
| `user_id` | integer | 反馈提交者ID | 1 |
| `interview_status` | varchar(10) | 是否完成面试 | yes, no |
| `content` | text | 反馈内容 | 面试体验很好，学到了很多... |
| `created_at` | timestamp | 创建时间 | 2024-01-01 10:00:00 |
| `updated_at` | timestamp | 更新时间 | 2024-01-01 10:00:00 |

**反馈流程**:
1. 用户匹配成功后可以提交反馈
2. 反馈包含是否完成面试和详细内容
3. 反馈数据用于改进匹配算法和用户体验

---

## 📚 内容相关表

### 7. `interview_questions` - 面试真题表
**作用**: 存储各公司的面试题目和推荐答案

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `company` | varchar(100) | 公司名称 | Google, Microsoft |
| `position` | varchar(100) | 职位名称 | 数据分析师, 数据科学家 |
| `question_type` | varchar(50) | 题目类型 | technical, behavioral, case_study, stats |
| `difficulty` | varchar(20) | 难度等级 | easy, medium, hard |
| `question` | text | 问题内容 | 如何分析用户留存率？ |
| `recommended_answer` | text | 推荐答案 | 可以使用cohort analysis... |
| `tags` | text | 标签（JSON格式） | ["数据分析", "SQL", "Python"] |
| `source` | varchar(100) | 来源 | Glassdoor, 用户投稿 |
| `year` | integer | 年份 | 2024 |
| `is_verified` | boolean | 是否已验证 | true, false |

**题目分类**:
- **technical**: 技术问题（SQL、Python、统计等）
- **behavioral**: 行为问题（团队合作、解决问题等）
- **case_study**: 案例分析（商业分析、产品分析等）
- **stats**: 统计问题（概率、假设检验等）

### 8. `interview_requests` - 面经需求表
**作用**: 用户提交的题目需求和建议

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `company` | varchar(100) | 公司名称 | ByteDance |
| `position` | varchar(100) | 职位名称 | 数据分析师 |
| `message` | text | 补充说明 | 希望能有更多字节跳动的面试题 |
| `status` | varchar(20) | 处理状态 | pending, processing, completed |
| `created_at` | timestamp | 创建时间 | 2024-01-01 10:00:00 |
| `updated_at` | timestamp | 更新时间 | 2024-01-01 10:00:00 |

---

## 🔐 认证相关表（NextAuth）

### 9. `accounts` - OAuth账户表
**作用**: 存储第三方OAuth认证信息

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `user_id` | integer | 关联用户ID | 1 |
| `type` | varchar(255) | 账户类型 | oauth |
| `provider` | varchar(255) | 提供商 | google, email |
| `provider_account_id` | varchar(255) | 提供商账户ID | 123456789 |
| `refresh_token` | text | 刷新令牌 | eyJ... |
| `access_token` | text | 访问令牌 | ya29... |
| `expires_at` | integer | 过期时间戳 | 1640995200 |
| `token_type` | varchar(255) | 令牌类型 | Bearer |
| `scope` | text | 权限范围 | profile email |
| `id_token` | text | ID令牌 | eyJ... |
| `session_state` | varchar(255) | 会话状态 | active |

### 10. `sessions` - 会话表
**作用**: 管理用户登录会话

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | serial | 主键 | 1, 2, 3... |
| `session_token` | varchar(255) | 会话令牌（唯一） | abc123... |
| `user_id` | integer | 关联用户ID | 1 |
| `expires` | timestamp | 过期时间 | 2024-02-01 10:00:00 |

### 11. `verification_tokens` - 验证令牌表
**作用**: 存储邮箱验证令牌（魔法链接登录）

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `identifier` | varchar(255) | 标识符（通常是邮箱） | user@example.com |
| `token` | varchar(255) | 验证令牌（唯一） | xyz789... |
| `expires` | timestamp | 过期时间 | 2024-01-01 11:00:00 |

**复合主键**: `(identifier, token)`

---

## 🔗 表间关系图

```
users (用户表)
├── user_profiles (1:1) - 用户资料
├── user_achievements (1:1) - 用户成就
├── user_daily_views (1:N) - 浏览记录
├── matches (1:N) - 匹配记录
├── feedbacks (1:N) - 反馈记录
├── accounts (1:N) - OAuth账户
└── sessions (1:N) - 会话记录

matches (匹配表)
└── feedbacks (1:N) - 关联反馈

verification_tokens (独立表)
interview_questions (独立表)
interview_requests (独立表)
```

## 📈 数据增长预估

| 表名 | 增长方式 | 预估增长率 |
|------|----------|------------|
| `users` | 用户注册 | 稳定增长 |
| `user_profiles` | 跟随用户 | 1:1增长 |
| `matches` | 用户活跃度 | 快速增长 |
| `feedbacks` | 面试完成率 | 中等增长 |
| `user_daily_views` | 每日清理 | 固定大小 |
| `interview_questions` | 内容运营 | 缓慢增长 |
| `user_achievements` | 跟随用户 | 1:1增长 |

## 🛠️ 维护建议

### 定期清理
- `user_daily_views`: 清理30天前的记录
- `sessions`: 清理过期会话
- `verification_tokens`: 清理过期令牌

### 性能优化
- 为高频查询字段添加索引
- 定期分析查询性能
- 考虑数据分区策略

### 数据安全
- 定期备份重要数据
- 监控敏感数据访问
- 实施数据保留政策

---

这就是MockPal数据库的完整结构！每个表都有其特定的业务用途，共同支撑着整个匹配和面试练习平台的运行。🚀 