# MockPal 业务分析工具包 - 使用指南

> 🎉 恭喜！我已经为你创建了一套完整的业务分析工具  
> 📊 包含数据分析、SQL查询、业务建议、邮件模板等  
> 🚀 现在你可以立即开始使用！

---

## 📦 工具包内容

### 1. 核心分析工具

#### 📊 业务指标分析脚本
**文件**: `scripts/business-metrics-analysis.ts`

**功能**:
- 自动分析所有核心业务指标
- 识别潜力用户和流失风险用户
- 生成详细的业务建议
- 提供具体的行动清单

**使用方法**:
```bash
cd /Users/cindy/MockPal-Replicate
npx tsx scripts/business-metrics-analysis.ts
```

#### 💾 SQL 查询集合
**文件**: `scripts/business-metrics.sql`

**功能**:
- 包含所有核心指标的SQL查询
- 可在Neon Dashboard中直接执行
- 适合定期监控和数据导出

**使用方法**:
1. 登录 [Neon Dashboard](https://console.neon.tech/)
2. 打开 SQL Editor
3. 复制粘贴相关查询
4. 导出结果为 CSV

#### 🎯 快速用户查询
**文件**: `scripts/get-users-to-contact.sql`

**功能**:
- 快速获取需要联系的用户列表
- 包含5个常用查询场景
- 适合批量发送邮件

**查询内容**:
1. 需要提醒的匹配（已接受但未联系）
2. 未完成资料的用户
3. 流失风险用户
4. 超级用户（Top 10）
5. 潜力用户

---

### 2. 分析报告文档

#### 📈 业务分析与增长策略
**文件**: `docs/BUSINESS_ANALYSIS_AND_GROWTH_STRATEGY.md`

**内容**:
- 核心业务指标定义
- 用户行为分析框架
- 关键问题诊断方法
- 增长机会识别
- 详细行动计划
- 增长策略建议

**适用场景**:
- 团队讨论
- 战略规划
- 投资人汇报

#### 📊 当前业务分析报告
**文件**: `docs/当前业务分析报告-20251021.md`

**内容**:
- **基于实际数据**的分析结果
- 关键发现和洞察
- 用户分群详细分析
- 立即行动计划
- 30天增长目标

**重要数据**:
- 总用户数: 41人
- 7日新增: 19人 (46.34%)
- 匹配成功率: 10.28%
- **联系转化率: 0%** 🔴 最严重问题
- 活跃用户: 23人 (56.10%)

**立即行动**:
1. 给22个已匹配但未联系的用户发送提醒
2. 给3个流失用户发送召回邮件
3. 给15个未完成资料用户发送激活邮件

#### 📚 工具使用指南
**文件**: `docs/业务分析工具使用指南.md`

**内容**:
- 所有工具的详细使用说明
- 常见分析场景示例
- 自定义分析方法
- 数据可视化指南
- 自动化监控设置

---

### 3. 执行工具

#### 📧 邮件模板大全
**文件**: `docs/邮件模板大全.md`

**包含模板**:
1. **匹配提醒邮件** (3种场景)
   - 匹配成功立即发送
   - 3天后提醒
   - 7天后最后提醒

2. **流失用户召回** (2种)
   - 7天未活跃
   - 14天未活跃

3. **未完成资料激活** (3种)
   - 注册后24小时
   - 注册后3天
   - 注册后7天

4. **超级用户邀请** (2种)
   - 邀请成为产品大使
   - 请求推荐

5. **每周推荐邮件**
6. **潜力用户个性化推荐**
7. **感谢与反馈请求**

**使用方法**:
1. 选择合适的模板
2. 替换 [占位符]
3. 发送邮件

---

## 🚀 快速开始（3步骤）

### Step 1: 运行数据分析（5分钟）

```bash
# 进入项目目录
cd /Users/cindy/MockPal-Replicate

# 运行分析脚本（会自动加载环境变量）
node -r dotenv/config node_modules/.bin/tsx scripts/business-metrics-analysis.ts dotenv_config_path=.env.local

# 保存结果
node -r dotenv/config node_modules/.bin/tsx scripts/business-metrics-analysis.ts dotenv_config_path=.env.local > analysis-$(date +%Y%m%d).txt
```

**你将看到**:
- ✅ 用户增长数据
- ✅ 匹配效率分析
- ✅ 活跃度指标
- ✅ 转化漏斗
- ✅ 需要联系的用户列表
- ✅ 具体行动建议

### Step 2: 获取用户联系列表（2分钟）

**方法A: 使用Neon Dashboard**
1. 登录 https://console.neon.tech/
2. 选择你的项目
3. 打开 SQL Editor
4. 复制粘贴 `scripts/get-users-to-contact.sql` 中的查询1
5. 点击 "Export" → "CSV"

**方法B: 从分析结果中提取**
```bash
# 查看需要提醒的匹配
cat analysis-*.txt | grep -A 20 "需要发送提醒"

# 查看潜力用户
cat analysis-*.txt | grep -A 30 "潜力用户"

# 查看流失用户
cat analysis-*.txt | grep -A 20 "流失风险"
```

### Step 3: 发送邮件（30分钟）

1. **打开邮件模板文档**
   - `docs/邮件模板大全.md`

2. **选择合适的模板**
   - 匹配提醒: 使用模板 1.2
   - 流失召回: 使用模板 2.1
   - 资料激活: 使用模板 3.1/3.2/3.3

3. **批量发送**
   ```
   优先级1: 22个已匹配未联系的用户（最紧急）
   优先级2: 3个流失风险用户
   优先级3: 15个未完成资料用户
   ```

---

## 📊 关键数据总结

### 当前状况（2025-10-21）

#### ✅ 积极信号
- **用户增长强劲**: 7天新增19人，增长46%
- **活跃度尚可**: 56%的用户有浏览行为
- **超级用户出现**: Frances Ding活跃度826分，23次反馈
- **社区初现**: 7个用户发布题目

#### 🔴 严重问题
- **联系转化率0%**: 22个成功匹配，无人建立联系 🚨
- **匹配成功率低**: 只有10.28%
- **资料完成率不足**: 63.41%，15人未完成

#### 🎯 用户分群

**超级用户 (Top 5)**:
1. Frances Ding - 活跃度826分
2. Winnie Yang - 活跃度436分
3. Yaya - 活跃度385分
4. 元宵 - 活跃度336分
5. Cindyyy - 活跃度329分

**潜力用户 (7人)**:
- Corey, Jasmine Hu, Lily, Hannah, Ramen, Echo, 西瓜

**流失风险 (3人)**:
- Olivia, Kris, Yajuan Li

**待激活 (15人)**:
- 注册但未完成资料

---

## 🎯 本周行动计划

### 今天必做（10月21日）

#### 1. 发送提醒邮件 (2小时) 🔴

**对象**: 22个已匹配但未联系的用户

**步骤**:
1. 运行SQL查询获取用户列表
   ```sql
   -- 执行 scripts/get-users-to-contact.sql 中的查询1
   ```

2. 使用邮件模板 1.2
   - 标题: "还记得和 [对方姓名] 的匹配吗？"
   - 包含对方联系方式
   - 提供开场白模板

3. 批量发送（可以用邮件工具或手动发送）

**预期效果**: 至少5个用户建立联系

#### 2. 召回流失用户 (30分钟)

**对象**: 3个流失风险用户
- Olivia
- Kris  
- Yajuan Li

**模板**: 2.1 "想念你！MockPal 有新伙伴等你来匹配"

#### 3. 激活未完成资料用户 (30分钟)

**对象**: 15个未完成资料用户

**模板**: 
- 注册1-2天: 使用 3.1
- 注册3-6天: 使用 3.2
- 注册7天+: 使用 3.3

### 本周其他任务

**周二-周三**: 
- 优化匹配成功页面
- 开发自动化邮件系统

**周四-周五**:
- 上线新功能
- 监控数据变化
- 收集反馈

---

## 📈 30天目标

| 指标 | 当前 | 目标 | 策略 |
|------|------|------|------|
| 总用户数 | 41 | 70+ | 推广+推荐机制 |
| 资料完成率 | 63% | 85%+ | 激活邮件 |
| 活跃用户率 | 56% | 75%+ | 每周推荐 |
| 匹配成功率 | 10% | 20%+ | 算法优化 |
| **联系转化率** | **0%** | **50%+** | **自动化邮件** 🔥 |
| 面试完成数 | 6 | 30+ | 提高联系率 |

---

## 🔄 定期使用方法

### 每天（如果活跃用户多）

```bash
# 快速查看核心指标
npx tsx scripts/business-metrics-analysis.ts | grep -E "(总用户数|匹配成功率|联系转化率)"
```

### 每周

```bash
# 运行完整分析，保存报告
npx tsx scripts/business-metrics-analysis.ts > weekly-report-$(date +%Y%m%d).txt

# 对比上周数据
diff weekly-report-20251014.txt weekly-report-20251021.txt
```

**执行任务**:
1. 发送每周推荐邮件（周一早上）
2. 识别新的流失风险用户
3. 跟进上周发送的邮件效果

### 每月

```bash
# 生成月度报告
npx tsx scripts/business-metrics-analysis.ts > monthly-report-$(date +%Y-%m).txt
```

**执行任务**:
1. 更新增长策略
2. 评估月度目标完成情况
3. 制定下月计划

---

## 💡 使用技巧

### 1. 数据导出

**导出为CSV用于Excel分析**:
```bash
# 在Neon Dashboard中执行SQL查询
# 点击 "Export" → "CSV"
# 导入Excel或Google Sheets
```

### 2. 自动化监控

**设置每日自动报告**:
```bash
# 编辑crontab
crontab -e

# 添加每日9点运行
0 9 * * * cd /path/to/MockPal && npx tsx scripts/business-metrics-analysis.ts | mail -s "Daily Report" your@email.com
```

### 3. 数据对比

**对比不同时期的数据**:
```bash
# 保存基线
npx tsx scripts/business-metrics-analysis.ts > baseline.txt

# 一周后
npx tsx scripts/business-metrics-analysis.ts > week1.txt

# 对比
diff baseline.txt week1.txt | grep -E "(用户数|转化率)"
```

---

## 🆘 常见问题

### Q1: 脚本运行失败怎么办？

**错误**: `No database connection string`

**解决**:
```bash
# 确认.env.local文件存在
ls -la .env.local

# 使用dotenv加载
node -r dotenv/config node_modules/.bin/tsx scripts/business-metrics-analysis.ts dotenv_config_path=.env.local
```

### Q2: 如何只查看某个指标？

```bash
# 只看用户指标
npx tsx scripts/business-metrics-analysis.ts | grep -A 30 "用户指标"

# 只看匹配指标
npx tsx scripts/business-metrics-analysis.ts | grep -A 20 "匹配指标"

# 只看潜力用户
npx tsx scripts/business-metrics-analysis.ts | grep -A 30 "潜力用户"
```

### Q3: 如何自定义分析？

编辑 `scripts/business-metrics-analysis.ts`:

```typescript
// 在文件末尾添加你的分析
console.log('\n\n🆕 我的自定义分析');
const myData = await db.select()...
```

### Q4: 邮件模板需要每次都手动替换占位符吗？

可以创建批量发送脚本，自动替换占位符。参考现有的邮件发送脚本：
- `scripts/send-match-success-email.ts`

---

## 📚 相关文档

### 核心文档
- [业务分析与增长策略](docs/BUSINESS_ANALYSIS_AND_GROWTH_STRATEGY.md) - 完整的策略框架
- [当前业务分析报告](docs/当前业务分析报告-20251021.md) - 基于实际数据的分析
- [工具使用指南](docs/业务分析工具使用指南.md) - 详细的使用说明
- [邮件模板大全](docs/邮件模板大全.md) - 所有邮件模板

### 技术文档
- [数据库架构](docs/DATABASE_ARCHITECTURE.md)
- [数据库表说明](docs/DATABASE_TABLES_EXPLANATION.md)
- [匹配系统总结](MATCHING_SYSTEM_SUMMARY.md)

---

## 🎯 核心建议

### 最重要的3件事

1. **修复联系转化率** 🔴
   - 这是最大的问题，直接影响产品价值
   - 今天就发送提醒邮件
   - 本周内完成页面优化和自动化邮件

2. **激活现有用户** 🟡
   - 召回流失用户
   - 激活未完成资料用户
   - 这是最低成本的"获客"

3. **建立数据监控** 🟢
   - 每天查看核心指标
   - 及时发现问题
   - 快速调整策略

### 成功的关键

✅ **快速行动**: 不要拖延，今天就开始  
✅ **数据驱动**: 用数据指导决策  
✅ **持续迭代**: 每周评估和调整  
✅ **用户中心**: 倾听用户反馈  

---

## 🎉 下一步

### 立即行动（现在就做）

1. ✅ 阅读这份文档（你正在做！）
2. [ ] 运行数据分析脚本
3. [ ] 查看当前业务分析报告
4. [ ] 准备今天要发送的邮件
5. [ ] 开始执行！

### 需要帮助？

如果遇到任何问题：
1. 查看 `docs/业务分析工具使用指南.md` 
2. 检查常见问题部分
3. 查看相关文档

---

## 📞 联系信息

**项目**: MockPal  
**创建时间**: 2025-10-21  
**分析工具版本**: v1.0

**相关文件**:
- 分析脚本: `scripts/business-metrics-analysis.ts`
- SQL查询: `scripts/business-metrics.sql`
- 用户查询: `scripts/get-users-to-contact.sql`
- 邮件模板: `docs/邮件模板大全.md`

---

**祝你数据分析顺利！加油！💪**

记住：最重要的是**开始行动**。数据已经很清楚地告诉你需要做什么了。

今天就发送那22封提醒邮件吧！🚀

