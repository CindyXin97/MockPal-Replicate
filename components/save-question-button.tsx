'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bookmark } from 'lucide-react';

interface SaveQuestionButtonProps {
  questionId: number;
  questionType: 'system' | 'user';
  isSaved?: boolean;
  onSaveChange?: (saved: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function SaveQuestionButton({
  questionId,
  questionType,
  isSaved: initialSaved = false,
  onSaveChange,
  variant = 'ghost',
  size = 'sm',
  showText = true,
}: SaveQuestionButtonProps) {
  const { data: session, status } = useSession();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发父元素的点击事件

    if (status === 'unauthenticated') {
      toast.error('请先登录');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isSaved) {
        // 取消收藏
        const response = await fetch(
          `/api/saved-questions?questionType=${questionType}&questionId=${questionId}`,
          {
            method: 'DELETE',
          }
        );

        // 检查响应是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('API 返回非 JSON 响应:', await response.text());
          toast.error('服务器响应错误，请刷新页面后重试');
          return;
        }

        const data = await response.json();

        if (data.success) {
          setIsSaved(false);
          onSaveChange?.(false);
          toast.success('已取消收藏');
        } else {
          toast.error(data.message || '取消收藏失败');
        }
      } else {
        // 收藏
        const response = await fetch('/api/saved-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionType,
            questionId,
          }),
        });

        // 检查响应是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('API 返回非 JSON 响应:', await response.text());
          toast.error('服务器响应错误，请刷新页面后重试');
          return;
        }

        const data = await response.json();

        if (data.success) {
          setIsSaved(true);
          onSaveChange?.(true);
          toast.success('收藏成功');
        } else {
          toast.error(data.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      if (error instanceof SyntaxError) {
        toast.error('数据格式错误，请刷新页面后重试');
      } else {
        toast.error('操作失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleSave}
      disabled={isLoading || status === 'loading'}
      className={`flex items-center gap-1 ${
        isSaved
          ? 'text-yellow-600 hover:text-yellow-700'
          : 'text-gray-600 hover:text-gray-700'
      }`}
    >
      <Bookmark
        className={`h-4 w-4 ${isSaved ? 'fill-yellow-600' : ''}`}
      />
      {showText && (
        <span className="text-sm">
          {isSaved ? '已收藏' : '收藏'}
        </span>
      )}
    </Button>
  );
}

