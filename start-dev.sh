#!/bin/bash

echo "🚀 启动MockPal开发服务器..."
echo "📍 当前目录: $(pwd)"

# 检查.env.local文件
if [ -f ".env.local" ]; then
    echo "✅ 找到.env.local文件"
    echo "🔍 检查NEXTAUTH_URL设置:"
    grep NEXTAUTH_URL .env.local
else
    echo "❌ 未找到.env.local文件"
    exit 1
fi

# 清理端口
echo "🧹 清理端口3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "端口3000已清理"

# 加载环境变量并启动
echo "🌟 启动Next.js开发服务器..."
source .env.local 2>/dev/null || echo "注意：无法source .env.local"
export $(grep -v '^#' .env.local | xargs) 2>/dev/null || echo "使用默认环境变量"

echo "🌐 环境变量检查:"
echo "   NEXTAUTH_URL: $NEXTAUTH_URL"
echo "   GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}..."

npm run dev 