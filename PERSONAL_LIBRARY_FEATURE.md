# 个人题库功能 - 功能文档

## 📚 功能概述

个人题库功能允许用户收藏感兴趣的面试真题，建立自己的专属题库，方便后续复习和准备面试。

## ✨ 已实现功能（P0 MVP）

### 1. 数据库设计

创建了 `user_saved_questions` 表来存储用户收藏的题目：

```sql
CREATE TABLE user_saved_questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_type VARCHAR(20) NOT NULL, -- 'system' 或 'user'
  question_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, question_type, question_id)
);
```

**索引优化：**
- `idx_saved_questions_user_id` - 用户ID索引
- `idx_saved_questions_type_id` - 题目类型和ID复合索引

### 2. 后端API

#### `/api/saved-questions` - 收藏管理API

**GET** - 获取用户收藏的题目列表
- 支持分页
- 支持按题目类型、公司、难度筛选
- 返回题目完整信息和统计数据
- 返回收藏统计（总数、系统题目数、用户题目数）

**POST** - 收藏题目
- 需要登录
- 防止重复收藏
- 验证题目是否存在

**DELETE** - 取消收藏
- 需要登录
- 删除指定收藏记录

#### `/api/interview-questions` - 真题列表API（已更新）

新增返回字段：
- `isSaved` - 标识题目是否已被当前用户收藏

### 3. 前端组件

#### `SaveQuestionButton` 组件
位置：`components/save-question-button.tsx`

**功能：**
- 收藏/取消收藏按钮
- 视觉反馈（已收藏显示黄色填充书签图标）
- 乐观更新（立即更新UI）
- Toast提示
- 防止事件冒泡

**Props：**
```typescript
{
  questionId: number;           // 题目ID
  questionType: 'system' | 'user';  // 题目类型
  isSaved?: boolean;            // 是否已收藏
  onSaveChange?: (saved: boolean) => void;  // 状态改变回调
  variant?: 'default' | 'outline' | 'ghost';  // 按钮样式
  size?: 'default' | 'sm' | 'lg' | 'icon';   // 按钮大小
  showText?: boolean;           // 是否显示文字
}
```

#### 题目列表页面集成
位置：`app/matches/page.tsx`

**改动：**
- 在题目卡片右上角添加收藏按钮
- 实时更新收藏状态
- 与题目详情页跳转不冲突

### 4. 我的题库页面
位置：`app/my-library/page.tsx`

**功能：**
- 📊 统计卡片展示（总数、系统题目、用户题目）
- 🔍 多维度筛选（题目类型、公司、难度）
- 📋 题目列表展示
- 📅 收藏时间显示（今天、昨天、X天前等）
- ⭐ 一键取消收藏
- 🔗 点击跳转到题目详情页
- 📭 空状态引导（无收藏时引导用户去浏览真题）

**页面特色：**
- 响应式设计，适配移动端
- 加载骨架屏优化体验
- 优雅的空状态设计

### 5. 导航菜单集成
位置：`components/header.tsx`

在顶部导航栏添加了"我的题库"入口，位于"匹配管理"和"我的成就"之间。

## 🎯 用户使用流程

### 收藏题目
1. 进入"匹配管理"页面浏览真题
2. 找到感兴趣的题目
3. 点击题目卡片右上角的书签图标
4. 看到"收藏成功"的提示
5. 书签图标变为黄色填充状态

### 查看题库
1. 点击顶部导航的"我的题库"
2. 查看收藏统计卡片
3. 使用筛选器按需筛选
4. 点击题目查看详情
5. 可以随时取消收藏

### 取消收藏
1. 在题目列表或我的题库页面
2. 点击已收藏的书签图标
3. 确认取消收藏
4. 题目从列表中移除（如果在我的题库页面）

## 📊 数据流程

```
用户操作 → SaveQuestionButton
    ↓
  API 请求
    ↓
数据库操作（user_saved_questions表）
    ↓
  返回结果
    ↓
更新UI状态 + Toast提示
```

## 🎨 UI/UX 设计亮点

1. **视觉一致性**
   - 使用 shadcn/ui 组件库
   - 统一的颜色方案和交互模式

2. **即时反馈**
   - 乐观更新，不等待API响应即更新UI
   - Toast提示操作结果
   - 加载状态和骨架屏

3. **防误触设计**
   - 收藏按钮点击事件阻止冒泡
   - 避免误触导致跳转详情页

4. **空状态引导**
   - 无收藏时显示友好的引导界面
   - 提供快速跳转到真题浏览的按钮

## 🔧 技术栈

- **前端框架**: Next.js 15.3.2
- **状态管理**: React Hooks
- **UI组件**: shadcn/ui
- **样式**: Tailwind CSS
- **认证**: NextAuth.js
- **数据库**: PostgreSQL (Vercel Neon)
- **ORM**: Drizzle ORM
- **图标**: Lucide React

## 📈 性能优化

1. **数据库索引**
   - user_id 索引加速用户查询
   - 复合索引 (question_type, question_id) 加速题目查询

2. **API优化**
   - 使用 UNIQUE 约束防止重复收藏
   - 批量查询减少数据库请求
   - 分页加载避免数据过多

3. **前端优化**
   - 乐观更新提升用户体验
   - 骨架屏优化加载体验
   - 防抖和节流（如需要可添加）

## 🚀 未来扩展方向（P1功能）

以下功能暂未实现，可根据用户需求逐步添加：

### 1. 个人笔记
- 为每道题添加个人答案和思路
- 支持富文本编辑
- 记录面试官的追问

### 2. 学习进度追踪
- 标记题目状态：未学习/学习中/已掌握
- 显示学习进度统计
- 设置复习提醒

### 3. 分类管理
- 创建自定义分类（如"字节跳动准备"）
- 支持题目多分类归档
- 拖拽排序

### 4. 智能复习提醒
- 基于艾宾浩斯遗忘曲线推荐复习时间
- 邮件/站内提醒

### 5. 导出功能
- 导出为PDF/Markdown格式
- 方便打印复习

### 6. 学习报告
- 每周/月学习报告
- 学习进度图表
- 收藏偏好分析

## 📝 文件清单

### 新增文件
- `migrations/0018_add_user_saved_questions.sql` - 数据库迁移文件
- `app/api/saved-questions/route.ts` - 收藏API
- `components/save-question-button.tsx` - 收藏按钮组件
- `app/my-library/page.tsx` - 我的题库页面

### 修改文件
- `lib/db/schema.ts` - 添加 userSavedQuestions 表定义
- `app/api/interview-questions/route.ts` - 添加 isSaved 字段
- `app/matches/page.tsx` - 集成收藏按钮
- `components/header.tsx` - 添加导航入口

## 🧪 测试建议

1. **功能测试**
   - 收藏系统题目
   - 收藏用户发布的题目
   - 取消收藏
   - 筛选功能
   - 空状态展示

2. **边界测试**
   - 重复收藏同一题目
   - 未登录时点击收藏
   - 收藏已删除的题目
   - 大量收藏的性能

3. **UI测试**
   - 移动端响应式
   - 不同屏幕尺寸
   - 加载状态
   - 错误提示

## 💡 使用提示

1. 在真题列表中，已收藏的题目会显示黄色填充的书签图标
2. 点击收藏按钮不会跳转到详情页，方便快速收藏
3. 在我的题库页面取消收藏后，题目会立即从列表中移除
4. 筛选条件实时生效，无需点击搜索按钮

## 🎉 总结

个人题库功能（P0 MVP版本）已完整实现，包含：
- ✅ 完整的数据库设计和迁移
- ✅ 功能完善的后端API
- ✅ 美观易用的前端界面
- ✅ 良好的用户体验和交互设计

用户现在可以轻松收藏感兴趣的面试题目，建立自己的专属题库，为面试做好充分准备！

