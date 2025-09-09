'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugDB() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      
      try {
        // 获取成功匹配
        const response = await fetch('/api/debug-db');
        const data = await response.json();
        
        if (data.matches) setMatches(data.matches);
        if (data.feedbacks) setFeedbacks(data.feedbacks);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) return <div>加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">数据库调试</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>用户ID:</strong> {session?.user?.id}</p>
            <p><strong>用户名:</strong> {session?.user?.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>匹配记录 (matches表)</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p>没有匹配记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">ID</th>
                      <th className="border p-2">User1 ID</th>
                      <th className="border p-2">User2 ID</th>
                      <th className="border p-2">Status</th>
                      <th className="border p-2">Contact Status</th>
                      <th className="border p-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => (
                      <tr key={match.id}>
                        <td className="border p-2">{match.id}</td>
                        <td className="border p-2">{match.user1Id}</td>
                        <td className="border p-2">{match.user2Id}</td>
                        <td className="border p-2">{match.status}</td>
                        <td className="border p-2">{match.contactStatus || 'N/A'}</td>
                        <td className="border p-2">{match.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>反馈记录 (feedbacks表)</CardTitle>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <p>没有反馈记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">ID</th>
                      <th className="border p-2">Match ID</th>
                      <th className="border p-2">User ID</th>
                      <th className="border p-2">Interview Status</th>
                      <th className="border p-2">Content</th>
                      <th className="border p-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((feedback) => (
                      <tr key={feedback.id}>
                        <td className="border p-2">{feedback.id}</td>
                        <td className="border p-2">{feedback.matchId}</td>
                        <td className="border p-2">{feedback.userId}</td>
                        <td className="border p-2">{feedback.interviewStatus}</td>
                        <td className="border p-2">{feedback.content}</td>
                        <td className="border p-2">{feedback.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 