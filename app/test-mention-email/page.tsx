'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function TestMentionEmailPage() {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    actorName: '测试用户',
    content: '@Cindy 你好！我在测试@提及功能',
    postType: 'system',
    postId: '1',
    recipientEmail: 'test@example.com'
  });

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-mention-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('测试邮件发送成功！');
        console.log('邮件发送结果:', result);
      } else {
        toast.error(result.message || '测试失败');
      }
    } catch (error) {
      console.error('测试失败:', error);
      toast.error('测试失败，请检查控制台');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 @提及邮件功能测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">提及者姓名</label>
            <Input
              value={testData.actorName}
              onChange={(e) => setTestData({ ...testData, actorName: e.target.value })}
              placeholder="输入提及者姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">评论内容</label>
            <Textarea
              value={testData.content}
              onChange={(e) => setTestData({ ...testData, content: e.target.value })}
              placeholder="输入包含@提及的评论内容"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">收件人邮箱</label>
            <Input
              value={testData.recipientEmail}
              onChange={(e) => setTestData({ ...testData, recipientEmail: e.target.value })}
              placeholder="输入收件人邮箱"
              type="email"
            />
          </div>

          <div className="flex gap-2">
            <Input
              value={testData.postType}
              onChange={(e) => setTestData({ ...testData, postType: e.target.value })}
              placeholder="postType"
              className="flex-1"
            />
            <Input
              value={testData.postId}
              onChange={(e) => setTestData({ ...testData, postId: e.target.value })}
              placeholder="postId"
              className="flex-1"
            />
          </div>

          <Button 
            onClick={handleTestEmail} 
            disabled={loading}
            className="w-full"
          >
            {loading ? '发送中...' : '发送测试邮件'}
          </Button>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>功能说明：</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>@提及邮件每天最多发送1封</li>
              <li>开发环境下会在控制台打印邮件内容</li>
              <li>生产环境下会真正发送邮件</li>
              <li>邮件发送失败不影响站内通知</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
