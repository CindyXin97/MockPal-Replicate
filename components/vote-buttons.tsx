'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface VoteButtonsProps {
  postType: 'system' | 'user';
  postId: number;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: 'up' | 'down' | null;
  onVoteChange?: () => void;
}

export function VoteButtons({
  postType,
  postId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  onVoteChange,
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote);
  const [loading, setLoading] = useState(false);
  
  // 当父组件传入新的初始值时，更新本地 state
  useEffect(() => {
    setUpvotes(initialUpvotes);
    setDownvotes(initialDownvotes);
    setUserVote(initialUserVote);
  }, [initialUpvotes, initialDownvotes, initialUserVote]);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (loading) return;

    console.log('🟢 [前端] 点击投票按钮:', { postType, postId, voteType });
    setLoading(true);

    try {
      console.log('🟢 [前端] 发送投票请求...');
      const response = await fetch('/api/interview-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postType,
          postId,
          voteType,
        }),
      });

      console.log('🟢 [前端] 收到响应:', response.status);
      const data = await response.json();
      console.log('🟢 [前端] 响应数据:', data);

      if (response.status === 401) {
        toast.error('请先登录后再投票');
        return;
      }

      if (data.success) {
        // 先显示成功提示
        if (data.action === 'removed') {
          toast.success('已取消投票');
        } else if (data.action === 'updated') {
          toast.success('投票已更新');
        } else {
          toast.success(voteType === 'up' ? '点赞成功' : '已标记');
        }

        // 延迟刷新，让toast动画完成，同时避免状态更新冲突
        setTimeout(() => {
          if (onVoteChange) {
            onVoteChange();
          }
        }, 100);
      } else {
        // 显示详细错误信息
        if (data.message?.includes('表') || data.message?.includes('table')) {
          toast.error('投票功能尚未启用，请联系管理员运行数据库迁移');
        } else {
          toast.error(data.message || '操作失败');
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* 点赞按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('up')}
        disabled={loading}
        className={`flex items-center space-x-1 transition-all ${
          loading 
            ? 'opacity-50 cursor-not-allowed'
            : userVote === 'up'
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        <span className="text-lg">{userVote === 'up' ? '👍' : '👍🏻'}</span>
        <span className="font-medium">{loading ? '...' : upvotes}</span>
      </Button>

      {/* 踩按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('down')}
        disabled={loading}
        className={`flex items-center space-x-1 transition-all ${
          loading 
            ? 'opacity-50 cursor-not-allowed'
            : userVote === 'down'
            ? 'text-red-600 bg-red-50'
            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
        }`}
      >
        <span className="text-lg">{userVote === 'down' ? '👎' : '👎🏻'}</span>
        <span className="font-medium">{loading ? '...' : downvotes}</span>
      </Button>

      {/* 分数显示 */}
      <div className="flex items-center text-sm text-gray-600">
        <span className="font-semibold">
          {loading ? '...' : (
            <>
              {upvotes - downvotes > 0 ? '+' : ''}
              {upvotes - downvotes}
            </>
          )}
        </span>
        <span className="ml-1">分</span>
      </div>
    </div>
  );
}

