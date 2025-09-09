'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TestStatusUpdate() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testStatusUpdate = async () => {
    if (!session?.user?.id) {
      toast.error('请先登录');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/matches/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: 1, // 测试用的matchId
          contactStatus: 'contacted',
        }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (response.ok) {
        toast.success('状态更新成功！');
      } else {
        toast.error(`状态更新失败：${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        error: error instanceof Error ? error.message : String(error)
      });
      toast.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>状态更新测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>用户ID:</strong> {session?.user?.id || '未登录'}</p>
            <p><strong>用户名:</strong> {session?.user?.name || '未登录'}</p>
          </div>

          <Button 
            onClick={testStatusUpdate}
            disabled={loading || !session?.user?.id}
          >
            {loading ? '测试中...' : '测试状态更新API'}
          </Button>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">API响应结果</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-gray-600">
            <h3 className="font-semibold mb-2">使用说明：</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>确保你已经登录</li>
              <li>点击按钮测试状态更新API</li>
              <li>查看响应结果，了解API是否正常工作</li>
              <li>如果失败，检查控制台的错误信息</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 