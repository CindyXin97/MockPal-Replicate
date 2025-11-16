'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SaveQuestionButton } from '@/components/save-question-button';
import { toast } from 'sonner';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';

interface QuestionInLibrary {
  id: number;
  company: string;
  position: string;
  questionType: string;
  difficulty: string;
  question: string;
  recommendedAnswer?: string;
  source?: string;
  year: number;
  postType: 'system' | 'user';
  isOwnPost: boolean;
  savedAt: string;
  stats?: {
    upvotes: number;
    downvotes: number;
    score: number;
    comments: number;
    views: number;
  };
  userVote?: 'up' | 'down' | null;
  userEmail?: string | null;
  isAnonymous?: boolean;
  interviewDate?: string;
}

export default function MyLibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [language] = useAtom(languageAtom);
  const t = useMemo(() => {
    if (language === 'en') {
      return {
        title: 'My Library 📚',
        subtitle: 'Manage your saved interview questions',
        statsTotal: 'Total',
        statsSystem: 'Curated',
        statsUser: 'User posts',
        filters: 'Filters',
        typeLabel: 'Type',
        typeAll: 'All',
        typeSystem: 'Curated',
        typeUser: 'User posts',
        companyLabel: 'Company',
        companyAll: 'All companies',
        difficultyLabel: 'Difficulty',
        difficultyAll: 'All difficulties',
        qTitle: '📝 Question:',
        savedAtPrefix: 'Saved ',
        emptyTitle: 'No saved questions yet',
        emptyDesc: 'Find interesting questions in the Questions tab and save them to your library!',
        browseQuestions: 'Browse Questions',
        typeMap: {
          technical: '🔧 Technical',
          behavioral: '🧑‍🤝‍🧑 Behavioral',
          case_study: '🧩 Case study',
          stats: '📊 Statistics',
        } as Record<string, string>,
        difficultyMap: { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as Record<string, string>,
        time: {
          today: 'today',
          yesterday: 'yesterday',
          daysAgo: (d: number) => `${d} days ago`,
          weeksAgo: (w: number) => `${w} weeks ago`,
          monthsAgo: (m: number) => `${m} months ago`,
          yearsAgo: (y: number) => `${y} years ago`,
        },
      };
    }
    return {
      title: '我的题库 📚',
      subtitle: '管理你收藏的面试题目',
      statsTotal: '总计',
      statsSystem: '系统精选',
      statsUser: '用户分享',
      filters: '筛选条件',
      typeLabel: '题目类型',
      typeAll: '全部类型',
      typeSystem: '系统精选',
      typeUser: '用户分享',
      companyLabel: '公司',
      companyAll: '全部公司',
      difficultyLabel: '难度',
      difficultyAll: '全部难度',
      qTitle: '📝 问题：',
      savedAtPrefix: '收藏于 ',
      emptyTitle: '还没有收藏任何题目',
      emptyDesc: '在真题列表中找到感兴趣的题目，点击收藏按钮添加到你的题库吧！',
      browseQuestions: '浏览真题',
      typeMap: {
        technical: '🔧 技术面试',
        behavioral: '🧑‍🤝‍🧑 行为面试',
        case_study: '🧩 案例分析',
        stats: '📊 统计问题',
      } as Record<string, string>,
      difficultyMap: { easy: '简单', medium: '中等', hard: '困难' } as Record<string, string>,
      time: {
        today: '今天',
        yesterday: '昨天',
        daysAgo: (d: number) => `${d}天前`,
        weeksAgo: (w: number) => `${w}周前`,
        monthsAgo: (m: number) => `${m}个月前`,
        yearsAgo: (y: number) => `${y}年前`,
      },
    };
  }, [language]);
  const [questions, setQuestions] = useState<QuestionInLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    questionType: 'all',
    company: 'all',
    difficulty: 'all',
  });
  const [filterOptions, setFilterOptions] = useState({
    companies: [] as string[],
    questionTypes: ['technical', 'behavioral', 'case_study', 'stats'],
    difficulties: ['easy', 'medium', 'hard'],
  });
  const [stats, setStats] = useState({
    total: 0,
    systemCount: 0,
    userCount: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    if (status === 'authenticated') {
      fetchSavedQuestions();
    }
  }, [status, filters]);

  const fetchSavedQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        questionType: filters.questionType,
        company: filters.company,
        difficulty: filters.difficulty,
      });

      const response = await fetch(`/api/saved-questions?${params}`);
      
      // 检查响应是否为 JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API 返回非 JSON 响应，状态码:', response.status);
        const text = await response.text();
        console.error('响应内容:', text.substring(0, 200));
        toast.error('服务器响应错误，请刷新页面后重试');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions);
        setFilterOptions(data.data.filters);
        setStats(data.data.stats);
      } else {
        toast.error(data.message || '获取收藏列表失败');
      }
    } catch (error) {
      console.error('Error fetching saved questions:', error);
      if (error instanceof SyntaxError) {
        toast.error('数据格式错误，请刷新页面后重试');
      } else {
        toast.error('获取收藏列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleQuestionClick = (question: QuestionInLibrary) => {
    router.push(`/questions/${question.postType}/${question.id}`);
  };

  const getQuestionTypeLabel = (type: string) => {
    return t.typeMap[type] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      easy: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      hard: 'text-red-600 bg-red-50'
    };
    return colorMap[difficulty] || 'text-gray-600 bg-gray-50';
  };

  const getDifficultyLabel = (difficulty: string) => {
    return t.difficultyMap[difficulty] || difficulty;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return t.time.today;
    if (days === 1) return t.time.yesterday;
    if (days < 7) return t.time.daysAgo(days);
    if (days < 30) return t.time.weeksAgo(Math.floor(days / 7));
    if (days < 365) return t.time.monthsAgo(Math.floor(days / 30));
    return t.time.yearsAgo(Math.floor(days / 365));
  };

  if (status === 'loading') {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">{t.title}</h1>
          <p className="text-base sm:text-lg text-gray-600">{t.subtitle}</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.statsTotal}</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="text-4xl">📚</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.statsSystem}</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.systemCount}</p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.statsUser}</p>
                  <p className="text-3xl font-bold text-green-600">{stats.userCount}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t.filters}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.typeLabel}</label>
                <select
                  value={filters.questionType}
                  onChange={(e) => handleFilterChange('questionType', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">{t.typeAll}</option>
                  <option value="system">{t.typeSystem}</option>
                  <option value="user">{t.typeUser}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.companyLabel}</label>
                <select
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">{t.companyAll}</option>
                  {filterOptions.companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.difficultyLabel}</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">{t.difficultyAll}</option>
                  {filterOptions.difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{getDifficultyLabel(difficulty)}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 题目列表 */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((question) => (
              <Card 
                key={`${question.postType}-${question.id}`} 
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleQuestionClick(question)}
              >
                <CardContent className="p-6">
                  {/* 标题栏 */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {question.postType === 'system' ? (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          🏆 系统精选
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                          👥 用户分享
                        </span>
                      )}
                      <span className="font-semibold text-blue-600">{question.company}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600">{question.position}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">{question.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SaveQuestionButton
                        questionId={question.id}
                        questionType={question.postType}
                        isSaved={true}
                        onSaveChange={(saved) => {
                          if (!saved) {
                            // 从列表中移除
                            setQuestions(prev => 
                              prev.filter(q => 
                                !(q.id === question.id && q.postType === question.postType)
                              )
                            );
                            setStats(prev => ({
                              ...prev,
                              total: prev.total - 1,
                              systemCount: question.postType === 'system' ? prev.systemCount - 1 : prev.systemCount,
                              userCount: question.postType === 'user' ? prev.userCount - 1 : prev.userCount,
                            }));
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        showText={false}
                      />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyLabel(question.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500">{getQuestionTypeLabel(question.questionType)}</span>
                    </div>
                  </div>
                  
                  {/* 问题内容预览 */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-2">{t.qTitle}</h3>
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {question.question}
                    </p>
                  </div>

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t">
                    <div className="flex items-center gap-4">
                      {question.stats && (
                        <>
                          <span className="flex items-center gap-1">
                            👍 {question.stats.upvotes}
                          </span>
                          <span className="flex items-center gap-1">
                            💬 {question.stats.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            👁 {question.stats.views}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {t.savedAtPrefix}{formatDate(question.savedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">{t.emptyTitle}</h3>
              <p className="text-gray-600 mb-6">
                {t.emptyDesc}
              </p>
              <Button
                onClick={() => router.push('/matches?tab=questions')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t.browseQuestions}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthLayout>
  );
}

