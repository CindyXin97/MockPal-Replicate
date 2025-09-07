# 面试真题功能文档

## 功能概述

在MockPal平台中新增了"面试真题"标签页，收集并整理了各大公司（包括北美和国内）的最新面试题目和推荐答案，帮助用户更好地准备面试。

## 主要特性

### 1. 数据筛选功能
- **公司筛选**：支持按公司名称筛选（Meta、Google、Amazon、字节跳动、腾讯等）
- **职位筛选**：支持按职位类型筛选（数据分析师、数据科学家、数据工程师等）
- **题目类型筛选**：
  - 🔧 技术面试
  - 🧑‍🤝‍🧑 行为面试
  - 🧩 案例分析
  - 📊 统计问题
- **难度筛选**：简单、中等、困难
- **年份筛选**：支持按年份筛选最新题目

### 2. 题目展示
- **清晰的题目布局**：公司、职位、年份、难度等信息一目了然
- **推荐答案展示**：可展开/收起查看详细的推荐答案
- **来源标注**：标明题目来源（Glassdoor、LeetCode、牛客网等）
- **响应式设计**：适配各种设备尺寸

### 3. 分页功能
- 支持分页浏览，每页显示20道题目
- 提供页码导航和总页数显示

## 技术实现

### 数据库设计
```sql
CREATE TABLE interview_questions (
  id SERIAL PRIMARY KEY,
  company VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  question TEXT NOT NULL,
  recommended_answer TEXT,
  tags TEXT,
  source VARCHAR(100),
  year INTEGER NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### API接口
- **GET /api/interview-questions**：获取面试题目列表
- 支持查询参数：company、position、questionType、difficulty、year、page、limit
- 返回数据包含题目列表、分页信息和筛选选项

### 前端组件
- **InterviewQuestionsTab**：主要的面试真题组件
- 使用React Hooks管理状态（题目列表、筛选条件、分页等）
- 响应式设计，支持移动端和桌面端

## 示例数据

已预置了10道来自知名公司的面试真题，包括：

### 北美公司
- **Meta**：用户参与度分析、A/B测试设计、行为面试题
- **Google**：YouTube数据分析、实时数据管道设计、交通数据问题
- **Amazon**：推荐系统评估指标设计

### 国内公司
- **字节跳动**：抖音DAU分析框架
- **腾讯**：微信朋友圈算法设计

### 题目类型覆盖
- 技术面试题（数据分析、系统设计）
- 行为面试题（STAR方法回答）
- 案例分析题（实际业务问题）
- 统计问题（A/B测试、假设检验）

## 使用方法

1. **访问面试真题**：
   - 登录后进入匹配页面
   - 点击"📝 面试真题"标签页

2. **筛选题目**：
   - 使用顶部的筛选器选择公司、职位、类型等
   - 系统会自动更新题目列表

3. **查看答案**：
   - 点击"▶️ 查看推荐答案"展开详细答案
   - 答案包含完整的分析思路和解决方案

4. **浏览更多**：
   - 使用底部分页控件查看更多题目
   - 支持上一页/下一页导航

## 数据来源

- **Glassdoor**：真实面试经历分享
- **LeetCode**：技术面试题目
- **牛客网**：国内公司面试题
- **内部收集**：经过验证的高质量题目

## 未来扩展

1. **用户贡献**：允许用户提交新的面试题目
2. **个性化推荐**：根据用户资料推荐相关题目
3. **收藏功能**：允许用户收藏重要题目
4. **练习记录**：跟踪用户的练习进度
5. **题目评论**：用户可以对题目进行评论和讨论

## 文件结构

```
/app/api/interview-questions/route.ts  # API路由
/lib/db/schema.ts                      # 数据库schema
/scripts/migrate.ts                    # 数据库迁移
/scripts/seed-questions.ts             # 示例数据脚本
/app/matches/page.tsx                  # 主页面（包含InterviewQuestionsTab）
```

## 部署说明

1. 运行数据库迁移：`npm run migrate`
2. 添加示例数据：`npx tsx scripts/seed-questions.ts`
3. 启动开发服务器：`npm run dev`
4. 访问 http://localhost:3000/matches 并点击面试真题标签页 