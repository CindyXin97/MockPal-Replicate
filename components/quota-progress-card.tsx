'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface QuotaInfo {
  base: number;
  bonus: number;
  total: number;
  used: number;
  remaining: number;
  progress: {
    posts: {
      current: number;
      required: number;
      reward: number;
    };
    comments: {
      current: number;
      required: number;
      reward: number;
    };
  };
}

export function QuotaProgressCard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuota = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      try {
        const response = await fetch('/api/user/match-quota');
        const data = await response.json();
        if (data.success) {
          setQuotaInfo(data.data);
        } else {
          toast.error(data.message || '获取配额信息失败');
        }
      } catch (error) {
        console.error('Failed to fetch quota info:', error);
        toast.error('获取配额信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
    
    // 每30秒刷新一次，保持数据最新
    const interval = setInterval(fetchQuota, 30000);
    
    // 监听配额更新事件（当用户评论或发帖后触发）
    const handleQuotaUpdate = () => {
      fetchQuota();
    };
    window.addEventListener('quotaUpdated', handleQuotaUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('quotaUpdated', handleQuotaUpdate);
    };
  }, [session?.user?.id]);

  if (loading) {
    return (
      <Card className="border-l-4 border-l-blue-300 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 animate-pulse">
        <CardContent className="pt-3 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-blue-100 rounded w-1/3"></div>
            <div className="h-4 bg-blue-100 rounded w-1/6"></div>
          </div>
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-white/60 border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 bg-blue-100 rounded w-1/2"></div>
                <div className="h-4 bg-blue-100 rounded w-1/5"></div>
              </div>
              <div className="h-7 bg-blue-100 rounded w-full"></div>
            </div>
            <div className="p-2 rounded-lg bg-white/60 border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 bg-blue-100 rounded w-1/2"></div>
                <div className="h-4 bg-blue-100 rounded w-1/5"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-blue-100 rounded max-w-[200px]"></div>
                <div className="h-6 bg-blue-100 rounded w-1/4"></div>
              </div>
            </div>
          </div>
          <div className="h-4 bg-blue-100 rounded w-2/3 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!quotaInfo || !quotaInfo.progress) return null; // Added safety check for quotaInfo.progress

  const postProgress = quotaInfo.progress.posts 
    ? (quotaInfo.progress.posts.current / quotaInfo.progress.posts.required) * 100 
    : 0;
  const commentProgress = quotaInfo.progress.comments
    ? (quotaInfo.progress.comments.current / quotaInfo.progress.comments.required) * 100
    : 0;

  return (
    <Card className="border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-blue-50/30 to-indigo-50/20">
      <CardContent className="pt-3 pb-3">
        {/* 标题和今日可用配额 */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-1">
            <span className="text-lg">💎</span> 每日配额任务
          </h2>
          {quotaInfo.remaining > 0 && (
            <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md font-semibold shadow-sm">
              今日可用: {quotaInfo.remaining}
            </span>
          )}
        </div>

        {/* 任务列表 */}
        <div className="space-y-2">
          {/* 发帖任务 */}
          {quotaInfo.progress.posts && ( // Conditional rendering
            <div className="p-2 rounded-lg bg-white/60 border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">📝 发布面试真题</span>
                  <span className="text-xs text-gray-500">
                    ({quotaInfo.progress.posts.current}/{quotaInfo.progress.posts.required})
                  </span>
                </div>
                {quotaInfo.progress.posts.current >= quotaInfo.progress.posts.required ? (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-md font-semibold border border-green-200">
                    ✅ 已完成
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-md font-semibold shadow-sm">
                    +{quotaInfo.progress.posts.reward} 配额
                  </span>
                )}
              </div>
              {quotaInfo.progress.posts.current < quotaInfo.progress.posts.required && (
                <div className="flex items-center gap-2">
                  <Progress value={postProgress} className="flex-1 h-1.5 bg-blue-100 max-w-[200px]">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${postProgress}%` }} />
                  </Progress>
                  <Button
                    onClick={() => router.push('/matches?tab=questions')}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2 border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                  >
                    去发布
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 评论任务 */}
          {quotaInfo.progress.comments && ( // Conditional rendering
            <div className="p-2 rounded-lg bg-white/60 border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">💬 评论真题</span>
                  <span className="text-xs text-gray-500">
                    ({quotaInfo.progress.comments.current}/{quotaInfo.progress.comments.required})
                  </span>
                </div>
                {quotaInfo.progress.comments.current >= quotaInfo.progress.comments.required ? (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-md font-semibold border border-green-200">
                    ✅ 已完成
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-md font-semibold shadow-sm">
                    +{quotaInfo.progress.comments.reward} 配额
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Progress value={commentProgress} className="flex-1 h-1.5 bg-blue-100 max-w-[200px]">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${commentProgress}%` }} />
                </Progress>
                <Button
                  onClick={() => router.push('/matches?tab=questions')}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2 border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                >
                  去评论
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 提示信息 */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 完成任务可获得额外配额，最多累积至6个
        </p>
      </CardContent>
    </Card>
  );
}
