'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestVotePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testVote = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 发送测试投票请求...');
      const response = await fetch('/api/interview-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postType: 'system',
          postId: 1, // 测试 ID
          voteType: 'up',
        }),
      });

      const data = await response.json();
      console.log('🧪 响应:', data);

      setResult({
        status: response.status,
        success: data.success,
        message: data.message,
        action: data.action,
        data: data,
      });
    } catch (error: any) {
      console.error('🧪 错误:', error);
      setResult({
        status: 'error',
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 检查数据库连接...');
      const response = await fetch('/api/test-db-connection');
      const data = await response.json();
      console.log('🧪 数据库状态:', data);

      setResult(data);
    } catch (error: any) {
      console.error('🧪 错误:', error);
      setResult({
        status: 'error',
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 投票功能测试页面</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              这个页面用于测试投票API是否正常工作。
            </p>
            <p className="text-sm text-gray-600">
              <strong>步骤：</strong>
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>确保你已经登录</li>
              <li>点击下面的"测试投票"按钮</li>
              <li>查看返回结果</li>
              <li>打开浏览器控制台查看详细日志</li>
            </ol>
          </div>

          <div className="flex gap-4">
            <Button onClick={testVote} disabled={loading}>
              {loading ? '测试中...' : '🧪 测试投票'}
            </Button>
            <Button onClick={checkDatabase} disabled={loading} variant="outline">
              {loading ? '检查中...' : '🔍 检查数据库连接'}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">测试结果：</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-900">📋 如何查看日志</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>浏览器控制台：</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Chrome/Edge: Command + Option + J</li>
                <li>Safari: Command + Option + C</li>
                <li>Firefox: Command + Option + K</li>
              </ul>
              <p className="mt-2"><strong>服务器日志：</strong></p>
              <p className="ml-4">查看运行 <code>npm run dev</code> 的终端窗口</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

