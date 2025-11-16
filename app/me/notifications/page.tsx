'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/base-layout';
import { toast } from 'sonner';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';

interface Notification {
  id: number;
  type: string;
  actorName: string | null;
  title: string;
  content: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [language] = useAtom(languageAtom);
  const t = useMemo(() => {
    if (language === 'en') {
      return {
        title: 'My Notifications',
        unreadTip: (n: number) => `${n} unread`,
        back: 'Back',
        markAll: 'Mark all as read',
        all: 'All',
        unread: 'Unread',
        loading: 'Loading...',
        empty: 'No notifications',
        emptyUnread: 'No unread notifications',
        // relative time
        justNow: 'just now',
        minutesAgo: (m: number) => `${m} minutes ago`,
        hoursAgo: (h: number) => `${h} hours ago`,
        daysAgo: (d: number) => `${d} days ago`,
      } as const;
    }
    return {
      title: '我的通知',
      unreadTip: (n: number) => `有 ${n} 条未读通知`,
      back: '返回',
      markAll: '全部标记为已读',
      all: '全部',
      unread: '未读',
      loading: '加载中...',
      empty: '暂无通知',
      emptyUnread: '暂无未读通知',
      justNow: '刚刚',
      minutesAgo: (m: number) => `${m}分钟前`,
      hoursAgo: (h: number) => `${h}小时前`,
      daysAgo: (d: number) => `${d}天前`,
    } as const;
  }, [language]);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const url = `/api/user/notifications?${filter === 'unread' ? 'unread_only=true&' : ''}limit=50`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
      toast.error(language === 'en' ? 'Failed to fetch notifications' : '获取通知失败');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId,
        }),
      });

      if (response.ok) {
        // 更新本地状态
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
        }),
      });

      if (response.ok) {
        toast.success(language === 'en' ? 'All marked as read' : '已全部标记为已读');
        fetchNotifications();
      }
    } catch (error) {
      console.error('标记全部已读失败:', error);
      toast.error(language === 'en' ? 'Operation failed' : '操作失败');
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
    return language === 'en'
      ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // 关键词替换（渲染时语言级映射，不改后端数据）
  const translateText = (text: string | null | undefined) => {
    if (!text) return '';
    if (language !== 'en') return text;
    // 常见通知标题/内容关键词替换（仅在英文时）
    const replacements: Array<[RegExp, string]> = [
      [/在评论中提到了你/g, 'mentioned you in a comment'],
      [/回复了你/g, 'replied to you'],
      [/新的?评论/g, 'new comment'],
      [/匹配成功/g, 'match success'],
      [/点赞了你/g, 'liked you'],
    ];
    let out = text;
    for (const [pattern, repl] of replacements) {
      out = out.replace(pattern, repl);
    }
    // 处理我们之前加的双语模板“EN / 中文”——保留 EN 前半部分
    if (out.includes(' / ')) {
      out = out.split(' / ')[0];
    }
    return out;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment_reply':
        return '💬';
      case 'comment_mention':
        return '📢';
      case 'post_comment':
        return '✍️';
      case 'vote_up':
        return '👍';
      case 'match_success':
        return '💝';
      default:
        return '🔔';
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {language === 'en' ? t.unreadTip(unreadCount) : t.unreadTip(unreadCount)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/me">
              <Button variant="outline" size="sm">
                {t.back}
              </Button>
            </Link>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} size="sm" variant="outline">
                {t.markAll}
              </Button>
            )}
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            {t.all}
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            {t.unread} {unreadCount > 0 && `(${unreadCount})`}
          </Button>
        </div>

        {/* 通知列表 */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-500">{t.loading}</div>
            ) : notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      notification.isRead ? 'bg-white' : 'bg-blue-50'
                    } hover:bg-gray-50`}
                  >
                    <Link
                      href={notification.link || '/me/notifications'}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                      className="block"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-2xl mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              notification.isRead ? 'text-gray-700' : 'text-gray-900'
                            }`}
                          >
                            {translateText(notification.title)}
                          </p>
                          {notification.content && (
                            <p className="text-sm text-gray-600 mt-1">
                              {translateText(notification.content)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="flex-shrink-0">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {filter === 'unread' ? t.emptyUnread : t.empty}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

