'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoteButtons } from '@/components/vote-buttons';
import { CommentSection } from '@/components/comment-section';
import { toast } from 'sonner';

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
}

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const postType = params.postType as 'system' | 'user';
  const postId = params.id as string;

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
        toast.error('获取题目详情失败');
      }
    } catch (error) {
      console.error('🟢 [前端] 网络错误:', error);
      toast.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
      console.log('🟢 [前端] 刷新完成');
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      technical: '🔧 技术面试',
      behavioral: '🧑‍🤝‍🧑 行为面试',
      case_study: '🧩 案例分析',
      stats: '📊 统计问题'
    };
    return typeMap[type] || type;
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
    const labelMap: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    };
    return labelMap[difficulty] || difficulty;
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
              <h2 className="text-xl font-semibold mb-2">题目不存在</h2>
              <p className="text-gray-600 mb-6">该题目可能已被删除或不存在</p>
              <Button onClick={() => router.back()}>返回</Button>
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
          ← 返回题库
        </Button>

        {/* 题目详情卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {question.isOwnPost && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    我的发布
                  </span>
                )}
                {question.postType === 'user' && !question.isOwnPost && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    用户分享
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
              <span>📅 {question.year}年</span>
              {question.source && <span>📌 来源: {question.source}</span>}
              {question.postType === 'user' && !question.isAnonymous && question.userName && (
                <span>👤 分享者: {question.userName}</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 问题内容 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">📝 问题</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {question.question}
                </p>
              </div>
            </div>

            {/* 推荐答案 */}
            {question.recommendedAnswer && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">💡 推荐答案</h3>
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
                <h3 className="text-lg font-semibold mb-4 text-gray-800">👥 社区评价</h3>
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
              <CardTitle>💬 讨论区</CardTitle>
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

