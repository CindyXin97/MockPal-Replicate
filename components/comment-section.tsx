'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';

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
  const [language] = useAtom(languageAtom);
  
  const t = useMemo(() => {
    if (language === 'en') {
      return {
        comments: (count: number) => `${count} comments`,
        enterComment: 'Please enter comment content',
        commentTooLong: 'Comment content cannot exceed 1000 characters',
        publishSuccess: 'Comment published successfully!',
        publishFailed: 'Failed to publish comment',
        publishFailedRetry: 'Failed to publish comment, please try again later',
        justNow: 'just now',
        minutesAgo: (m: number) => `${m} minutes ago`,
        hoursAgo: (h: number) => `${h} hours ago`,
        daysAgo: (d: number) => `${d} days ago`,
        anonymousUser: 'Anonymous User',
        user: 'User',
        placeholder: 'Share your thoughts... (Use @username to mention others)',
        preview: 'Preview:',
        characters: (current: number, max: number) => `${current}/${max} characters`,
        publishing: 'Publishing...',
        publishComment: 'Publish Comment',
        loading: 'Loading...',
        noComments: 'No comments yet, be the first to comment!',
        date: (d: Date) => d.toLocaleDateString('en-US'),
      };
    }
    return {
      comments: (count: number) => `${count} 条评论`,
      enterComment: '请输入评论内容',
      commentTooLong: '评论内容不能超过1000字',
      publishSuccess: '评论发布成功！',
      publishFailed: '评论失败',
      publishFailedRetry: '评论失败，请稍后重试',
      justNow: '刚刚',
      minutesAgo: (m: number) => `${m}分钟前`,
      hoursAgo: (h: number) => `${h}小时前`,
      daysAgo: (d: number) => `${d}天前`,
      anonymousUser: '匿名用户',
      user: '用户',
      placeholder: '分享你的想法... (可使用 @用户名 提及他人)',
      preview: '预览：',
      characters: (current: number, max: number) => `${current}/${max} 字`,
      publishing: '发布中...',
      publishComment: '发布评论',
      loading: '加载中...',
      noComments: '暂无评论，快来发表第一条评论吧！',
      date: (d: Date) => d.toLocaleDateString('zh-CN'),
    };
  }, [language]);

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
      toast.error(t.enterComment);
      return;
    }

    if (newComment.length > 1000) {
      toast.error(t.commentTooLong);
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
        toast.success(t.publishSuccess);
        setNewComment('');
        fetchComments();
        // 通知配额卡片刷新数据
        window.dispatchEvent(new CustomEvent('quotaUpdated'));
      } else {
        toast.error(data.message || t.publishFailed);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(t.publishFailedRetry);
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

    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return t.minutesAgo(diffMins);
    if (diffHours < 24) return t.hoursAgo(diffHours);
    if (diffDays < 7) return t.daysAgo(diffDays);
    return t.date(date);
  };

  const getUserDisplay = (comment: Comment) => {
    if (comment.isAnonymous) {
      return t.anonymousUser;
    }
    return comment.userName || comment.userEmail?.split('@')[0] || t.user;
  };

  // 高亮显示 @用户名
  const highlightMentions = (text: string) => {
    // 匹配 @用户名 模式（用户名可以是中英文、数字、下划线）
    const mentionRegex = /@([\w\u4e00-\u9fa5]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // 添加普通文本（不加任何样式，保持原色）
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="text-gray-900">
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // 添加高亮的 @用户名（蓝色加粗）
      parts.push(
        <span 
          key={`mention-${match.index}`} 
          className="text-blue-600 font-semibold"
        >
          {match[0]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的文本（不加任何样式，保持原色）
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="text-gray-900">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
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
          💬 {t.comments(commentsCount)}
          <span className="ml-2">{showComments ? '▲' : '▼'}</span>
        </Button>
      </div>

      {showComments && (
        <div className="space-y-4">
          {/* 评论输入框 */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="relative">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t.placeholder}
                rows={3}
                className="resize-none"
                disabled={loading}
              />
              {/* 预览区域 - 显示带高亮的文本 */}
              {newComment && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">{t.preview}</div>
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {highlightMentions(newComment)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {t.characters(newComment.length, 1000)}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={loading || !newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? t.publishing : t.publishComment}
              </Button>
            </div>
          </form>

          {/* 评论列表 */}
          {loadingComments ? (
            <div className="text-center py-8 text-gray-500">{t.loading}</div>
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
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {highlightMentions(comment.content)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t.noComments}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

