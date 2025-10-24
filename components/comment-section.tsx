'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface Comment {
  id: number;
  userId: number;
  content: string;
  userName: string | null;
  userEmail: string | null;
  isAnonymous: boolean;
  createdAt: string;
  parentCommentId: number | null;
}

interface CommentSectionProps {
  postType: 'system' | 'user';
  postId: number;
  commentsCount: number;
  defaultExpanded?: boolean; // 是否默认展开
}

export function CommentSection({ postType, postId, commentsCount, defaultExpanded = false }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(defaultExpanded);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(
        `/api/interview-comments?postType=${postType}&postId=${postId}`
      );
      const data = await response.json();

      if (data.success) {
        setComments(data.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    if (newComment.length > 1000) {
      toast.error('评论内容不能超过1000字');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/interview-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postType,
          postId,
          content: newComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('评论发布成功！');
        setNewComment('');
        fetchComments();
        // 通知配额卡片刷新数据
        window.dispatchEvent(new CustomEvent('quotaUpdated'));
      } else {
        toast.error(data.message || '评论失败');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getUserDisplay = (comment: Comment) => {
    if (comment.isAnonymous) {
      return '匿名用户';
    }
    return comment.userName || comment.userEmail?.split('@')[0] || '用户';
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="text-gray-600 hover:text-gray-800"
        >
          💬 {commentsCount} 条评论
          <span className="ml-2">{showComments ? '▲' : '▼'}</span>
        </Button>
      </div>

      {showComments && (
        <div className="space-y-4">
          {/* 评论输入框 */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="分享你的想法..."
              rows={3}
              className="resize-none"
              disabled={loading}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {newComment.length}/1000 字
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={loading || !newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? '发布中...' : '发布评论'}
              </Button>
            </div>
          </form>

          {/* 评论列表 */}
          {loadingComments ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {getUserDisplay(comment).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-800">
                          {getUserDisplay(comment)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无评论，快来发表第一条评论吧！
            </div>
          )}
        </div>
      )}
    </div>
  );
}

