# MockPal 匹配系统逻辑和权重总结

**更新日期**: 2025-10-14  
**版本**: v2.0

---

## 📊 匹配系统概览

### 核心目标
为用户推荐最合适的面试练习伙伴，优先匹配：
1. 练习内容有重叠的用户（技术面、行为面、案例分析、统计题）
2. 相同经验水平的用户
3. 相同岗位类型的用户

### 关键特性
✅ **智能轮次系统** - 自动识别第一轮/第二轮浏览  
✅ **每日限制** - 每天最多浏览4个用户  
✅ **优先级排序** - 基于匹配度的5级权重系统  
✅ **二次机会** - 第二轮可重新看到之前拒绝的用户  
✅ **防重复推荐** - 第一轮每个用户只出现一次  

---

## 🎯 匹配权重系统

### 优先级排序（从高到低）

```
权重 1 (最高) ⭐⭐⭐⭐⭐
├─ 对方已发pending邀请 + 练习内容重叠
│  └─ 示例：用户B向你发了邀请，且你们都选了"案例分析"
│
权重 2 (高) ⭐⭐⭐⭐
├─ 练习内容重叠（未收到邀请）
│  └─ 示例：你们都选了"技术面"或"行为面"
│
权重 3 (中) ⭐⭐⭐
├─ 经验水平相同
│  └─ 示例：都是"3-5年"或都是"应届"
│
权重 4 (低) ⭐⭐
├─ 岗位类型相同
│  └─ 示例：都是"数据科学 (DS)"或都是"数据分析 (DA)"
│
权重 5 (最低) ⭐
└─ 其他用户
   └─ 不满足以上任何条件
```

### 权重详细说明

#### 权重 1: 对方邀请 + 内容重叠 (invitedOverlapList)
**条件**：
- ✅ 对方向你发送了 pending 邀请
- ✅ 至少有一项练习内容重叠

**重叠判断**：
```typescript
overlap = 
  (对方选了技术面 && 你也选了技术面) ||
  (对方选了行为面 && 你也选了行为面) ||
  (对方选了案例分析 && 你也选了案例分析) ||
  (对方选了统计题 && 你也选了统计题)
```

**为什么最优先**：
- 对方已经表达了兴趣
- 你们有共同的练习目标
- 最有可能达成成功匹配

**示例**：
```
你的资料: {
  technicalInterview: true,
  caseAnalysis: true
}

用户B的资料: {
  caseAnalysis: true,
  behavioralInterview: true
}

用户B向你发送pending邀请
→ 用户B出现在推荐列表最前面 ✓
```

---

#### 权重 2: 练习内容重叠 (overlapList)
**条件**：
- ✅ 至少有一项练习内容重叠
- ❌ 对方未发送邀请

**为什么优先**：
- 有共同的练习目标
- 面试练习更有针对性
- 更容易建立互助关系

**示例**：
```
你选了: [技术面, 案例分析]
用户C选了: [技术面, 行为面]
→ 有重叠（技术面）→ 权重2 ✓
```

---

#### 权重 3: 经验水平相同 (expList)
**条件**：
- ✅ 经验水平完全相同
- ❌ 没有练习内容重叠

**经验水平选项**：
- 应届
- 1-3年
- 3-5年
- 5年以上

**为什么重要**：
- 相似的工作经验背景
- 面试难度和问题类型相近
- 更容易相互理解和帮助

**示例**：
```
你: experienceLevel = "3-5年"
用户D: experienceLevel = "3-5年"
→ 经验匹配 → 权重3 ✓
```

---

#### 权重 4: 岗位类型相同 (jobList)
**条件**：
- ✅ 岗位类型完全相同
- ❌ 经验水平不同
- ❌ 没有练习内容重叠

**岗位类型选项**：
- DA (数据分析)
- DS (数据科学)
- DE (数据工程)
- BA (商业分析)

**为什么考虑**：
- 相同的职业方向
- 面试问题类型有相似性
- 行业知识可以共享

**示例**：
```
你: jobType = "DS"
用户E: jobType = "DS"
→ 岗位匹配 → 权重4 ✓
```

---

#### 权重 5: 其他用户 (otherList)
**条件**：
- 不满足以上任何条件

**为什么也推荐**：
- 提供多样性选择
- 可能发现意外的合适伙伴
- 确保有足够的推荐数量

---

## 🔄 浏览轮次系统

### 第一轮浏览（首次推荐）

**触发条件**：用户刚注册或尚未浏览完所有人

**排除规则**：
```
排除列表 = 
  ✅ 所有浏览过的用户（有view记录）
  ✅ 今日已浏览的4个用户
  ✅ 自己
  
例外：
  ⭐ 对方的pending邀请不排除（优先展示）
```

**特点**：
- ✅ 每个用户只出现一次
- ✅ 避免重复推荐
- ✅ 对方邀请优先

**推荐数量**：每次最多4个用户

**示例流程**：
```
Day 1: 浏览 [B, C, D, E] → 4个view记录
Day 2: 浏览 [F, G, H, I] → 不会再看到B/C/D/E
Day 3: 浏览 [J, K, L, M] → 继续新用户
...
```

---

### 第二轮浏览（二次匹配机会）

**触发条件**：
```typescript
已浏览的不同用户数 >= 总用户数 - 1
```

**示例**：
- 系统有12个用户
- 你浏览了11个不同的人（12-1）
- → 触发第二轮

**排除规则**：
```
排除列表 = 
  ✅ accepted用户（已匹配成功）
  ✅ 今日已浏览的4个用户
  ✅ 自己

不排除：
  ✅ rejected用户（可重新出现）
  ✅ pending用户（可重新出现）
```

**特点**：
- ✅ 只排除已成功匹配的用户
- ✅ 给双方第二次机会
- ✅ 保持优先级排序

**为什么设计第二轮**：
1. 第一次可能因为时间、心情等因素错过
2. 个人资料可能有更新
3. 随着了解加深，标准可能改变
4. 增加匹配成功率

---

## 📅 每日浏览限制

### 限制规则

**每天最多浏览4个用户**

计入限制的操作：
- ✅ 点击 ❤️ (喜欢)
- ✅ 点击 ✖️ (拒绝)  
- ✅ 回应对方的pending邀请

**不计入限制的操作**：
- ❌ 查看"成功匹配"列表
- ❌ 查看联系方式
- ❌ 更新个人资料

### 时区

**使用美东时区 (America/New_York)**
- 每天凌晨12点重置
- 确保用户在同一时区下使用

### 达到限制后

```
今日浏览: 4/4
→ 返回空的推荐列表
→ 前端显示: "今日浏览次数已达上限，明天再来吧！"
```

---

## 🎭 Match状态系统

### 三种状态

#### 1. pending (等待回应)
```
含义: 发起方喜欢接收方，等待对方回应

数据库记录:
  user1_id → user2_id, status = 'pending'

View记录:
  user1_id → user2_id (只有发起方)

接收方看到:
  用户1的卡片出现在推荐列表最前面（权重1）

双方操作:
  发起方: 可以取消（删除记录）
  接收方: 可以接受（变accepted）或拒绝（变rejected）
```

#### 2. accepted (匹配成功)
```
含义: 双方都同意匹配

数据库记录:
  user1_id → user2_id, status = 'accepted'
  （只有一条记录，保留较早的那条）

View记录:
  user1_id → user2_id ✓
  user2_id → user1_id ✓

可见信息:
  双方可以看到对方的联系方式（邮箱、微信、LinkedIn）

排除规则:
  永久排除，不会再推荐
```

#### 3. rejected (已拒绝)
```
含义: 至少有一方拒绝匹配

数据库记录:
  user1_id → user2_id, status = 'rejected'

View记录:
  取决于谁拒绝
  - 接收方拒绝: 双方都有view
  - 发起方第一次就拒绝: 只有发起方有view

排除规则:
  - 第一轮: 排除
  - 第二轮: 可以重新出现（第二次机会）
```

---

## 🔍 匹配算法伪代码

```typescript
function getPotentialMatches(userId) {
  // 1. 获取用户资料
  userProfile = getUserProfile(userId)
  
  // 2. 检查每日限制
  todayViews = getTodayViews(userId)
  if (todayViews.length >= 4) {
    return [] // 达到限制
  }
  
  // 3. 判断浏览轮次
  allViewedUserIds = getAllViewedUserIds(userId)
  totalUsers = getTotalUsersWithProfile()
  
  if (allViewedUserIds.length >= totalUsers - 1) {
    // 第二轮：只排除 accepted
    excludeList = getAcceptedUserIds(userId) + todayViews + [userId]
  } else {
    // 第一轮：排除所有浏览过的
    excludeList = allViewedUserIds + todayViews + [userId]
  }
  
  // 4. 获取候选用户
  candidates = getAllUsersNotIn(excludeList)
  
  // 5. 获取对方发来的邀请
  pendingInvitations = getPendingInvitationsTo(userId)
  
  // 6. 按权重分组
  invitedOverlapList = []  // 权重1
  overlapList = []         // 权重2
  expList = []             // 权重3
  jobList = []             // 权重4
  otherList = []           // 权重5
  
  for (user in candidates) {
    overlap = hasOverlap(user, userProfile)
    expMatch = user.experienceLevel === userProfile.experienceLevel
    jobMatch = user.jobType === userProfile.jobType
    hasInvited = user.id in pendingInvitations
    
    if (hasInvited && overlap) {
      invitedOverlapList.push(user)
    } else if (overlap) {
      overlapList.push(user)
    } else if (expMatch) {
      expList.push(user)
    } else if (jobMatch) {
      jobList.push(user)
    } else {
      otherList.push(user)
    }
  }
  
  // 7. 按优先级合并，取前4个
  finalList = [
    ...invitedOverlapList,
    ...overlapList,
    ...expList,
    ...jobList,
    ...otherList
  ].slice(0, 4)
  
  return finalList
}
```

---

## 📈 匹配成功率优化策略

### 当前策略

1. **对方邀请优先**
   - 已表达兴趣的用户优先展示
   - 提高双向匹配概率

2. **练习内容匹配**
   - 确保有共同练习目标
   - 提高练习质量和体验

3. **经验/岗位匹配**
   - 相似背景更容易沟通
   - 问题难度更匹配

4. **第二轮机制**
   - 给双方重新考虑的机会
   - 提高长期匹配成功率

### 潜在改进方向

💡 **可以考虑添加的权重因素**：
- 目标公司匹配度
- 目标行业匹配度
- 学校背景相似度
- 活跃度（最近登录时间）
- 匹配成功率（用户的历史匹配成功率）

---

## 🐛 已解决的历史问题

### 问题1: 重复推荐 ✅
**症状**: 第二天再次看到昨天浏览过的用户  
**原因**: 第一轮没有排除所有浏览过的用户  
**解决**: 排除所有有view记录的用户

### 问题2: 发起方单方面reject ✅
**症状**: 发起方可以在对方未回应前就reject  
**原因**: rejectMatch逻辑错误  
**解决**: 发起方只能取消（删除记录），不能reject

### 问题3: Pending不计入限制 ✅
**症状**: 回应pending邀请不计入每日4次限制  
**原因**: recordDailyView逻辑缺失  
**解决**: 所有点击操作都计入限制

---

## 📊 数据库表设计

### matches 表
```sql
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL,  -- 发起方
  user2_id INTEGER NOT NULL,  -- 接收方
  action_type VARCHAR(20),    -- 'like', 'dislike', 'cancel'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### user_daily_views 表
```sql
CREATE TABLE user_daily_views (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,         -- 浏览者
  viewed_user_id INTEGER NOT NULL,  -- 被浏览者
  date VARCHAR(10) NOT NULL,        -- 格式: YYYY-MM-DD
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## ✅ 测试清单

### 权重系统测试
- [ ] 对方邀请+内容重叠的用户排在最前
- [ ] 内容重叠的用户优先于经验匹配
- [ ] 经验匹配优先于岗位匹配
- [ ] 岗位匹配优先于其他用户

### 浏览轮次测试
- [ ] 第一轮每个用户只出现一次
- [ ] 第二轮rejected用户可以重新出现
- [ ] 第二轮accepted用户永久排除

### 每日限制测试
- [ ] 浏览4个用户后无法继续
- [ ] 第二天自动重置限制
- [ ] 回应pending邀请计入限制

### Match状态测试
- [ ] Pending正确创建和显示
- [ ] Accepted正确合并记录
- [ ] Rejected正确处理双向逻辑

---

## 📝 总结

MockPal的匹配系统采用**5级权重**和**两轮浏览**机制，确保：

✅ **精准匹配**: 优先推荐练习内容重叠的用户  
✅ **防止重复**: 第一轮每个用户只出现一次  
✅ **二次机会**: 第二轮可以重新看到之前错过的用户  
✅ **平衡体验**: 每日4次限制防止刷屏  
✅ **智能排序**: 对方邀请优先，提高匹配成功率

这个系统经过多次迭代优化，已经解决了重复推荐、状态混乱等历史问题，为用户提供高质量的匹配体验。

---

**文档维护者**: Claude & Cindy  
**最后更新**: 2025-10-14  
**相关文件**: `lib/matching.ts`, `RECOMMENDATION_LOGIC.md`, `MATCH_LOGIC_CORRECT.md`

