'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/base-layout';

interface UserStats {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  views: {
    total: number;
    today: number;
  };
  matching: {
    totalLikes: number;
    totalMatches: number;
    successfulMatches: number;
    pendingMatches: number;
  };
  interviews: {
    completed: number;
    experiencePoints: number;
    currentLevel: string;
  };
  community: {
    postsCount: number;
    commentsCount: number;
    votesGiven: number;
    votesReceived: number;
  };
  notifications: {
    unreadCount: number;
    recent: any[];
  };
}

export default function MePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      const data = await response.json();
      console.log('📊 API Response:', data);
      if (data.success) {
        console.log('✅ Stats Data:', {
          matching: data.data.matching,
          interviews: data.data.interviews,
        });
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (stats?.user.name) return stats.user.name;
    if (stats?.user.email) return stats.user.email.split('@')[0];
    return '用户';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // 计算到下一等级的进度
  const getNextLevelProgress = () => {
    const currentExp = stats.interviews.experiencePoints;
    const levelThresholds = [
      { name: '新用户', exp: 0 },
      { name: '面试新手', exp: 1 },
      { name: '面试新星', exp: 5 },
      { name: '面试达人', exp: 10 },
      { name: '面试导师', exp: 15 },
    ];

    // 找到当前等级和下一等级
    let currentLevel = levelThresholds[0];
    let nextLevel = levelThresholds[1];

    for (let i = 0; i < levelThresholds.length; i++) {
      if (currentExp >= levelThresholds[i].exp) {
        currentLevel = levelThresholds[i];
        nextLevel = levelThresholds[i + 1] || levelThresholds[i]; // 如果是最高级，下一级就是自己
      }
    }

    // 如果已经是最高等级
    if (currentLevel.name === '面试导师' && currentExp >= 15) {
      return {
        current: currentExp,
        next: 15,
        percentage: 100,
        nextLevelName: '满级',
        remaining: 0,
      };
    }

    // 计算进度
    const expInCurrentLevel = currentExp - currentLevel.exp;
    const expNeededForNextLevel = nextLevel.exp - currentLevel.exp;
    const percentage = Math.min((expInCurrentLevel / expNeededForNextLevel) * 100, 100);

    return {
      current: currentExp,
      next: nextLevel.exp,
      percentage: Math.round(percentage),
      nextLevelName: nextLevel.name,
      remaining: nextLevel.exp - currentExp,
    };
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

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!stats) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-lg text-gray-600">加载失败，请刷新页面重试</div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-5xl mx-auto space-y-3 pb-8">
        {/* 顶部用户信息卡片 */}
        <Card className="border-t-4 border-t-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fadeInDown">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg hover:scale-110 transition-transform duration-300">
                {getUserInitial()}
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold text-gray-900">{getUserDisplayName()}</h1>
                <p className="text-sm text-gray-600">{stats.user.email}</p>
                <div className="mt-0.5">
                  <span className="inline-block px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full font-medium hover:scale-105 transition-transform">
                    {stats.interviews.currentLevel}
                  </span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm h-7 px-2">
                <Link href="/profile">编辑资料</Link>
              </Button>
            </div>
            
            {/* 等级进度条 */}
            {(() => {
              const progress = getNextLevelProgress();
              return (
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      经验值 {progress.current} / {progress.next}
                    </span>
                    {progress.remaining > 0 ? (
                      <span className="text-blue-600 font-medium">
                        还需 {progress.remaining} 次升级到 {progress.nextLevelName}
                      </span>
                    ) : (
                      <span className="text-purple-600 font-medium">🎉 满级</span>
                    )}
                  </div>
                  <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-xs text-right text-gray-500">
                    {progress.percentage}% 完成
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* 统计数据卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* 浏览统计 */}
          <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fadeInUp border-l-4 border-l-blue-400">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg hover:scale-125 transition-transform inline-block">👥</span>
                    <span className="text-sm font-medium text-gray-700">互动人数</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 hover:scale-110 transition-transform inline-block">
                    {stats.views.totalInteractions ?? 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    我浏览 {stats.views.myViews ?? 0} · 访问我 {stats.views.viewsOfMe ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 匹配统计 */}
          <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fadeInUp border-l-4 border-l-purple-400" style={{ animationDelay: '0.1s' }}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 relative hover:scale-125 transition-transform">
                      <Image
                        src="/logo-icon.png"
                        alt="MockPal"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">匹配成功</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 hover:scale-110 transition-transform inline-block">
                    {stats.matching.successfulMatches}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    等待中 {stats.matching.pendingMatches} 人
                  </p>
                  {stats.matching.percentile !== undefined && stats.matching.percentile !== null ? (
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      🎯 超过 {stats.matching.percentile}% 的用户
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      开始匹配来获取排名！
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 面试统计 */}
          <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fadeInUp border-l-4 border-l-green-400" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg hover:scale-125 transition-transform inline-block">🎤</span>
                    <span className="text-sm font-medium text-gray-700">完成面试</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 hover:scale-110 transition-transform inline-block">
                    {stats.interviews.completed}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    经验值 {stats.interviews.experiencePoints}
                  </p>
                  {stats.interviews.percentile !== undefined && stats.interviews.percentile !== null ? (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      🎯 超过 {stats.interviews.percentile}% 的用户
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      完成面试来获取排名！
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 个人进步追踪卡片 */}
        <Card className="hover:shadow-xl transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
          <CardHeader className="pb-1 pt-2">
            <div>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <span className="text-lg hover:scale-125 transition-transform inline-block">📈</span>
                <span>我的活动</span>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">统计发帖、评论、被浏览数</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* 本周 vs 上周 */}
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 font-medium">本周活动</span>
                  {stats.activity && stats.activity.weekChange !== undefined && stats.activity.weekChange !== null && stats.activity.lastWeek !== 0 ? (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${
                      stats.activity.weekChange > 0 ? 'text-green-600' : 
                      stats.activity.weekChange < 0 ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {stats.activity.weekChange > 0 && '↗'}
                      {stats.activity.weekChange < 0 && '↘'}
                      {stats.activity.weekChange === 0 && '→'}
                      {stats.activity.weekChange > 0 ? '+' : ''}{stats.activity.weekChange}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <div className="text-xl font-bold text-blue-600">
                      {stats.activity?.thisWeek ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {stats.activity && (
                        <>
                          📝{stats.activity.thisWeekPosts ?? 0} 💬{stats.activity.thisWeekComments ?? 0} 👁️{stats.activity.thisWeekViews ?? 0}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </div>

              {/* 本月 vs 上月 */}
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 font-medium">本月活动</span>
                  {stats.activity && stats.activity.monthChange !== undefined && stats.activity.monthChange !== null && stats.activity.lastMonth !== 0 ? (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${
                      stats.activity.monthChange > 0 ? 'text-green-600' : 
                      stats.activity.monthChange < 0 ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {stats.activity.monthChange > 0 && '↗'}
                      {stats.activity.monthChange < 0 && '↘'}
                      {stats.activity.monthChange === 0 && '→'}
                      {stats.activity.monthChange > 0 ? '+' : ''}{stats.activity.monthChange}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <div className="text-xl font-bold text-purple-600">
                      {stats.activity?.thisMonth ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {stats.activity && (
                        <>
                          📝{stats.activity.thisMonthPosts ?? 0} 💬{stats.activity.thisMonthComments ?? 0} 👁️{stats.activity.thisMonthViews ?? 0}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-2xl">📅</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知卡片 */}
        <Card className="hover:shadow-xl transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5 text-base">
                <span className="text-lg hover:rotate-12 transition-transform inline-block">🔔</span>
                <span>消息</span>
                {stats.notifications.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                    {stats.notifications.unreadCount} 条未读
                  </span>
                )}
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="hover:bg-blue-50 transition-colors h-6 text-xs">
                <Link href="/me/notifications">查看全部</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.notifications.recent.length > 0 ? (
              <div className="space-y-1.5">
                {stats.notifications.recent.map((notification: any) => (
                  <Link
                    key={notification.id}
                    href={notification.link || '/me/notifications'}
                    className="block"
                  >
                    <div
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        notification.isRead
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-700' : 'text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </p>
                          {notification.content && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {notification.content}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                暂无通知
              </div>
            )}
          </CardContent>
        </Card>

        {/* 社区活动卡片 */}
        <Card className="hover:shadow-xl transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-1.5 text-base">
              <span className="text-lg hover:scale-125 transition-transform inline-block">📊</span>
              <span>我的活动</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Link
                href="/matches?tab=questions&filter=mine"
                className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 hover:scale-105 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-center">
                  <div className="text-lg mb-0.5 hover:scale-125 transition-transform inline-block">📝</div>
                  <div className="text-base font-bold text-blue-600">
                    {stats.community.postsCount}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">我发布的题目</div>
                </div>
              </Link>

              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="text-center">
                  <div className="text-lg mb-0.5 hover:scale-125 transition-transform inline-block">💬</div>
                  <div className="text-base font-bold text-purple-600">
                    {stats.community.commentsCount}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">我的评论</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="text-center">
                  <div className="text-lg mb-0.5 hover:scale-125 transition-transform inline-block">👍</div>
                  <div className="text-base font-bold text-green-600">
                    {stats.community.votesGiven}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">我赞过的</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="text-center">
                  <div className="text-lg mb-0.5 hover:scale-125 transition-transform inline-block">🔥</div>
                  <div className="text-base font-bold text-orange-600">
                    {stats.community.votesReceived}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">收到的赞</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

