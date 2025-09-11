'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TestFeedbackSubmit() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFeedbackSubmit = async () => {
    if (!session?.user?.id) {
      toast.error('请先登录');
      return;
    }

    setLoading(true);
    try {
      const testData = {
        matchId: 1, // 测试用的matchId
        userId: parseInt(session.user.id),
        interviewStatus: 'yes',
        content: '测试反馈内容 - 面试体验很好！',
      };

      console.log('发送数据:', testData);

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      console.log('API响应:', data);

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        requestData: testData
      });

      if (response.ok && data.success) {
        toast.success('反馈提交成功！');
      } else {
        toast.error(`反馈提交失败：${data.message || '未知错误'}`);
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

  const loadDbData = async () => {
    if (!session?.user?.id) {
      toast.error('请先登录');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug-db');
      const data = await response.json();
      setDbData(data);
      toast.success('数据库数据已加载');
    } catch (error) {
      console.error('Error loading DB data:', error);
      toast.error('加载数据库数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>反馈提交测试 & 数据库调试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>用户ID:</strong> {session?.user?.id || '未登录'}</p>
            <p><strong>用户名:</strong> {session?.user?.name || '未登录'}</p>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={testFeedbackSubmit}
              disabled={loading || !session?.user?.id}
            >
              {loading ? '测试中...' : '测试反馈提交API'}
            </Button>

            <Button 
              onClick={loadDbData}
              disabled={loading || !session?.user?.id}
              variant="outline"
            >
              {loading ? '加载中...' : '查看数据库数据'}
            </Button>
          </div>

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

          {dbData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">数据库数据</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">匹配记录 (matches表):</h4>
                  {dbData.matches && dbData.matches.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-1">ID</th>
                            <th className="border p-1">User1</th>
                            <th className="border p-1">User2</th>
                            <th className="border p-1">Status</th>
                            <th className="border p-1">Contact Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbData.matches.map((match: any) => (
                            <tr key={match.id}>
                              <td className="border p-1">{match.id}</td>
                              <td className="border p-1">{match.user1Id}</td>
                              <td className="border p-1">{match.user2Id}</td>
                              <td className="border p-1">{match.status}</td>
                              <td className="border p-1">{match.contactStatus || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">没有匹配记录</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">反馈记录 (feedbacks表):</h4>
                  {dbData.feedbacks && dbData.feedbacks.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-1">ID</th>
                            <th className="border p-1">Match ID</th>
                            <th className="border p-1">User ID</th>
                            <th className="border p-1">Status</th>
                            <th className="border p-1">Content</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbData.feedbacks.map((feedback: any) => (
                            <tr key={feedback.id}>
                              <td className="border p-1">{feedback.id}</td>
                              <td className="border p-1">{feedback.matchId}</td>
                              <td className="border p-1">{feedback.userId}</td>
                              <td className="border p-1">{feedback.interviewStatus}</td>
                              <td className="border p-1">{feedback.content}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">没有反馈记录</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-gray-600">
            <h3 className="font-semibold mb-2">使用说明：</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>确保你已经登录</li>
              <li>先点击"查看数据库数据"了解当前的匹配记录</li>
              <li>使用真实的matchId测试反馈提交</li>
              <li>查看响应结果和控制台日志</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 