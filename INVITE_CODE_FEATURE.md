# 邀请码功能实现文档

## 🎯 功能概述

实现邀请码系统，当新用户使用邀请码注册时，分享邀请码的用户获得每日匹配配额 +2 人。

## 📋 功能列表

✅ **已完成**
- [x] 数据库schema扩展（添加邀请码表）
- [x] 自动生成用户专属邀请码
- [x] 成就页面显示邀请码UI
- [x] 注册流程支持填写邀请码
- [x] 邀请码验证和使用逻辑
- [x] 自动给邀请人增加配额奖励

## 🗄️ 数据库变更

### 新增表

1. **user_invite_codes** - 用户邀请码表
   - `user_id`: 用户ID（外键 → users）
   - `invite_code`: 12位唯一邀请码
   - `times_used`: 使用次数
   - `total_referrals`: 总邀请人数

2. **invite_code_usage** - 邀请码使用记录表
   - `invite_code`: 邀请码（外键）
   - `referrer_user_id`: 邀请人ID
   - `referred_user_id`: 被邀请人ID
   - `reward_type`: 奖励类型
   - `reward_amount`: 奖励数量（配额）
   - `used_at`: 使用时间

## 🚀 部署步骤

### 1. 运行数据库迁移

```bash
# 连接到数据库
psql "your_database_connection_string"

# 执行迁移文件
\i migrations/0019_add_invite_codes_system.sql

# 验证表创建成功
\d user_invite_codes
\d invite_code_usage
```

### 2. 为现有用户生成邀请码

```bash
# 运行脚本为所有老用户生成邀请码
npx tsx scripts/generate-invite-codes-for-existing-users.ts
```

### 3. 部署代码

```bash
git add .
git commit -m "feat: 添加邀请码系统"
git push origin main
```

Vercel会自动部署。

## 📱 用户界面

### 成就页面（/me）

在**每日配额任务**卡片上方新增**邀请好友**卡片：

```
┌─────────────────────────────────────┐
│ 🎁 邀请好友                         │
├─────────────────────────────────────┤
│ [MP1234567890]  [复制]             │
│                                     │
│ 2 位好友已加入  使用次数 2          │
│                                     │
│ 💡 好友使用你的邀请码注册，你将获得 │
│ +2 每日匹配配额                     │
└─────────────────────────────────────┘
```

### 设置密码页面

在密码确认后，添加可选邀请码输入框：

```
┌─────────────────────────────────────┐
│ 设置密码                            │
├─────────────────────────────────────┤
│ [密码输入框]                        │
│ [确认密码输入框]                    │
│                                     │
│ 邀请码 (可选)                       │
│ [MP________] 输入邀请码             │
│ 💡 使用邀请码注册，好友将获得额外... │
│                                     │
│      [设置密码]                     │
└─────────────────────────────────────┘
```

## 🔄 业务逻辑

### 邀请码格式

- 格式：`MP` + 10位随机字符（大写字母+数字）
- 长度：12位
- 唯一性：全局唯一

### 奖励机制

- **邀请人**：每次成功邀请获得 +2 每日匹配配额
- **配额上限**：bonus_balance 最多累积至 6 个
- **配额累积**：可跨天使用，遵循现有配额逻辑

### 验证规则

1. ✅ 邀请码必须存在
2. ✅ 不能使用自己的邀请码
3. ✅ 每个用户只能使用一次邀请码
4. ✅ 不能重复使用同一个邀请码

## 🛠️ API接口

### GET /api/invite-codes

获取当前用户的邀请码信息

**响应**:
```json
{
  "success": true,
  "data": {
    "inviteCode": "MPABCD123456",
    "timesUsed": 2,
    "totalReferrals": 2
  }
}
```

### POST /api/invite-codes/use

使用邀请码（新用户注册时）

**请求**:
```json
{
  "inviteCode": "MPABCD123456",
  "userId": 123
}
```

**响应**:
```json
{
  "success": true,
  "message": "邀请码验证成功，邀请人已获得2个额外配额！"
}
```

## 📊 测试场景

### 场景1：新用户注册使用邀请码

1. 用户A分享邀请码给用户B
2. 用户B填写邀请码注册
3. 验证：
   - ✅ 用户B注册成功
   - ✅ 用户A的bonus_balance +2
   - ✅ 用户B不能再次使用邀请码
   - ✅ 邀请码使用记录已创建

### 场景2：邀请码验证

1. 无效邀请码 → 返回错误
2. 使用自己的邀请码 → 拒绝
3. 重复使用邀请码 → 拒绝

### 场景3：配额增加

1. 用户A有基础配额4个，bonus_balance=1
2. 用户B使用A的邀请码注册
3. 结果：A的bonus_balance=3，总配额=7
4. 上限检查：如果bonus_balance达到6，不再增加

## 🔍 排查故障

### 问题1：邀请码显示为空

**原因**：老用户没有自动生成邀请码

**解决**：运行 `scripts/generate-invite-codes-for-existing-users.ts`

### 问题2：配额未增加

**检查**：
1. 邀请码是否正确使用
2. `invite_code_usage` 表是否有记录
3. `user_daily_bonus` 表的 bonus_balance 是否更新
4. 是否触达配额上限（6）

### 问题3：页面报错

**检查**：
1. 数据库表是否已创建
2. schema是否已更新
3. 是否有编译错误

## 📝 代码文件清单

### 新增文件

- `lib/invite-codes.ts` - 邀请码业务逻辑
- `components/invite-code-card.tsx` - 邀请码UI组件
- `app/api/invite-codes/route.ts` - 获取邀请码API
- `app/api/invite-codes/use/route.ts` - 使用邀请码API
- `migrations/0019_add_invite_codes_system.sql` - 数据库迁移
- `scripts/generate-invite-codes-for-existing-users.ts` - 批量生成脚本

### 修改文件

- `lib/db/schema.ts` - 添加邀请码表定义
- `lib/auth.ts` - 为新用户自动生成邀请码
- `app/auth/set-password/page.tsx` - 添加邀请码输入
- `app/me/page.tsx` - 集成邀请码卡片

## 🎉 功能亮点

1. **自动生成**：新用户注册自动获得专属邀请码
2. **为老用户兼容**：提供脚本为现有用户生成邀请码
3. **配额上限**：遵循现有的6个上限规则
4. **防刷机制**：严格验证，防止滥用
5. **UI友好**：一键复制，清晰展示统计

## 📈 未来扩展

- [ ] 邀请排行榜
- [ ] 邀请奖励等级制
- [ ] 分享链接功能
- [ ] 邀请码过期机制

