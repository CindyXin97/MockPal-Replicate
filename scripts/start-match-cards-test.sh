#!/bin/bash

# 匹配卡片测试页面启动脚本
echo "🎯 启动匹配卡片样式测试页面..."
echo ""
echo "📋 功能说明："
echo "  - 展示不同成就等级的用户卡片"
echo "  - 展示不同联系状态的卡片样式"
echo "  - 显示当前登录用户自己的卡片（新增功能）"
echo "  - 响应式设计，支持桌面和移动端"
echo ""
echo "🚀 启动开发服务器..."
echo ""

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 启动开发服务器
echo "🌐 启动 Next.js 开发服务器..."
echo "📱 访问地址: http://localhost:3000/test-match-cards"
echo ""
echo "💡 使用提示："
echo "  1. 确保已登录账户"
echo "  2. 点击'显示我的卡片'按钮查看自己的卡片"
echo "  3. 悬停成就等级标签查看详细说明"
echo "  4. 测试不同屏幕尺寸的响应式效果"
echo ""

npm run dev
