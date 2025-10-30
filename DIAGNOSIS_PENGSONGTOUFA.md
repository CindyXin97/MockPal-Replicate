# "蓬松的头发"用户无法看到新推荐 - 诊断报告

**诊断时间**: 2025-10-29  
**用户信息**: 蓬松的头发 (ID: 4, yihan2025fall@gmail.com)

---

## 📊 问题现象

用户反馈："从前天开始就没有新的人推荐"、"今天上午刷了一个人，就再也刷不出人来了"

---

## 🔍 诊断结果

### 系统状态（2025-10-29 18:37）

#### ✅ 用户状态正常
- 用户资料完整
- 今日配额：5次（基础4次 + 奖励1次）
- 今日已浏览：1人
- **剩余配额：4次** ✅

#### ❌ 根本原因：匹配池问题

**关键发现：**
1. **系统总用户数**：39人（有profile的用户）
2. **资料完整的用户**：36人
3. **资料不完整的用户**：3人（无法被推荐）
4. **用户已浏览**：35人
5. **当前轮次**：第一轮（35 < 38）

**匹配逻辑分析：**
```
候选池：38人（排除自己）
第一轮排除规则：排除所有浏览过的用户
  - 已浏览：35人
  - 今天浏览：1人（去重）
  - 自己：1人
  总排除：37人（包含重复）

剩余候选：38 - 35 = 3人

❌ 但这3人的资料都不完整（未选择练习内容）！
   - ID 21: Yajuan Li - 未选择练习内容
   - ID 55: 未设置昵称 - 未选择练习内容
   - ID 56: Yuan Zhang - 未选择练习内容

最终可推荐用户：0人
```

---

## 💡 为什么会出现这个问题？

### 时间线分析：

1. **几周前**：系统有36个资料完整的用户
   - 用户浏览了35人
   - 只剩1人未浏览
   - **应该进入第二轮**

2. **10月21-22日**：新增3个用户注册
   - Yajuan Li (ID 21) - 10月10日注册，但未完善资料
   - 用户55 - 10月21日注册
   - Yuan Zhang (ID 56) - 10月21日注册

3. **现在**：系统有39个用户，但只有36个资料完整
   - 系统判断：35 < 38，用户仍在**第一轮**
   - 新增的3人都未选择练习内容，**无法被推荐**
   - 结果：没有可推荐的用户

---

## 🎯 解决方案

### 方案1：联系资料不完整的用户（立即可行）✅

联系以下3位用户，提醒他们完善资料（特别是**选择练习内容**）：

| 用户ID | 昵称 | 邮箱 | 注册时间 | 缺少内容 |
|--------|------|------|----------|----------|
| 21 | Yajuan Li | sisuhelenli@gmail.com | 2025-10-10 | 未选择练习内容 |
| 55 | 未设置 | 931114366@qq.com | 2025-10-21 | 未选择练习内容 |
| 56 | Yuan Zhang | z.yuan.mia@gmail.com | 2025-10-21 | 未选择练习内容 |

**一旦这3位用户完善资料，"蓬松的头发"就能看到他们的推荐！**

### 方案2：优化匹配逻辑（长期优化）

修改 `lib/matching.ts` 中的逻辑，在计算总用户数时就排除资料不完整的用户：

```typescript
// 当前逻辑（有问题）
const allUsersWithProfiles = await db.query.users.findMany({
  where: exists(/* 只要有profile就算 */)
});
const totalUsersCount = allUsersWithProfiles.length;

// 建议修改为：
const allUsersWithCompleteProfiles = allUsersWithProfiles.filter(user => {
  // 过滤掉资料不完整的用户
  return hasBasicInfo && hasPracticeContent && hasContactInfo;
});
const totalUsersCount = allUsersWithCompleteProfiles.length;
```

这样可以确保轮次判断更准确。

### 方案3：强制资料完整性（产品层面）

在用户注册/编辑资料时：
1. **强制要求至少选择1项练习内容**
2. 显示提示："选择练习内容后，其他用户才能看到你的资料"
3. 在资料页面添加完整度提示

---

## 📝 技术细节

### 匹配逻辑伪代码

```
function getPotentialMatches(userId) {
  // 1. 获取今日配额
  dailyLimit = BASE_LIMIT + bonusBalance
  todayViews = getTodayViews(userId)
  
  // 2. 配额检查
  if (todayViews >= dailyLimit) {
    return []  // ← 蓬松的头发没有走到这里（配额充足）
  }
  
  // 3. 判断轮次
  allViewedUserIds = getAllViewedUserIds(userId)  // 35人
  totalUsersCount = getTotalUsersWithProfile()    // 39人（包括不完整的）
  
  if (allViewedUserIds.length >= totalUsersCount - 1) {
    // 第二轮：只排除accepted用户
  } else {
    // 第一轮：排除所有浏览过的用户 ← 蓬松的头发走这里
    excludedIds = allViewedUserIds
  }
  
  // 4. 过滤候选用户
  candidates = getAllUsers() - excludedIds
  filteredCandidates = candidates.filter(hasCompleteProfile)
  
  // ← 这里返回0人！
  return filteredCandidates
}
```

---

## ✅ 验证测试

运行以下脚本可以重现问题：

```bash
# 1. 检查用户配额
npx tsx scripts/check-quota-pengsongtoufa.ts

# 2. 调试匹配逻辑
npx tsx scripts/debug-match-logic-pengsongtoufa.ts

# 3. 查找资料不完整的用户
npx tsx scripts/find-incomplete-profiles.ts
```

---

## 🎬 行动计划

### 立即行动（今天）
1. ✅ 联系3位用户，提醒完善资料
2. ✅ 向"蓬松的头发"解释情况
3. 考虑手动帮助这3位用户完善资料

### 短期优化（本周）
1. 修改注册流程，强制选择练习内容
2. 添加资料完整度提示
3. 定期检查并通知资料不完整的用户

### 长期优化（下个版本）
1. 优化轮次判断逻辑（只计算资料完整的用户）
2. 添加"资料完整度"仪表盘
3. 考虑降低"完整资料"的门槛

---

## 📧 联系模板

可以用以下模板联系资料不完整的用户：

```
主题：完善MockPal资料，开始匹配练习伙伴！

您好！

我们注意到您已经在MockPal创建了账号，但还没有完成资料填写。

目前您的资料缺少：
❌ 练习内容选择（技术面/行为面/案例分析/统计题）

完善资料后，您将：
✅ 被推荐给其他用户
✅ 获得个性化的伙伴推荐
✅ 开始练习面试技巧

只需1分钟，立即完善资料：https://mockpals.com/profile

祝面试顺利！
MockPal团队
```

---

**诊断完成时间**: 2025-10-29 18:45  
**诊断工具**: check-user-pengsongtoufa.ts, debug-match-logic-pengsongtoufa.ts, find-incomplete-profiles.ts

