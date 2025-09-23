# 🚀 高效测试指南

## 🎯 问题解决
- **问题**: 用户每日5个浏览额度用完，手动创建用户效率低
- **解决方案**: 批量创建测试用户 + 一键重置测试环境

## 🛠️ 新增工具

### 1. 批量创建测试用户
```bash
npm run create-batch-users
```
**功能**: 一次性创建5个不同背景的测试用户
- `test1@gmail.com` - 初级软件工程师
- `test2@gmail.com` - 中级数据科学家  
- `test3@gmail.com` - 高级产品经理
- `test4@gmail.com` - 中级UX设计师
- `test5@gmail.com` - 高级DevOps工程师

### 2. 测试环境管理
```bash
# 一键重置测试环境（推荐）
npm run test-reset

# 只重置每日浏览额度
npm run test-reset-views

# 只清理匹配记录
npm run test-clear-matches

# 查看测试用户状态
npm run test-status
```

## 📋 高效测试流程

### 第一次设置
1. **创建测试用户**:
   ```bash
   npm run create-batch-users
   ```

2. **启动开发服务器**:
   ```bash
   npm run dev
   ```

### 日常测试循环
1. **重置测试环境**:
   ```bash
   npm run test-reset
   ```
   - 重置所有测试用户的每日浏览额度
   - 清理所有匹配记录
   - 显示用户状态

2. **开始测试**:
   - 访问 `http://localhost:3000/auth`
   - 使用任意测试账号登录
   - 测试匹配功能

3. **重复测试**:
   - 测试完成后再次运行 `npm run test-reset`
   - 重新开始测试

## 🎮 测试场景

### 场景1: 单方面喜欢
- 用 `test1@gmail.com` 登录
- 对 `test2@gmail.com` 点击"匹配"
- 预期: 显示"已收到你的喜欢！" + 跳转下一个人

### 场景2: 双方互相匹配
- 用 `test1@gmail.com` 登录，对 `test2@gmail.com` 点击"匹配"
- 登出，用 `test2@gmail.com` 登录，对 `test1@gmail.com` 点击"匹配"
- 预期: 显示"匹配成功！请到成功匹配页面查看" + 跳转下一个人

### 场景3: 跳过操作
- 点击"跳过"按钮
- 预期: 立即跳转到下一个人

### 场景4: 额度用完测试
- 连续浏览5个人后
- 预期: 显示额度用完提示

## 🔧 高级用法

### 查看测试用户状态
```bash
npm run test-status
```
显示:
- 所有测试用户列表
- 今日浏览记录统计
- 剩余浏览次数

### 只重置浏览额度
```bash
npm run test-reset-views
```
当只需要重置浏览额度，保留匹配记录时使用

### 只清理匹配记录
```bash
npm run test-clear-matches
```
当只需要清理匹配记录，保留浏览记录时使用

## 💡 测试技巧

1. **快速切换用户**: 使用浏览器的无痕模式或不同浏览器
2. **批量测试**: 先创建所有用户，再依次测试
3. **状态检查**: 测试前运行 `npm run test-status` 确认环境
4. **重置频率**: 每次测试新功能前都运行 `npm run test-reset`

## 🚨 注意事项

- 测试用户会覆盖现有用户（如果邮箱相同）
- 重置操作会删除所有测试用户的匹配记录
- 生产环境不要运行这些测试脚本
- 测试完成后记得清理测试数据

## 📊 测试用户详情

| 邮箱 | 密码 | 角色 | 经验 | 目标公司 | 面试类型 |
|------|------|------|------|----------|----------|
| test1@gmail.com | 123456 | 软件工程师 | 初级 | Google | 技术+行为 |
| test2@gmail.com | 123456 | 数据科学家 | 中级 | Meta | 技术+行为+案例 |
| test3@gmail.com | 123456 | 产品经理 | 高级 | Apple | 行为+案例 |
| test4@gmail.com | 123456 | UX设计师 | 中级 | Netflix | 行为+案例 |
| test5@gmail.com | 123456 | DevOps工程师 | 高级 | Amazon | 技术 |

现在您可以高效地进行测试了！🎉
