# 面试真题社区化功能分析文档

## 📋 需求总结

### 1. 用户发帖功能
- **功能描述**: 在面试真题页面顶部添加"发布题目"按钮
- **交互流程**:
  - 点击按钮 → 弹出表单弹窗
  - 表单包含字段:
    - 公司选择（下拉菜单）
    - 岗位选择（下拉菜单）
    - 题目类型（技术/行为/案例/统计）
    - 难度（简单/中等/困难）
    - 面试时间（日期选择器）
    - 题目内容（文本域，必填）
    - 推荐答案（文本域，可选）
  - 提交后题目显示在列表中
- **设计要求**: 按钮不使用渐变色，采用纯色设计

### 2. 展示优先级
- **排序规则**:
  1. 用户自己发布的题目（置顶）
  2. 系统预置的官方题目
  3. 其他用户发布的题目
- **视觉区分**: 用户自己的帖子需要有明显标识

### 3. 交互优化
- **折叠展示**: 默认只显示题目摘要和基本信息
- **点击展开**: 
  - 显示完整题目内容
  - 显示推荐答案（如有）
  - 显示评论区
- **评论功能**:
  - 用户可以在题目下评论自己的想法
  - 支持系统题目和用户发布的题目

### 4. 互动功能
- **点赞/踩**:
  - 每个题目下方有👍和👎按钮
  - 显示点赞/踩的数量
  - 用户只能操作一次
  - 可以切换或取消

## 🎯 合理性分析

### ✅ 优势
1. **社区活跃度**: 用户生成内容（UGC）增加平台粘性
2. **内容丰富度**: 快速扩充题库，获取最新面试题
3. **真实性**: 用户亲身经历的题目更有参考价值
4. **互动性**: 评论和点赞增强用户参与感
5. **数据积累**: 用户行为数据可用于后续推荐算法

### ⚠️ 需要注意的问题
1. **内容质量**:
   - 解决方案: 添加审核机制（可选）
   - 使用点赞/踩来标识质量
   
2. **重复内容**:
   - 解决方案: 在发布前检查相似题目
   - 后期添加合并功能

3. **垃圾信息**:
   - 解决方案: 
     - 限制发布频率（如每天最多5条）
     - 举报机制
     - 管理员审核功能

4. **匿名性考虑**:
   - 用户可能不想公开身份
   - 解决方案: 考虑匿名发布选项

## 🗄️ 数据库设计

### 1. 用户发布的面试题目表 (user_interview_posts)
```sql
CREATE TABLE user_interview_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- technical, behavioral, case_study, stats
  difficulty VARCHAR(20) NOT NULL, -- easy, medium, hard
  interview_date DATE NOT NULL, -- 面试日期
  question TEXT NOT NULL,
  recommended_answer TEXT, -- 可选的推荐答案
  is_anonymous BOOLEAN DEFAULT FALSE, -- 是否匿名发布
  status VARCHAR(20) DEFAULT 'active', -- active, hidden, deleted
  views_count INTEGER DEFAULT 0, -- 浏览次数
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 索引优化
CREATE INDEX idx_user_posts_user_id ON user_interview_posts(user_id);
CREATE INDEX idx_user_posts_company ON user_interview_posts(company);
CREATE INDEX idx_user_posts_position ON user_interview_posts(position);
CREATE INDEX idx_user_posts_status ON user_interview_posts(status);
CREATE INDEX idx_user_posts_created_at ON user_interview_posts(created_at DESC);
```

### 2. 评论表 (interview_comments)
```sql
CREATE TABLE interview_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type VARCHAR(20) NOT NULL, -- 'system' or 'user'
  post_id INTEGER NOT NULL, -- interview_questions.id 或 user_interview_posts.id
  content TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES interview_comments(id), -- 用于回复评论
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 索引优化
CREATE INDEX idx_comments_post ON interview_comments(post_type, post_id);
CREATE INDEX idx_comments_user ON interview_comments(user_id);
CREATE INDEX idx_comments_parent ON interview_comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON interview_comments(created_at DESC);
```

### 3. 点赞/踩表 (interview_votes)
```sql
CREATE TABLE interview_votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type VARCHAR(20) NOT NULL, -- 'system' or 'user'
  post_id INTEGER NOT NULL,
  vote_type VARCHAR(10) NOT NULL, -- 'up' or 'down'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- 确保每个用户对每个帖子只能投一次票
  UNIQUE(user_id, post_type, post_id)
);

-- 索引优化
CREATE INDEX idx_votes_post ON interview_votes(post_type, post_id);
CREATE INDEX idx_votes_user ON interview_votes(user_id);
```

### 4. 统计视图（可选，用于性能优化）
```sql
-- 创建物化视图来缓存统计数据
CREATE MATERIALIZED VIEW interview_post_stats AS
SELECT 
  post_type,
  post_id,
  COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
  COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes,
  COUNT(CASE WHEN vote_type = 'up' THEN 1 END) - 
    COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as score
FROM interview_votes
GROUP BY post_type, post_id;

-- 创建索引
CREATE INDEX idx_post_stats_score ON interview_post_stats(score DESC);
```

## 🔄 API 设计

### 1. 用户发帖 API
```
POST /api/interview-posts
Body: {
  company: string
  position: string
  questionType: string
  difficulty: string
  interviewDate: string (YYYY-MM-DD)
  question: string
  recommendedAnswer?: string
  isAnonymous?: boolean
}
```

### 2. 获取题目列表 API（修改现有）
```
GET /api/interview-questions
Query params: 
  - 现有参数保持不变
  - 新增: includeUserPosts=true
  - 新增: sortBy=latest|popular|score
Response: {
  questions: [
    {
      ...现有字段
      postType: 'system' | 'user'
      author?: { id, name }
      isOwnPost: boolean
      stats: { upvotes, downvotes, comments, views }
    }
  ]
}
```

### 3. 评论 API
```
POST /api/interview-comments
Body: {
  postType: 'system' | 'user'
  postId: number
  content: string
  parentCommentId?: number
  isAnonymous?: boolean
}

GET /api/interview-comments?postType=user&postId=123
```

### 4. 点赞/踩 API
```
POST /api/interview-votes
Body: {
  postType: 'system' | 'user'
  postId: number
  voteType: 'up' | 'down'
}

DELETE /api/interview-votes?postType=user&postId=123
(取消投票)
```

## 🎨 前端组件设计

### 1. 组件结构
```
InterviewQuestionsTab/
├── PostQuestionButton (发布按钮)
├── PostQuestionModal (发布弹窗)
├── QuestionCard (题目卡片)
│   ├── QuestionHeader (标题栏 - 公司、岗位等)
│   ├── QuestionContent (内容区 - 可折叠)
│   ├── QuestionActions (操作栏 - 点赞/踩)
│   └── CommentSection (评论区)
│       ├── CommentList
│       └── CommentForm
└── FilterBar (筛选栏 - 新增"我的发布"选项)
```

### 2. 状态管理
- 使用 React useState 管理局部状态
- 如需要，可考虑使用 Jotai 管理全局状态（如当前用户的投票记录）

## 📝 实施步骤

### Phase 1: 数据库和后端 (优先级: 高)
1. ✅ 创建数据库迁移文件
2. ✅ 更新 schema.ts
3. ✅ 创建/更新 API 路由
4. ✅ 测试 API 功能

### Phase 2: 前端组件 (优先级: 高)
1. ✅ 创建发帖弹窗组件
2. ✅ 修改题目卡片组件（折叠/展开）
3. ✅ 添加点赞/踩UI
4. ✅ 创建评论组件

### Phase 3: 集成和优化 (优先级: 中)
1. ✅ 集成所有组件到主页面
2. ✅ 优化排序和筛选逻辑
3. ✅ 添加加载状态和错误处理
4. ✅ 响应式设计适配

### Phase 4: 扩展功能 (优先级: 低，后期实现)
1. ⏳ 内容审核机制
2. ⏳ 举报功能
3. ⏳ 通知系统（有人评论/点赞时通知）
4. ⏳ 搜索功能增强
5. ⏳ 数据分析dashboard

## 🔒 安全性考虑

1. **身份验证**: 所有写操作需要登录
2. **权限控制**: 用户只能编辑/删除自己的帖子和评论
3. **内容过滤**: XSS防护、SQL注入防护
4. **频率限制**: 防止刷屏和滥用
5. **数据验证**: 前后端双重验证

## 📊 监控指标

建议追踪以下指标：
- 用户发帖数量和频率
- 评论活跃度
- 点赞/踩比例
- 高分题目排行
- 用户参与率

## ✅ 结论

这个社区化功能设计合理且可行：
- ✅ 技术实现难度适中
- ✅ 数据库设计考虑了扩展性和性能
- ✅ 用户体验设计清晰
- ✅ 安全性和数据完整性有保障
- ✅ 为后续功能扩展留有空间

建议立即开始实施，先完成核心功能（发帖、展示、点赞），后续再迭代添加评论和其他高级功能。

