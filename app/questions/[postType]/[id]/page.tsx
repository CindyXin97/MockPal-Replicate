'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoteButtons } from '@/components/vote-buttons';
import { CommentSection } from '@/components/comment-section';
import { toast } from 'sonner';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';

interface QuestionDetail {
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
  stats?: {
    upvotes: number;
    downvotes: number;
    score: number;
    comments: number;
    views: number;
  };
  userVote?: 'up' | 'down' | null;
  userName?: string | null;
  userEmail?: string | null;
  isAnonymous?: boolean;
  interviewDate?: string;
  createdAt?: string | Date;
}

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [language] = useAtom(languageAtom);

  const postType = params.postType as 'system' | 'user';
  const postId = params.id as string;
  
  const t = useMemo(() => {
    if (language === 'en') {
      return {
        fetchFailed: 'Failed to fetch question details',
        loadFailed: 'Failed to load, please try again later',
        questionNotFound: 'Question Not Found',
        questionNotFoundDesc: 'This question may have been deleted or does not exist',
        back: 'Back',
        backToLibrary: '← Back to Question Bank',
        myPost: 'My Post',
        userShared: 'User Shared',
        difficulty: {
          easy: 'Easy',
          medium: 'Medium',
          hard: 'Hard',
        },
        questionType: {
          technical: '🔧 Technical Interview',
          behavioral: '🧑‍🤝‍🧑 Behavioral Interview',
          case_study: '🧩 Case Study',
          stats: '📊 Statistics Question',
        },
        year: (y: number) => `📅 ${y}`,
        source: '📌 Source:',
        sharer: '👤 Shared by:',
        question: '📝 Question',
        recommendedAnswer: '💡 Recommended Answer',
        communityRating: '👥 Community Rating',
        discussion: '💬 Discussion',
      } as const;
    }
    return {
      fetchFailed: '获取题目详情失败',
      loadFailed: '加载失败，请稍后重试',
      questionNotFound: '题目不存在',
      questionNotFoundDesc: '该题目可能已被删除或不存在',
      back: '返回',
      backToLibrary: '← 返回题库',
      myPost: '我的发布',
      userShared: '用户分享',
      difficulty: {
        easy: '简单',
        medium: '中等',
        hard: '困难',
      },
      questionType: {
        technical: '🔧 技术面试',
        behavioral: '🧑‍🤝‍🧑 行为面试',
        case_study: '🧩 案例分析',
        stats: '📊 统计问题',
      },
      year: (y: number) => '📅 ' + y + '年',
      source: '📌 来源:',
      sharer: '👤 分享者:',
      question: '📝 问题',
      recommendedAnswer: '💡 推荐答案',
      communityRating: '👥 社区评价',
      discussion: '💬 讨论区',
    };
  }, [language]);

  useEffect(() => {
    fetchQuestionDetail();
  }, [postId, postType]);

  const fetchQuestionDetail = async () => {
    console.log('🟢 [前端] 开始刷新题目详情...');
    setLoading(true);
    try {
      const response = await fetch(
        `/api/question-detail?postType=${postType}&postId=${postId}`
      );
      const data = await response.json();
      console.log('🟢 [前端] 收到题目详情数据:', data);

      if (data.success) {
        console.log('🟢 [前端] 更新question状态:', data.data);
        console.log('🟢 [前端] 新的stats:', data.data.stats);
        setQuestion(data.data);
      } else {
        console.error('🟢 [前端] 获取失败:', data.message);
        toast.error(t.fetchFailed);
      }
    } catch (error) {
      console.error('🟢 [前端] 网络错误:', error);
      toast.error(t.loadFailed);
    } finally {
      setLoading(false);
      console.log('🟢 [前端] 刷新完成');
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    return t.questionType[type as keyof typeof t.questionType] || type;
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
    return t.difficulty[difficulty as keyof typeof t.difficulty] || difficulty;
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  if (!question) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">😕</div>
              <h2 className="text-xl font-semibold mb-2">{t.questionNotFound}</h2>
              <p className="text-gray-600 mb-6">{t.questionNotFoundDesc}</p>
              <Button onClick={() => router.back()}>{t.back}</Button>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => router.push('/matches?tab=questions')}
          className="mb-4"
        >
          {t.backToLibrary}
        </Button>

        {/* 题目详情卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {question.isOwnPost && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    {t.myPost}
                  </span>
                )}
                {question.postType === 'user' && !question.isOwnPost && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    {t.userShared}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                  {getDifficultyLabel(question.difficulty)}
                </span>
                <span className="text-sm text-gray-600">{getQuestionTypeLabel(question.questionType)}</span>
              </div>
            </div>

            <CardTitle className="text-2xl mb-2">
              {question.company} - {question.position}
            </CardTitle>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                {(() => {
                  // 优先使用创建时间的年份，如果没有则使用 year 字段
                  if (question.createdAt) {
                    const createdYear = new Date(question.createdAt).getFullYear();
                    return t.year(createdYear);
                  }
                  return t.year(question.year ?? 0);
                })()}
              </span>
              {question.source && <span>{t.source} {question.source}</span>}
              {question.postType === 'user' && !question.isAnonymous && question.userName && (
                <span>{t.sharer} {question.userName}</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 问题内容 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{t.question}</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {question.question}
                </p>
              </div>
            </div>

            {/* 推荐答案 */}
            {question.recommendedAnswer && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">{t.recommendedAnswer}</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {question.recommendedAnswer}
                  </p>
                </div>
              </div>
            )}

            {/* 点赞/踩 */}
            {question.stats && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">{t.communityRating}</h3>
                <VoteButtons
                  postType={question.postType}
                  postId={question.id}
                  initialUpvotes={question.stats.upvotes}
                  initialDownvotes={question.stats.downvotes}
                  initialUserVote={question.userVote || null}
                  onVoteChange={fetchQuestionDetail}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 评论区 */}
        {question.stats && (
          <Card>
            <CardHeader>
              <CardTitle>{t.discussion}</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection
                postType={question.postType}
                postId={question.id}
                commentsCount={question.stats.comments}
                defaultExpanded={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AuthLayout>
  );
}

