'use client';

import { useState, useEffect, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { potentialMatchesAtom, currentMatchIndexAtom } from '@/lib/store';
import { AuthLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { ContactTemplates } from '@/components/contact-templates';
import { fetchPotentialMatches, likeUser, dislikeUser, fetchSuccessfulMatches } from '@/app/actions/matching';
import { useProfile } from '@/lib/useProfile';
import type { Match } from '@/lib/store';
import { matchesReducer, initialMatchesState, type MatchesAction } from '@/lib/matches-reducer';
import React from 'react';
import '@/styles/success.css';
import { FeedbackModal } from '@/components/feedback-modal';
import { MatchStatusCard } from '@/components/match-status-card';
import { FirstMatchModal } from '@/components/first-match-modal';


import { PostQuestionModal } from '@/components/post-question-modal';

// 面试真题类型定义
interface InterviewQuestion {
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

// 面试真题组件
const InterviewQuestionsTab = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [filters, setFilters] = useState({
    company: 'all',
    position: 'all',
    questionType: 'all',
    difficulty: 'all',
    year: 'all',
    source: 'all' // 新增：来源筛选（all/system/user/mine）
  });
  const [filterOptions, setFilterOptions] = useState({
    companies: [] as string[],
    positions: [] as string[],
    years: [] as number[],
    questionTypes: ['technical', 'behavioral', 'case_study', 'stats'],
    difficulties: ['easy', 'medium', 'hard']
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    fetchQuestions();
  }, [filters, pagination.page]);

  // 前端筛选：根据来源过滤题目
  const filteredQuestions = useMemo(() => {
    if (filters.source === 'all') {
      return questions;
    }

    return questions.filter(question => {
      if (filters.source === 'mine') {
        // 我的发布：只显示当前用户发布的
        return question.isOwnPost;
      } else if (filters.source === 'user') {
        // 用户分享：只显示其他用户发布的（不包括自己的）
        return question.postType === 'user' && !question.isOwnPost;
      } else if (filters.source === 'system') {
        // 系统精选：只显示系统题目
        return question.postType === 'system';
      }
      return true;
    });
  }, [questions, filters.source]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        includeUserPosts: 'true', // 启用用户发帖功能
      });

      const response = await fetch(`/api/interview-questions?${params}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions);
        setPagination(data.data.pagination);
        setFilterOptions(data.data.filters);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleQuestionClick = (question: InterviewQuestion) => {
    // 跳转到题目详情页
    router.push(`/questions/${question.postType}/${question.id}`);
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

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* 页面标题和发帖按钮 */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">真题分享 📝</h1>
          <p className="text-base sm:text-lg text-gray-600">分享你的面试经历，看看大家有没有更好的想法吧？</p>
        </div>
        <Button
          onClick={() => setShowPostModal(true)}
          className="bg-white hover:bg-blue-50 border-2 border-blue-600 text-blue-600 font-medium px-6 py-2 flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md transition-all"
        >
          <Image
            src="/logo-icon.png"
            alt="MockPal"
            width={20}
            height={20}
            className="rounded"
          />
                  分享我的面试经历
        </Button>
      </div>

      {/* 发帖弹窗 */}
      <PostQuestionModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={fetchQuestions}
        filterOptions={{
          companies: filterOptions.companies,
          positions: filterOptions.positions,
        }}
      />

      {/* 筛选器 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* 来源筛选 - 放在第一个，最重要 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📌 来源</label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm font-medium"
              >
                <option value="all">全部来源</option>
                <option value="system">🏆 系统精选</option>
                <option value="user">👥 用户分享</option>
                <option value="mine">📝 我的发布</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
              <select
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部公司</option>
                {filterOptions.companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
              <select
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部职位</option>
                {filterOptions.positions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">题目类型</label>
              <select
                value={filters.questionType}
                onChange={(e) => handleFilterChange('questionType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部类型</option>
                {filterOptions.questionTypes.map(type => (
                  <option key={type} value={type}>{getQuestionTypeLabel(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部难度</option>
                {filterOptions.difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{getDifficultyLabel(difficulty)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部年份</option>
                {filterOptions.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 题目列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuestions.length > 0 ? (
        <>
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <Card 
                key={`${question.postType}-${question.id}`} 
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleQuestionClick(question)}
              >
                <CardContent className="p-6">
                  {/* 标题栏 - 公司、岗位、年份等基本信息 */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 来源标签 - 优先显示 */}
                      {question.isOwnPost ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          📝 我的发布
                        </span>
                      ) : question.postType === 'user' ? (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          👥 用户分享
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          🏆 系统精选
                        </span>
                      )}
                      <span className="font-semibold text-blue-600">{question.company}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600">{question.position}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">{question.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyLabel(question.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500">{getQuestionTypeLabel(question.questionType)}</span>
                    </div>
                  </div>
                  
                  {/* 问题内容预览 */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-2">📝 问题：</h3>
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {question.question}
                    </p>
                  </div>

                  {/* 来源信息 */}
                  {question.source && (
                    <div className="text-xs text-gray-500 mb-3">
                      来源：{question.source}
                    </div>
                  )}

                  {/* 用户信息（如果是用户发布的） */}
                  {question.postType === 'user' && !question.isAnonymous && question.userName && (
                    <div className="text-xs text-gray-500 mb-3">
                      分享者：{question.userName}
                    </div>
                  )}

                  {/* 统计信息 */}
                  {question.stats && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t">
                      <span className="flex items-center gap-1">
                        👍 {question.stats.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        👎 {question.stats.downvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {question.stats.comments} 条评论
                      </span>
                      <span className="ml-auto text-blue-500 font-medium">
                        点击查看详情 →
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600">
                  第 {pagination.page} 页，共 {pagination.totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">暂无相关题目</h3>
              <p className="text-gray-600">请调整筛选条件或稍后再试</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 面经需求收集 */}
      <div className="mt-8">
        <RequestInterviewExperienceCard />
      </div>
    </div>
  );
};

// 面经需求收集组件
const RequestInterviewExperienceCard = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.position.trim()) {
      toast.error('请填写公司和职位信息');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/interview-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('需求提交成功！我们会尽快收集相关面经');
        setFormData({ company: '', position: '', message: '' });
        setShowForm(false);
      } else {
        throw new Error('提交失败');
      }
    } catch (error) {
      toast.error('提交失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto bg-blue-50 border-blue-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">想看更多面经？</h3>
              <p className="text-gray-600 text-sm">告诉我们你希望看到哪些公司和岗位的面试题目</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            size="sm"
            className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            {showForm ? '收起' : '提需求'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-blue-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公司名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="如：Google, Meta, 字节跳动..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  职位名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="如：数据科学家, 产品分析师..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                补充说明 <span className="text-gray-500">(可选)</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="如：希望看到2025年最新的面试题目，或者特定的面试类型..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {submitting ? '提交中...' : '提交需求'}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span className="text-green-500">✓</span>
            <span>已收集 16+ 公司</span>
          </div>
                                  <div className="flex items-center gap-1">
                  <span className="text-green-500">✓</span>
                  <span>62+ 道真题</span>
                </div>
          <div className="flex items-center gap-1">
            <span className="text-blue-500">🔥</span>
            <span>2025年最新</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-purple-500">📚</span>
            <span>一亩三分地</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MatchesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // 使用useMemo缓存user对象，避免每次渲染创建新对象
  const user = useMemo(() => {
    if (!session?.user?.id) return null;
    const userId = parseInt(session.user.id);
    // 确保ID是有效的正整数
    if (isNaN(userId) || userId <= 0) return null;
    return {
      id: userId,
      username: session.user.name || session.user.email || 'User'
    };
  }, [session?.user?.id, session?.user?.name, session?.user?.email]);

  // 使用简单的profile hook
  const { profile, isComplete } = useProfile(user?.id);

  // 使用reducer简化状态管理
  const [state, dispatch] = useReducer(matchesReducer, initialMatchesState);
  
  // 检查 URL 参数，支持从详情页返回到指定标签
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'questions') {
        dispatch({ type: 'SET_TAB', payload: 'questions' });
      }
    }
  }, []);
  
  // 保持Jotai原子状态同步（用于全局状态共享）
  const [, setPotentialMatches] = useAtom(potentialMatchesAtom);
  const [, setCurrentMatchIndex] = useAtom(currentMatchIndexAtom);

  // 移除硬绑定反馈相关状态 - 现在使用渐进式反馈系统
  // const [pendingFeedback, setPendingFeedback] = useState(null);
  // const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // 新增：localStorage键名生成函数
  const getStorageKey = (matchId: number, field: string) => {
    return `mockpal_feedback_${user?.id}_${matchId}_${field}`;
  };

  // 新增：保存表单数据到localStorage
  const saveToLocalStorage = (matchId: number, field: string, value: string) => {
    if (!user?.id) return;
    try {
      localStorage.setItem(getStorageKey(matchId, field), value);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  // 新增：从localStorage加载表单数据
  const loadFromLocalStorage = (matchId: number, field: string): string => {
    if (!user?.id) return '';
    try {
      return localStorage.getItem(getStorageKey(matchId, field)) || '';
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return '';
    }
  };

  // 新增：清除localStorage中的表单数据
  const clearFromLocalStorage = (matchId: number) => {
    if (!user?.id) return;
    try {
      localStorage.removeItem(getStorageKey(matchId, 'contactStatus'));
      localStorage.removeItem(getStorageKey(matchId, 'interviewStatus'));
      localStorage.removeItem(getStorageKey(matchId, 'feedback'));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  };

  // 新增：恢复表单数据（只恢复未提交的数据）
  const restoreFormData = (matches: Match[]) => {
    if (!user?.id) return;
    
    matches.forEach(match => {
      const matchId = match.matchId || match.id; // 使用正确的matchId
      
      // 如果已经有服务器数据（已提交的反馈），则不恢复localStorage
      if (match.feedback?.content) {
        // 清除localStorage中的旧数据，避免冲突
        clearFromLocalStorage(matchId);
        console.log('已有反馈数据，清除localStorage:', matchId);
        return;
      }
      
      // 只对未提交的匹配恢复localStorage数据
      console.log('恢复localStorage数据:', matchId);
      
      // 恢复联系状态
      const savedContactStatus = loadFromLocalStorage(matchId, 'contactStatus');
      if (savedContactStatus && (savedContactStatus === 'yes' || savedContactStatus === 'no')) {
        dispatch({ 
          type: 'SET_CONTACT_STATUS', 
          payload: { matchId, status: savedContactStatus as 'yes' | 'no' } 
        });
        console.log('恢复联系状态:', matchId, savedContactStatus);
      }
      
      // 恢复面试状态
      const savedInterviewStatus = loadFromLocalStorage(matchId, 'interviewStatus');
      if (savedInterviewStatus && (savedInterviewStatus === 'yes' || savedInterviewStatus === 'no')) {
        dispatch({ 
          type: 'SET_INTERVIEW_STATUS', 
          payload: { matchId, status: savedInterviewStatus as 'yes' | 'no' } 
        });
        console.log('恢复面试状态:', matchId, savedInterviewStatus);
      }
      
      // 恢复反馈内容
      const savedFeedback = loadFromLocalStorage(matchId, 'feedback');
      if (savedFeedback) {
        dispatch({ 
          type: 'SET_FEEDBACK', 
          payload: { matchId, feedback: savedFeedback } 
        });
        console.log('恢复反馈内容:', matchId, savedFeedback);
      }
    });
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }
    if (user && user.id > 0) {
      // 只有profile完整时才加载匹配数据
      if (isComplete) {
        loadMatches();
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [user?.id, status, isComplete]);

  // 移除成功匹配页面的弹窗触发 - 只在匹配瞬间弹出

  // 移除硬绑定反馈检查 - 现在使用渐进式反馈系统
  // const checkPendingFeedback = async () => { ... };

  const loadMatches = async () => {
    if (!user) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // 直接加载匹配数据，不再检查待反馈匹配
      // Load potential matches
      const potentialResult = await fetchPotentialMatches(user.id);
      // Load successful matches
      const successfulResult = await fetchSuccessfulMatches(user.id);
      
      // 安全地处理potentialMatches数据
      let potentialMatches: any[] = [];
      if (potentialResult.success && 'matches' in potentialResult && Array.isArray(potentialResult.matches)) {
        potentialMatches = potentialResult.matches;
      }
      
      // 安全地处理successfulMatches数据
      let successfulMatches: Match[] = [];
      if (successfulResult.success && 'matches' in successfulResult && Array.isArray(successfulResult.matches)) {
        successfulMatches = successfulResult.matches.filter(match => match !== null) as Match[];
      }
        
      // 使用dispatch更新所有状态
      dispatch({ type: 'LOAD_MATCHES', payload: { potentialMatches, successfulMatches } });
      
      // 初始化反馈状态 - 从服务器数据恢复已有的反馈
      successfulMatches.forEach(match => {
        const matchId = match.matchId || match.id; // 使用matchId进行状态管理
        
        // 确定联系状态（基于contactStatus字段）
        let contactStatus: string | undefined;
        if (match.contactStatus && match.contactStatus !== 'not_contacted') {
          contactStatus = 'yes';
        }
        
        // 总是初始化基本状态
        dispatch({ 
          type: 'INITIALIZE_FEEDBACK_FROM_DATA', 
          payload: { 
            matchId: matchId,
            contactStatus,
            interviewStatus: match.feedback?.interviewStatus,
            feedbackContent: match.feedback?.content || undefined,
          } 
        });
        
        // 如果有反馈数据，打印日志用于调试
        if (match.feedback?.content) {
          console.log('初始化反馈数据:', {
            matchId: matchId,
            userId: match.id,
            feedback: match.feedback
          });
        }
      });
      
      // 同步到Jotai全局状态
      setPotentialMatches(potentialMatches);
      setCurrentMatchIndex(0);
      
      // 加载所有用户的成就数据
      const allUserIds = [...potentialMatches, ...successfulMatches].map(match => match.id);
      if (allUserIds.length > 0) {
        loadUserAchievements(allUserIds);
      }

      // 恢复localStorage中的表单数据（对于未提交的反馈）
      setTimeout(() => {
        restoreFormData(successfulMatches);
      }, 100);
      
      if (potentialResult.message) {
        toast.error(potentialResult.message);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('获取匹配失败，请稍后再试');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 加载用户成就数据
  const loadUserAchievements = async (userIds: number[]) => {
    try {
      const response = await fetch(`/api/achievements?userIds=${userIds.join(',')}`);
      const data = await response.json();
      
      if (data.success) {
        const achievementMap: { [userId: number]: any } = {};
        data.achievements.forEach((achievement: any) => {
          achievementMap[achievement.userId] = achievement;
        });
        setUserAchievements(achievementMap);
      }
    } catch (error) {
      console.error('Error loading user achievements:', error);
    }
  };

  const handleLike = async () => {
    if (!user || state.potentialMatches.length === 0 || state.currentMatchIndex >= state.potentialMatches.length) {
      return;
    }

    const targetUser = state.potentialMatches[state.currentMatchIndex];
    
    // 先切换到下一个人（无论什么情况都要跳转）
    const nextIndex = state.currentMatchIndex + 1;
    dispatch({ type: 'NEXT_MATCH' });
    setCurrentMatchIndex(nextIndex);
    
    try {
      const result = await likeUser(user.id, targetUser.id);
      
      if (result.success) {
        if ('match' in result && result.match) {
          // 匹配成功：检查是否是首次匹配
          const hasShownFirstMatch = localStorage.getItem('mockpal_first_match_shown');
          
          if (!hasShownFirstMatch) {
            // 首次匹配：显示弹窗
            setFirstMatchPartner(targetUser.username || '新伙伴');
            setShowFirstMatchModal(true);
            localStorage.setItem('mockpal_first_match_shown', 'true');
          } else {
            // 非首次匹配：显示toast
            toast.success('匹配成功！🎉 请到成功匹配页面查看');
          }
          
          const successfulResult = await fetchSuccessfulMatches(user.id);
          // 只更新成功匹配列表，不影响当前索引
          if (successfulResult.success && 'matches' in successfulResult && Array.isArray(successfulResult.matches)) {
            const filteredMatches = successfulResult.matches.filter(match => match !== null) as Match[];
            dispatch({ 
              type: 'UPDATE_SUCCESSFUL_MATCHES', 
              payload: { successfulMatches: filteredMatches } 
            });
          }
        } else {
          toast.success(result.message || '已收到你的喜欢！');
        }
      } else {
        toast.error(result.message || '操作失败，但已切换到下一个人');
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('操作失败，但已切换到下一个人');
    }
  };

  const handleDislike = async () => {
    if (!user || state.potentialMatches.length === 0 || state.currentMatchIndex >= state.potentialMatches.length) {
      return;
    }

    const targetUser = state.potentialMatches[state.currentMatchIndex];
    
    // 先切换到下一个人（无论操作是否成功）
    const nextIndex = state.currentMatchIndex + 1;
    dispatch({ type: 'NEXT_MATCH' });
    setCurrentMatchIndex(nextIndex);
    
    try {
      const result = await dislikeUser(user.id, targetUser.id);
      
      if (!result.success) {
        toast.error(result.message || '操作失败，但已切换到下一个人');
      }
      // 成功时不显示toast，直接切换即可
    } catch (error) {
      console.error('Dislike error:', error);
      toast.error('操作失败，但已切换到下一个人');
    }
  };

  const resetMatches = async () => {
    setCurrentMatchIndex(0);
    await loadMatches();
  };

  // 处理"期待看到更多"点击，收集用户反馈数据
  const handleExpectMore = async () => {
    if (!user) return;
    
    try {
      // 收集用户点击"期待看到更多"的数据
      await fetch('/api/user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'expect_more_matches',
          timestamp: new Date().toISOString(),
          context: 'daily_limit_reached'
        }),
      });
    } catch (error) {
      console.error('Failed to collect feedback:', error);
    }
    
    // 仍然执行重新加载功能
    await resetMatches();
  };

  const currentMatch = state.potentialMatches.length > 0 && state.currentMatchIndex < state.potentialMatches.length
    ? state.potentialMatches[state.currentMatchIndex]
    : null;

  const handleInterviewChange = (id: number, value: 'yes' | 'no') => {
    dispatch({ type: 'SET_INTERVIEW_STATUS', payload: { matchId: id, status: value } });
    // 保存到localStorage
    saveToLocalStorage(id, 'interviewStatus', value);
  };

  const handleFeedbackChange = (id: number, value: string) => {
    dispatch({ type: 'SET_FEEDBACK', payload: { matchId: id, feedback: value } });
    // 保存到localStorage
    saveToLocalStorage(id, 'feedback', value);
  };

  const handleContactStatusChange = (id: number, value: 'yes' | 'no') => {
    dispatch({ type: 'SET_CONTACT_STATUS', payload: { matchId: id, status: value } });
    // 保存到localStorage
    saveToLocalStorage(id, 'contactStatus', value);
  };

  const handleFeedbackSubmit = async (matchId: number) => {
    if (!user) return;
    const contactStatusValue = state.contactStatus?.[matchId];
    const interviewStatusValue = state.interviewStatus?.[matchId];
    const feedbackContent = state.feedbacks?.[matchId] || '';
    
    // 先标记为已提交（乐观更新）
    dispatch({ type: 'SUBMIT_FEEDBACK', payload: matchId });
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          userId: user.id,
          contactStatus: contactStatusValue || '',
          interviewStatus: interviewStatusValue || '',
          content: feedbackContent,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // 提交成功后清除localStorage中的数据
        clearFromLocalStorage(matchId);
        
        if (interviewStatusValue === 'yes') {
          toast.success('反馈已提交！🌟 恭喜获得面试经验，等级提升！');
          // 重新加载当前用户的成就数据
          loadUserAchievements([user.id]);
        } else {
          toast.success('反馈已提交，感谢你的诚实反馈！');
        }
      } else {
        // 如果失败，恢复提交状态
        dispatch({ type: 'REVERT_FEEDBACK_SUBMISSION', payload: matchId });
        toast.error(data.message || '保存反馈失败，请稍后再试');
      }
    } catch (error) {
      // 网络错误，恢复提交状态
      dispatch({ type: 'REVERT_FEEDBACK_SUBMISSION', payload: matchId });
      toast.error('网络错误，请稍后再试');
      console.error('Feedback submission error:', error);
    }
  };

  const handleShowContactTemplates = (match: Match) => {
    dispatch({ type: 'SHOW_CONTACT_TEMPLATES', payload: match });
  };

  const handleCloseContactTemplates = () => {
    dispatch({ type: 'SHOW_CONTACT_TEMPLATES', payload: null });
  };

  // 用户成就数据状态
  const [userAchievements, setUserAchievements] = useState<{ [userId: number]: any }>({});
  
  // 首次匹配弹窗状态
  const [showFirstMatchModal, setShowFirstMatchModal] = useState(false);
  const [firstMatchPartner, setFirstMatchPartner] = useState<string>('');

  // 获取用户成就数据
  const getUserAchievementData = (userId: number) => {
    const achievement = userAchievements[userId];
    if (!achievement) {
            return {
        icon: '🌱', 
        level: '新用户', 
        description: '刚加入平台的新成员',
        showMoon: false
      };
    }

    const levelMap: { [key: string]: any } = {
      '新用户': { icon: '🌱', description: '刚加入平台的新成员', showMoon: false },
      '面试新手': { icon: '⭐', description: '开始积累经验', showMoon: false },
      '面试新星': { icon: '🌟', description: '积极的面试伙伴', showMoon: false },
      '面试达人': { icon: '🌙', description: '完成第一阶段挑战', showMoon: true },
      '面试导师': { icon: '👑', description: '经验丰富的面试专家', showMoon: true },
    };

    const levelInfo = levelMap[achievement.currentLevel] || levelMap['新用户'];
    return {
      ...levelInfo,
      level: achievement.currentLevel,
      experiencePoints: achievement.experiencePoints,
    };
  };

  // 获取等级样式配置
  const getLevelStyle = (level: string) => {
    const levelStyles: Record<string, {
      bg: string;
      text: string;
      border: string;
      hover: string;
      title: string;
      description: string;
      customBg?: string;
      customText?: string;
      customBorder?: string;
      customHover?: string;
    }> = {
      '新用户': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        hover: 'hover:bg-green-200',
        title: '新用户标识',
        description: '刚注册的用户，还未完成面试练习'
      },
      '面试新手': {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-200',
        title: '面试新手',
        description: '开始积累面试经验，正在学习阶段'
      },
      '面试新星': {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-200',
        title: '面试新星',
        description: '积极参与面试练习，表现优秀'
      },
      '面试达人': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-200',
        title: '面试达人',
        description: '经验丰富的面试者，完成第一阶段挑战'
      },
      '面试导师': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        hover: 'hover:bg-red-200',
        title: '面试导师',
        description: '最高级别用户，经验丰富的面试专家'
      }
    };
    
    return levelStyles[level] || levelStyles['新用户'];
  };

  // 渲染成就等级的函数
  const renderAchievement = (userId: number) => {
    const achievement = getUserAchievementData(userId);
    const levelStyle = getLevelStyle(achievement.level);
    
    return (
      <div className="flex flex-col items-center justify-center mt-2">
        {/* 成就图标和等级 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{achievement.icon}</span>
          <div className="relative group">
            <span className={`text-sm font-semibold px-2 py-1 rounded-md transition-all duration-200 cursor-help shadow-sm hover:shadow-md ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border} ${levelStyle.hover} border`}>
              {achievement.level}
            </span>
            {/* 悬停提示 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              <div className="text-center">
                <div className="font-medium">{levelStyle.title}</div>
                <div className="text-gray-300 mt-1">{levelStyle.description}</div>
              </div>
              {/* 小三角形箭头 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          {achievement.showMoon && (
            <span className="text-lg text-blue-400">🌙</span>
          )}
        </div>
      </div>
    );
  };

  // 移除硬绑定反馈提交函数 - 现在使用渐进式反馈系统
  // const handleModalFeedbackSubmit = async (completed: boolean, content?: string) => { ... };

  // 更新匹配状态
  const updateMatchStatus = async (matchId: number, newStatus: string) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/matches/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          contactStatus: newStatus,
        }),
      });

      if (response.ok) {
        // 更新本地状态
        dispatch({ 
          type: 'UPDATE_MATCH_STATUS', 
          payload: { matchId, contactStatus: newStatus } 
        });
        toast.success('状态更新成功！');
      } else {
        const errorData = await response.json();
        console.error('Status update failed:', response.status, errorData);
        toast.error(`状态更新失败：${errorData.error || '请稍后再试'}`);
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      toast.error('状态更新失败，请稍后再试');
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col min-h-screen pt-20">
        {/* 响应式Tab导航区域 */}
        <div className="responsive-container">
          <div className="tab-nav">
            <button
              className={state.activeTab === "browse" ? "active" : ""}
              onClick={() => dispatch({ type: "SET_TAB", payload: "browse" })}
            >
              🔍 浏览候选人
            </button>
            <button
              className={state.activeTab === "matches" ? "active" : ""}
              onClick={() => dispatch({ type: "SET_TAB", payload: "matches" })}
            >
              <Image src="/logo-icon.png" alt="Logo" width={20} height={20} className="tab-logo" />
              成功匹配
            </button>
            <button
              className={state.activeTab === "guide" ? "active" : ""}
              onClick={() => dispatch({ type: "SET_TAB", payload: "guide" })}
            >
              🧭 面试指南
            </button>
            <button
              className={state.activeTab === "questions" ? "active" : ""}
              onClick={() => dispatch({ type: "SET_TAB", payload: "questions" })}
            >
              📝 真题分享
            </button>
          </div>
        </div>

        {/* 响应式内容区域 */}
        <div className="responsive-container">
          <Tabs value={state.activeTab} onValueChange={(value) => dispatch({ type: 'SET_TAB', payload: value })} className="w-full">
            <TabsContent value="browse" className="space-y-4 mt-4">

              {state.isLoading ? (
                <Card className="w-full max-w-lg mx-auto rounded-3xl shadow-xl border-0 bg-white p-5 animate-pulse mt-4">
                  <div className="flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full bg-gray-200 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded-lg w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-48 mb-6"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 my-6">
                    <div className="space-y-4">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="h-10 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-10 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </Card>
              ) : !isComplete ? (
                <Card className="w-full max-w-xl mx-auto rounded-3xl shadow-xl border-0 p-10 flex flex-col items-center mt-4 bg-gradient-to-r from-blue-50 via-white to-blue-50">
                  <div className="text-6xl mb-6">👤</div>
                  <h2 className="text-2xl font-extrabold mb-4 text-center text-blue-500">
                    完善资料，开始匹配！
                  </h2>
                  <p className="text-lg mb-6 text-center text-blue-500/80">
                    为了为您推荐最合适的练习伙伴，<br/>
                    请先花2分钟完善您的资料
                  </p>
                  <Button
                    onClick={() => router.push('/profile?from=matches')}
                    className="rounded-full px-10 py-3 text-lg font-bold text-white shadow-lg transition-all bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 hover:scale-105"
                  >
                    完善我的资料
                  </Button>
                </Card>
              ) : (
                <>
                  {currentMatch ? (
                    <Card className="w-full max-w-lg mx-auto rounded-3xl shadow-xl border-0 bg-white p-5 mt-4">
                      <div className="flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full shadow flex items-center justify-center mb-4 border-4 border-white bg-blue-50">
                          <img
                            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${currentMatch.username}`}
                            alt="avatar"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        </div>
                        <div className="font-bold text-2xl font-['Poppins'] mb-2 text-gray-800">{currentMatch.username}</div>
                        {/* 显示用户成就等级 */}
                        {renderAchievement(currentMatch.id)}
                        {currentMatch.bio && (
                          <div className="text-base text-gray-500 mb-2 text-center max-w-xs mx-auto">{currentMatch.bio}</div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-8 my-6">
                        <div>
                          <div className="font-semibold flex items-center gap-1 text-base text-blue-500">岗位类型</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.jobType || '未设置'}</div>
                          <div className="mt-4 font-semibold flex items-center gap-1 text-base text-blue-500">目标公司</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.targetCompany || '未设置'}</div>
                          <div className="mt-4 font-semibold text-base mb-1 text-blue-500">期望练习内容</div>
                          <div className="flex gap-2 flex-wrap mb-2">
                            {currentMatch.practicePreferences?.technicalInterview && (
                              <span className="rounded-full px-3 py-0.5 flex items-center gap-1 text-base font-semibold shadow-sm bg-blue-50 text-blue-500">
                                🥊 技术面
                              </span>
                            )}
                            {currentMatch.practicePreferences?.behavioralInterview && (
                              <span className="rounded-full px-3 py-0.5 flex items-center gap-1 text-base font-semibold shadow-sm bg-blue-50 text-blue-500">
                                🧑‍🤝‍🧑 行为面
                              </span>
                            )}
                            {currentMatch.practicePreferences?.caseAnalysis && (
                              <span className="rounded-full px-3 py-0.5 flex items-center gap-1 text-base font-semibold shadow-sm bg-blue-50 text-blue-500">
                                🧩 案例分析
                              </span>
                            )}
                            {currentMatch.practicePreferences?.statsQuestions && (
                              <span className="rounded-full px-3 py-0.5 flex items-center gap-1 text-base font-semibold shadow-sm bg-blue-50 text-blue-500">
                                📊 统计题目
                              </span>
                            )}
                          </div>
                          {/* 技能展示 */}
                          {currentMatch.skills && currentMatch.skills.length > 0 && (
                            <>
                              <div className="mt-4 font-semibold text-base mb-2 text-green-600">💡 技能标签</div>
                              <div className="flex gap-2 flex-wrap mb-4">
                                {currentMatch.skills.map((skill: string, index: number) => (
                                  <span key={index} className="rounded-full px-3 py-0.5 flex items-center gap-1 text-base font-semibold shadow-sm bg-green-50 text-green-600">
                                    💡 {skill}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-1 text-base text-blue-500">经验水平</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.experienceLevel || '未设置'}</div>
                          {currentMatch.jobSeekingStatus && (
                            <>
                              <div className="mt-4 font-semibold flex items-center gap-1 text-base text-blue-500">求职状态</div>
                              <div className="font-bold text-lg">
                                {currentMatch.jobSeekingStatus === '保持状态' && '🌱 保持状态'}
                                {currentMatch.jobSeekingStatus === '准备中' && '🔍 准备中'}
                                {currentMatch.jobSeekingStatus === '面试中' && '🎯 面试中'}
                                {currentMatch.jobSeekingStatus === '已拿offer' && '💼 已拿offer'}
                              </div>
                            </>
                          )}
                          <div className="mt-4 font-semibold flex items-center gap-1 text-base text-blue-500">目标行业</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.targetIndustry || '未设置'}</div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-6 mt-4">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleDislike}
                          className="rounded-full px-8 py-2 text-lg font-bold bg-white shadow transition-all border-2 border-blue-500 text-blue-500 hover:bg-blue-50"
                        >
                          跳过
                        </Button>
                        <Button
                          size="lg"
                          onClick={handleLike}
                          className="rounded-full px-8 py-2 text-lg font-bold text-white shadow transition-all bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 hover:scale-105"
                        >
                          匹配
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="w-full max-w-xl mx-auto rounded-[2.5rem] shadow-2xl border-0 p-10 flex flex-col items-center mt-4 bg-gradient-to-r from-blue-100 via-white to-blue-100">
                      <div className="text-6xl mb-4">🦉</div>
                      <p className="text-2xl font-extrabold mb-1 tracking-wide text-blue-500">今日推荐已用完！</p>
                      <p className="text-lg mb-8 text-blue-500/80">明天再来发现新伙伴吧～<br/>或者刷新看看有没有新机会！</p>
                      <Button
                        onClick={handleExpectMore}
                        className="rounded-full px-10 py-3 text-lg font-bold text-white shadow-lg transition-all bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 hover:scale-105"
                      >
                        期待看到更多
                      </Button>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
            <TabsContent value="matches" className="space-y-4 mt-4">
              {state.isLoading ? (
                <div className="cards-container">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="card-header">
                        <div className="avatar"></div>
                        <div>
                          <div className="name"></div>
                          <div className="title"></div>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="intro"></div>
                        <div className="tags">
                          <div className="tag"></div>
                          <div className="tag"></div>
                        </div>
                        <div className="contact"></div>
                      </div>
                      <div className="card-footer">
                        <div className="contact-button"></div>
                        <div className="status"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {state.activeTab === 'matches' && (
                    <div className="rounded-lg p-4 mb-4 border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="text-xl mr-3">🏆</span>
                          <div className="text-sm text-blue-500/90">
                            <p className="font-semibold mb-2">成就等级系统</p>
                            <p className="leading-relaxed">
                              完成面试获得经验，提升等级！🌱<span className="font-medium">新用户</span>(0次) → ⭐<span className="font-medium">面试新手</span>(1-4次) → 🌟<span className="font-medium">面试新星</span>(5-9次) → 🌙<span className="font-medium">面试达人</span>(10-14次) → 👑<span className="font-medium">面试导师</span>(15次+)
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => dispatch({ type: "SET_TAB", payload: "guide" })}
                          className="ml-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <span>查看面试指南</span>
                          <span className="text-lg">→</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {state.successfulMatches.length > 0 ? (
                    <div className="cards-container">
                      {state.successfulMatches.map((match) => {
                        const matchId = match.matchId || match.id; // 统一使用matchId进行状态管理
                        return (
                        <div key={matchId} className="card">
                          <div className="card-header">
                            <div className="avatar">
                              <img
                                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${match.username || 'user'}`}
                                alt="avatar"
                                className="w-full h-full rounded-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="name">{match.username || '匿名用户'}</div>
                              {/* 显示用户成就等级 */}
                              <div className="flex items-center gap-1 mb-1">
                                {(() => {
                                  const achievement = getUserAchievementData(match.id);
                                  return (
                                    <>
                                      <span className="text-sm">{achievement.icon}</span>
                                      <span className="text-xs font-medium text-gray-600">{achievement.level}</span>
                                      {achievement.showMoon && (
                                        <span className="text-xs text-blue-500">🌙</span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="title">
                                {match.jobType || '未设置'} · {match.experienceLevel || '未设置'}
                                {match.jobSeekingStatus && (
                                  <> · {match.jobSeekingStatus}</>
                                )}
                              </div>
                              {/* 添加匹配时间显示 */}
                              {match.createdAt && (
                                <div className="text-xs text-gray-500 mt-1">
                                  匹配于 {(() => {
                                    const hours = Math.floor((Date.now() - new Date(match.createdAt).getTime()) / (1000 * 60 * 60));
                                    if (hours < 24) return `${hours}小时前`;
                                    const days = Math.floor(hours / 24);
                                    return `${days}天前`;
                                  })()}
                                </div>
                              )}
                            </div>

                          </div>
                          <div className="card-body">
                            {match.bio && (
                              <div className="intro">{match.bio}</div>
                            )}
                            <div className="tags">
                              {match.practicePreferences?.technicalInterview && (
                                <span className="tag">技术面</span>
                              )}
                              {match.practicePreferences?.behavioralInterview && (
                                <span className="tag">行为面</span>
                              )}
                              {match.practicePreferences?.caseAnalysis && (
                                <span className="tag">案例分析</span>
                              )}
                              {match.practicePreferences?.statsQuestions && (
                                <span className="tag">统计题目</span>
                              )}
                            </div>
                            
                            {/* 技能展示 */}
                            {match.skills && match.skills.length > 0 && (
                              <div className="mt-4 mb-4">
                                <div className="text-xs font-medium text-gray-700 mb-2">💡 技能标签</div>
                                <div className="flex gap-1.5 flex-wrap">
                                  {match.skills.map((skill: string, index: number) => (
                                    <span key={index} className="rounded-full px-2 py-0.5 flex items-center gap-1 text-xs font-medium shadow-sm bg-green-50 text-green-600 border border-green-200">
                                      💡 {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* 2. 联系方式参考格式 */}
                            <div className="contact">
                              <div className="contact-title">联系方式：</div>
                              {match.contactInfo?.email && (
                                <div className="contact-item">
                                  <span>📧 邮箱: {match.contactInfo.email}</span>
                                </div>
                              )}
                              {match.contactInfo?.wechat && (
                                <div className="contact-item">
                                  <span>💬 微信: {match.contactInfo.wechat}</span>
                                </div>
                              )}
                              {match.contactInfo?.linkedin && (
                                <div className="contact-item">
                                  <span>🔗 领英: {match.contactInfo.linkedin}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4">
                              <button
                                onClick={() => handleShowContactTemplates(match)}
                                className="contact-button"
                              >
                                查看联系模板
                              </button>
                            </div>
                            
                            {/* 完整的三步反馈流程 */}
                            <div className="feedback-flow mt-3 p-2 bg-gray-50 rounded-md">
                              {/* 第一步：是否添加联系方式？ */}
                              <div className="mb-2">
                                <div className="text-sm font-medium text-gray-700 mb-1">📋 是否添加联系方式？</div>
                                <label className="inline-flex items-center mr-4">
                                  <input
                                    type="radio"
                                    name={`contact_${match.id}`}
                                    value="yes"
                                    checked={state.contactStatus?.[matchId] === 'yes'}
                                    onChange={() => handleContactStatusChange(matchId, 'yes')}
                                    className="mr-1"
                                  />
                                  是
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`contact_${match.id}`}
                                    value="no"
                                    checked={state.contactStatus?.[matchId] === 'no'}
                                    onChange={() => handleContactStatusChange(matchId, 'no')}
                                    className="mr-1"
                                  />
                                  否
                                </label>
                              </div>
                              
                              {/* 第二步：是否进行面试？- 只在添加联系方式后显示 */}
                              {state.contactStatus?.[matchId] === 'yes' && (
                                <div className="mb-2">
                                  <div className="text-sm font-medium text-gray-700 mb-1">🎯 是否进行面试？</div>
                                  <label className="inline-flex items-center mr-4">
                                    <input
                                      type="radio"
                                      name={`interview_${match.id}`}
                                      value="yes"
                                                                             checked={state.interviewStatus?.[matchId] === 'yes'}
                                       onChange={() => handleInterviewChange(matchId, 'yes')}
                                      className="mr-1"
                                    />
                                    是
                                  </label>
                                  <label className="inline-flex items-center">
                                    <input
                                      type="radio"
                                      name={`interview_${match.id}`}
                                      value="no"
                                                                             checked={state.interviewStatus?.[matchId] === 'no'}
                                       onChange={() => handleInterviewChange(matchId, 'no')}
                                      className="mr-1"
                                    />
                                    否
                                  </label>
                                </div>
                              )}
                              
                              {/* 第三步：面试反馈 - 只在进行面试后显示 */}
                              {state.contactStatus?.[matchId] === 'yes' && state.interviewStatus?.[matchId] === 'yes' && (
                                <div className="feedback-section">
                                  {state.submitted?.[matchId] ? (
                                    // 已提交的反馈 - 支持折叠/展开
                                    <>
                                      {state.collapsedFeedbacks?.[matchId] ? (
                                        // 折叠状态 - 简洁显示
                                        <div 
                                          className="bg-green-50 border border-green-200 rounded-md p-3 cursor-pointer hover:bg-green-100 transition-colors"
                                          onClick={() => dispatch({ type: 'TOGGLE_FEEDBACK_COLLAPSE', payload: matchId })}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="text-green-600">✅</span>
                                              <span className="text-sm font-medium text-green-800">面试反馈已提交</span>
                                            </div>
                                            <span className="text-xs text-green-600">点击展开 ▼</span>
                                          </div>
                                        </div>
                                      ) : (
                                        // 展开状态 - 显示完整内容
                                        <>
                                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                            <div 
                                              className="flex items-center justify-between mb-2 cursor-pointer"
                                              onClick={() => dispatch({ type: 'TOGGLE_FEEDBACK_COLLAPSE', payload: matchId })}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="text-green-600">✅</span>
                                                <span className="text-sm font-medium text-green-800">面试反馈已提交</span>
                                              </div>
                                              <span className="text-xs text-green-600 hover:text-green-700">点击收起 ▲</span>
                                            </div>
                                            {state.feedbacks?.[matchId] && (
                                              <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                                                <strong>你的反馈：</strong>
                                                <p className="mt-1">{state.feedbacks[matchId]}</p>
                                              </div>
                                            )}
                                          </div>
                                          {/* 提交成功后的激励提示 */}
                                          <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-md">
                                            <div className="flex items-center gap-2 text-xs text-blue-700">
                                              <span>🎉</span>
                                              <span className="font-medium">太棒了！你获得了经验值，等级提升中...</span>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    // 未提交的反馈 - 展开表单
                                    <>
                                      {/* 填写前的激励提示 */}
                                      <div className="mb-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                          <span className="text-lg">💎</span>
                                          <div className="flex-1 text-xs text-gray-700">
                                            <p className="font-semibold text-orange-700 mb-1">完成反馈可升级！</p>
                                            <p className="text-gray-600">提交面试反馈可获得经验值，等级越高越容易被优先推荐～你的反馈仅后台可见，放心填写真实感受！</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <label className="block text-sm font-medium text-gray-700 mb-1">✍️ 请填写你的面试反馈：</label>
                                      <textarea
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        value={state.feedbacks?.[matchId] || ''}
                                        onChange={e => handleFeedbackChange(matchId, e.target.value)}
                                        placeholder="分享你的面试体验、收获或建议吧..."
                                      />
                                      <button
                                        className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => handleFeedbackSubmit(matchId)}
                                        disabled={!state.feedbacks?.[matchId]}
                                      >
                                        提交反馈 🚀
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="cards-container">
                      <div className="card">
                        <div className="card-body text-center py-12">
                          <p className="text-xl mb-4">暂无成功匹配</p>
                          <p className="text-gray-500">继续浏览候选人，找到合适的练习伙伴吧！</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 恢复原来的匹配卡片布局 */}
                  {false && state.successfulMatches.length > 0 && (
                    <div className="cards-container">
                      {state.successfulMatches.map((match) => (
                        <div key={match.matchId || match.id} className="card">
                          <div className="card-header">
                            <div className="avatar">
                              {(match.username || '?').charAt(0).toUpperCase()}
                            </div>
                                                        <div>
                              <div className="name">{match.username || '匿名用户'}</div>
                                                             {/* 显示用户成就等级 */}
                               <div className="flex items-center gap-1 mb-1">
                                 {(() => {
                                   const achievement = getUserAchievementData(match.id);
                                   return (
                                     <>
                                       <span className="text-sm">{achievement.icon}</span>
                                       <span className="text-xs font-medium text-gray-600">{achievement.level}</span>
                                       {achievement.showMoon && (
                                         <span className="text-xs text-blue-400">🌙</span>
                                       )}
                                     </>
                                   );
                                 })()}
                               </div>
                              <div className="title">
                                {match.jobType || '未设置'} · {match.experienceLevel || '未设置'}
                                {match.jobSeekingStatus && (
                                  <> · {match.jobSeekingStatus}</>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="card-body">
                            {match.bio && (
                              <div className="intro">{match.bio}</div>
                            )}
                            <div className="tags">
                              {match.practicePreferences?.technicalInterview && (
                                <span className="tag">技术面</span>
                              )}
                              {match.practicePreferences?.behavioralInterview && (
                                <span className="tag">行为面</span>
                              )}
                              {match.practicePreferences?.caseAnalysis && (
                                <span className="tag">案例分析</span>
                              )}
                              {match.practicePreferences?.statsQuestions && (
                                <span className="tag">统计题目</span>
                              )}
                            </div>
                            {match.contactInfo && (
                              <div className="contact">
                                联系方式：
                                {match.contactInfo.email && (
                                  <a href={`mailto:${match.contactInfo.email}`}>
                                    {match.contactInfo.email}
                                  </a>
                                )}
                                {match.contactInfo.wechat && (
                                  <div>微信：{match.contactInfo.wechat}</div>
                                )}
                                {match.contactInfo.linkedin && (
                                  <div>LinkedIn：{match.contactInfo.linkedin}</div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="card-footer">
                            <button 
                              className="contact-button"
                              onClick={() => handleShowContactTemplates(match)}
                            >
                              联系模板
                            </button>
                            <div className="status">
                              是否完成面试？
                              <label>
                                <input
                                  type="radio"
                                  name={`interview_${match.id}`}
                                  value="yes"
                                  checked={state.interviewStatus[match.id] === 'yes'}
                                  onChange={() => handleInterviewChange(match.id, 'yes')}
                                />
                                是
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name={`interview_${match.id}`}
                                  value="no"
                                  checked={state.interviewStatus[match.id] === 'no'}
                                  onChange={() => handleInterviewChange(match.id, 'no')}
                                />
                                否
                              </label>
                            </div>
                          </div>
                          {state.interviewStatus[match.id] === 'yes' && (
                            <div className="feedback-form">
                              <label>请填写你的面试反馈：</label>
                              <textarea
                                className="feedback-form textarea"
                                rows={3}
                                value={state.feedbacks[match.id] || ''}
                                onChange={e => handleFeedbackChange(match.id, e.target.value)}
                                placeholder="请描述你的面试体验、收获或建议"
                                disabled={state.submitted[match.id]}
                              />
                              <button
                                className="contact-button"
                                onClick={() => handleFeedbackSubmit(match.matchId || match.id)}
                                disabled={state.submitted[match.id] || !state.feedbacks[match.id]}
                              >
                                {state.submitted[match.id] ? '已提交' : '提交反馈'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="guide" className="space-y-4 mt-4">
              <div className="max-w-3xl mx-auto px-4">
                {/* 页面标题 */}
                <div className="text-center mb-8 animate-fadeInDown">
                  <div className="text-5xl mb-3">🎯</div>
                  <h1 className="text-3xl font-bold mb-2 text-gray-800">
                    三步完成Mock面试
                  </h1>
                  <p className="text-base text-gray-600">简单、清晰、高效</p>
                </div>

                {/* 流程步骤 */}
                <div className="space-y-4 mb-8">
                  {/* 步骤1 */}
                  <div className="bg-white rounded-lg p-5 border-2 border-blue-200 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">📱</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          联系TA，约定时间
                        </h3>
                        <p className="text-base text-gray-700 leading-relaxed">
                          点击"联系TA"获取联系方式，约定<span className="font-semibold">1小时</span>左右的时间进行Mock
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 步骤2 */}
                  <div className="bg-white rounded-lg p-5 border-2 border-purple-200 animate-slideInRight" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">📚</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          查看真题，开始Mock
                        </h3>
                        <div className="space-y-2">
                          <p className="text-base text-gray-700">
                            <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                              20-25分钟
                            </span>
                            进行Mock面试
                          </p>
                          <p className="text-base text-gray-700">
                            <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                              10-15分钟
                            </span>
                            给出反馈建议
                          </p>
                          <p className="text-base text-gray-700 font-semibold mt-2">
                            🔄 然后轮换角色，重复上述流程
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 步骤3 */}
                  <div className="bg-white rounded-lg p-5 border-2 border-green-200 animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">✅</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          回来打勾，提交反馈
                        </h3>
                        <p className="text-base text-gray-700 leading-relaxed mb-3">
                          在真题分享区讨论交流，分享题目
                        </p>
                        <div className="bg-green-50 rounded-lg p-2.5 border-l-4 border-green-400">
                          <p className="text-sm text-gray-700 font-semibold">
                            💎 完成反馈可升级，优先被推荐
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 底部按钮 */}
                <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
                    <Button
                      onClick={() => dispatch({ type: "SET_TAB", payload: "browse" })}
                      className="text-white font-medium text-base px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      style={{ backgroundColor: '#157ff1' }}
                    >
                      开始寻找匹配
                    </Button>
                    <Button
                      onClick={() => dispatch({ type: "SET_TAB", payload: "questions" })}
                      variant="outline"
                      className="border-2 bg-white hover:bg-blue-50 font-medium text-base px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      style={{ borderColor: '#157ff1', color: '#157ff1' }}
                    >
                      查看真题分享
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    有问题联系客服 <span className="font-semibold">Royal__city</span>
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4 mt-4">
              <InterviewQuestionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 联系模板弹窗 */}
      {state.showContactTemplates && state.selectedMatch && user && profile && (
        <ContactTemplates
          match={state.selectedMatch}
          currentUser={{
            username: user?.username || session?.user?.name || session?.user?.email || 'User',
            jobType: profile.jobType,
            experienceLevel: profile.experienceLevel
          }}
          onClose={handleCloseContactTemplates}
        />
      )}
      
      {/* 移除硬绑定反馈弹窗 - 现在使用渐进式反馈系统 */}
      {/* <FeedbackModal ... /> */}
      
      {/* 首次匹配成功弹窗 */}
      <FirstMatchModal
        isOpen={showFirstMatchModal}
        partnerName={firstMatchPartner}
        onClose={() => setShowFirstMatchModal(false)}
        onStartContact={() => {
          // 关闭弹窗，如果不在成功匹配页面则切换过去
          setShowFirstMatchModal(false);
          if (state.activeTab !== 'matches') {
            dispatch({ type: 'SET_TAB', payload: 'matches' });
          }
        }}
      />
    </AuthLayout>
  );
}