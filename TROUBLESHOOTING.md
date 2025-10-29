# 故障排查指南

## JSON 解析错误："Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

### 问题描述
当用户点击收藏按钮或访问我的题库页面时，可能会遇到以下错误：
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### 原因分析
这个错误表示前端代码期望接收 JSON 数据，但实际接收到了 HTML 页面（通常是 404 或 500 错误页面）。

### 可能的原因

1. **API 路由未正确加载**
   - Next.js 开发服务器需要重启以加载新的 API 路由
   - 解决方案：重启开发服务器

2. **API 路由文件命名或位置错误**
   - 检查文件是否在正确的位置：`app/api/saved-questions/route.ts`
   - 文件必须命名为 `route.ts` 或 `route.js`

3. **环境变量未配置**
   - 数据库连接字符串缺失
   - 检查 `.env.local` 文件是否存在并配置正确

4. **数据库表未创建**
   - `user_saved_questions` 表可能不存在
   - 运行数据库迁移

5. **会话认证问题**
   - NextAuth 配置错误
   - 用户未正确登录

### 解决步骤

#### 步骤 1: 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C 或）
pkill -f "next dev"

# 等待几秒
sleep 2

# 重新启动
npm run dev
```

#### 步骤 2: 验证 API 端点

```bash
# 测试 API 是否正常返回 JSON
curl http://localhost:3000/api/saved-questions

# 应该返回类似这样的 JSON（未登录状态）
# {"success":false,"message":"请先登录"}
```

#### 步骤 3: 检查数据库连接

确保 `.env.local` 文件包含正确的数据库连接字符串：

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

#### 步骤 4: 运行数据库迁移

如果 `user_saved_questions` 表不存在：

```bash
# 创建收藏表
npx tsx scripts/migrate.ts

# 或手动运行 SQL
psql $DATABASE_URL -f migrations/0018_add_user_saved_questions.sql
```

#### 步骤 5: 清除浏览器缓存

1. 打开浏览器开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

#### 步骤 6: 查看浏览器控制台

打开浏览器控制台（F12 → Console），查看详细错误信息：
- 检查实际请求的 URL
- 查看响应状态码（200/404/500）
- 查看完整的错误堆栈

### 改进措施

我已经为代码添加了更好的错误处理：

1. **内容类型检查**
   - 在解析 JSON 之前检查 `Content-Type` 头
   - 如果不是 JSON，显示友好的错误提示

2. **详细的错误日志**
   - 控制台会输出 API 响应的前 200 个字符
   - 帮助快速定位问题

3. **用户友好的错误提示**
   - 不同类型的错误显示不同的提示信息
   - 提示用户刷新页面或联系支持

### 测试命令

运行以下命令测试 API 是否正常工作：

```bash
# 1. 测试未登录状态
curl http://localhost:3000/api/saved-questions

# 2. 测试收藏接口（应该返回 401）
curl -X POST http://localhost:3000/api/saved-questions \
  -H "Content-Type: application/json" \
  -d '{"questionType":"system","questionId":1}'

# 3. 测试取消收藏接口（应该返回 401）
curl -X DELETE "http://localhost:3000/api/saved-questions?questionType=system&questionId=1"

# 4. 测试真题列表 API
curl http://localhost:3000/api/interview-questions?includeUserPosts=true&limit=1
```

所有请求都应该返回 JSON 格式的响应，而不是 HTML。

### 常见错误示例

#### ❌ 错误示例 1: 404 页面
```
<!DOCTYPE html>
<html>
<head><title>404 - Page Not Found</title></head>
...
```

**原因**: API 路由不存在或未正确加载
**解决**: 重启开发服务器

#### ❌ 错误示例 2: 500 错误
```
<!DOCTYPE html>
<html>
<head><title>500 - Internal Server Error</title></head>
...
```

**原因**: API 代码有运行时错误（数据库连接失败、代码错误等）
**解决**: 查看服务器日志，修复代码错误

#### ✅ 正确示例
```json
{
  "success": false,
  "message": "请先登录"
}
```

### 如果问题仍未解决

1. **查看服务器日志**
   - 开发服务器的终端输出
   - 查找红色的错误信息

2. **检查 Next.js 版本**
   ```bash
   npm list next
   # 当前使用: 15.3.2
   ```

3. **清理并重装依赖**
   ```bash
   rm -rf node_modules .next
   npm install
   npm run dev
   ```

4. **验证文件结构**
   ```
   app/
     api/
       saved-questions/
         route.ts  ← 确保文件名正确
   ```

### 预防措施

1. **始终检查响应类型**
   - 使用我们添加的 `Content-Type` 检查
   - 在调用 `.json()` 之前验证响应

2. **使用 try-catch**
   - 捕获所有可能的错误
   - 提供友好的错误提示

3. **记录详细日志**
   - 使用 `console.error()` 记录错误
   - 包含足够的上下文信息

4. **定期测试 API**
   - 在浏览器中直接访问 API 端点
   - 验证返回的是 JSON 而不是 HTML

### 需要帮助？

如果按照以上步骤仍无法解决问题，请提供以下信息：

1. 完整的错误堆栈
2. 浏览器控制台的截图
3. 服务器终端的日志
4. 访问的 URL 和操作步骤
5. Node.js 和 npm 版本

```bash
node --version
npm --version
```

