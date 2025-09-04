'use client';

import { useState, useEffect, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  
  // 保持Jotai原子状态同步（用于全局状态共享）
  const [, setPotentialMatches] = useAtom(potentialMatchesAtom);
  const [, setCurrentMatchIndex] = useAtom(currentMatchIndexAtom);

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

  const loadMatches = async () => {
    if (!user) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Load potential matches
      const potentialResult = await fetchPotentialMatches(user.id);
      // Load successful matches
      const successfulResult = await fetchSuccessfulMatches(user.id);
      
      const potentialMatches = (potentialResult.success && 'matches' in potentialResult) ? potentialResult.matches || [] : [];
      const successfulMatches = (successfulResult.success && 'matches' in successfulResult && Array.isArray(successfulResult.matches)) 
        ? (successfulResult.matches.filter(match => match !== null) as Match[])
        : [];
        
      // 使用dispatch更新所有状态
      dispatch({ type: 'LOAD_MATCHES', payload: { potentialMatches, successfulMatches } });
      
      // 同步到Jotai全局状态
      setPotentialMatches(potentialMatches);
      setCurrentMatchIndex(0);
      
      if (potentialResult.message) {
        toast.error(potentialResult.message);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('获取匹配失败，请稍后再试');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleLike = async () => {
    if (!user || state.potentialMatches.length === 0 || state.currentMatchIndex >= state.potentialMatches.length) {
      return;
    }

    const targetUser = state.potentialMatches[state.currentMatchIndex];
    try {
      const result = await likeUser(user.id, targetUser.id);
      
      if (result.success) {
        if ('match' in result && result.match) {
          // If it's a match, reload the successful matches
          toast.success(result.message || '匹配成功！');
          const successfulResult = await fetchSuccessfulMatches(user.id);
          // 更新成功匹配列表
          if (successfulResult.success && 'matches' in successfulResult && Array.isArray(successfulResult.matches)) {
            const filteredMatches = successfulResult.matches.filter(match => match !== null) as Match[];
            dispatch({ type: 'LOAD_MATCHES', payload: { potentialMatches: state.potentialMatches, successfulMatches: filteredMatches } });
          }
        } else {
          toast.success(result.message || '已收到你的喜欢！');
        }
        
        // Move to next potential match
        dispatch({ type: 'NEXT_MATCH' });
        setCurrentMatchIndex(state.currentMatchIndex + 1);
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('操作失败，请稍后再试');
    }
  };

  const handleDislike = async () => {
    if (!user || state.potentialMatches.length === 0 || state.currentMatchIndex >= state.potentialMatches.length) {
      return;
    }

    const targetUser = state.potentialMatches[state.currentMatchIndex];
    try {
      const result = await dislikeUser(user.id, targetUser.id);
      
      if (result.success) {
        // Move to next potential match
        dispatch({ type: 'NEXT_MATCH' });
        setCurrentMatchIndex(state.currentMatchIndex + 1);
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('Dislike error:', error);
      toast.error('操作失败，请稍后再试');
    }
  };

  const resetMatches = async () => {
    setCurrentMatchIndex(0);
    await loadMatches();
  };

  const currentMatch = state.potentialMatches.length > 0 && state.currentMatchIndex < state.potentialMatches.length
    ? state.potentialMatches[state.currentMatchIndex]
    : null;

  const handleInterviewChange = (id: number, value: 'yes' | 'no') => {
    dispatch({ type: 'SET_INTERVIEW_STATUS', payload: { matchId: id, status: value } });
  };

  const handleFeedbackChange = (id: number, value: string) => {
    dispatch({ type: 'SET_FEEDBACK', payload: { matchId: id, feedback: value } });
  };

  const handleFeedbackSubmit = async (matchId: number) => {
    if (!user) return;
    const interviewStatusValue = state.interviewStatus[matchId];
    const feedbackContent = state.feedbacks[matchId] || '';
    dispatch({ type: 'SUBMIT_FEEDBACK', payload: matchId });
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        userId: user.id,
        interviewStatus: interviewStatusValue || '',
        content: feedbackContent,
      }),
    }).then(r => r.json());
    if (res.success) {
      toast.success('反馈已提交');
    } else {
      toast.error(res.message || '提交失败');
      dispatch({ type: 'SUBMIT_FEEDBACK', payload: matchId });
    }
  };

  const handleShowContactTemplates = (match: Match) => {
    dispatch({ type: 'SHOW_CONTACT_TEMPLATES', payload: match });
  };

  const handleCloseContactTemplates = () => {
    dispatch({ type: 'SHOW_CONTACT_TEMPLATES', payload: null });
  };

  return (
    <AuthLayout>
      <div className="flex flex-col min-h-screen pt-20">
        {/* 使用shadcn/ui的Tabs组件 */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs 
            value={state.activeTab} 
            onValueChange={(value) => dispatch({ type: 'SET_TAB', payload: value })} 
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="browse">浏览候选人</TabsTrigger>
              <TabsTrigger value="matches">成功匹配</TabsTrigger>
            </TabsList>
            <TabsContent value="browse" className="space-y-4">
              {state.isLoading ? (
                <Card className="w-full max-w-xl mx-auto rounded-3xl shadow-xl border-0 bg-white p-6 animate-pulse">
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
                  <div className="flex justify-center gap-6 mt-8">
                    <div className="h-10 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-10 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </Card>
              ) : !isComplete ? (
                <Card className="w-full max-w-2xl mx-auto rounded-3xl shadow-xl border-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-12 flex flex-col items-center">
                  <div className="text-6xl mb-6">👤</div>
                  <h2 className="text-2xl font-extrabold text-blue-700 mb-4 text-center">
                    完善资料，开始匹配！
                  </h2>
                  <p className="text-lg text-blue-900/80 mb-6 text-center">
                    为了为您推荐最合适的练习伙伴，<br/>
                    请先花2分钟完善您的资料
                  </p>
                  <Button
                    onClick={() => router.push('/profile?from=matches')}
                    className="rounded-full px-10 py-3 text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg hover:scale-105 hover:from-blue-500 hover:to-blue-700 transition-all"
                  >
                    完善我的资料
                  </Button>
                </Card>
              ) : (
                <>
                  {currentMatch ? (
                    <Card className="w-full max-w-xl mx-auto rounded-3xl shadow-xl border-0 bg-white p-6">
                      <div className="flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full bg-blue-50 shadow flex items-center justify-center mb-4 border-4 border-white">
                          <img
                            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${currentMatch.username}`}
                            alt="avatar"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        </div>
                        <div className="font-bold text-2xl font-['Poppins'] mb-2 text-gray-800">{currentMatch.username}</div>
                        {currentMatch.bio && (
                          <div className="text-base text-gray-500 mb-2 text-center max-w-xs mx-auto">{currentMatch.bio}</div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-8 my-6">
                        <div>
                          <div className="text-blue-500 font-semibold flex items-center gap-1 text-base">岗位类型</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.jobType || '未设置'}</div>
                          <div className="mt-4 text-blue-500 font-semibold flex items-center gap-1 text-base">目标公司</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.targetCompany || '未设置'}</div>
                          <div className="mt-4 text-blue-500 font-semibold text-base mb-1">期望练习内容</div>
                          <div className="flex gap-2 flex-wrap mb-2">
                            {currentMatch.practicePreferences?.technicalInterview && (
                              <span className="rounded-full bg-blue-50 text-blue-600 px-3 py-0.5 flex items-center gap-1 text-base font-semibold shadow-sm">
                                🥊 技术面
                              </span>
                            )}
                            {currentMatch.practicePreferences?.behavioralInterview && (
                              <span className="rounded-full bg-blue-50 text-blue-600 px-3 py-0.5 flex items-center gap-1 text-base font-semibold shadow-sm">
                                🧑‍🤝‍🧑 行为面
                              </span>
                            )}
                            {currentMatch.practicePreferences?.caseAnalysis && (
                              <span className="rounded-full bg-blue-50 text-blue-600 px-3 py-0.5 flex items-center gap-1 text-base font-semibold shadow-sm">
                                🧩 案例分析
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-blue-500 font-semibold flex items-center gap-1 text-base">经验水平</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.experienceLevel || '未设置'}</div>
                          <div className="mt-4 text-blue-500 font-semibold flex items-center gap-1 text-base">目标行业</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.targetIndustry || '未设置'}</div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-6 mt-8">
                        <Button variant="outline" size="lg" onClick={handleDislike} className="rounded-full px-8 py-2 text-lg font-bold border-blue-200 text-blue-500 bg-white hover:bg-blue-50 shadow transition-all">
                          跳过
                        </Button>
                        <Button size="lg" onClick={handleLike} className="rounded-full px-8 py-2 text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow hover:scale-105 transition-all">
                          匹配
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="w-full max-w-2xl mx-auto rounded-[2.5rem] shadow-2xl border-0 bg-gradient-to-br from-blue-100 via-white to-blue-200 p-12 flex flex-col items-center">
                      <div className="text-6xl mb-4">🦉</div>
                      <p className="text-2xl font-extrabold text-blue-700 mb-1 tracking-wide">今日推荐已用完！</p>
                      <p className="text-lg text-blue-900/80 mb-8">明天再来发现新伙伴吧～<br/>或者刷新看看有没有新机会！</p>
                      <Button
                        onClick={resetMatches}
                        className="rounded-full px-10 py-3 text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg hover:scale-105 hover:from-blue-500 hover:to-blue-700 transition-all"
                      >
                        重新加载
                      </Button>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
            <TabsContent value="matches" className="space-y-4">
              {state.isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gray-200 mr-3"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                        <div className="flex gap-2 mb-3">
                          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </CardContent>
                      <CardFooter>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  {state.activeTab === 'matches' && state.showBanner && (
                    <div className="flex items-center justify-between p-4 mb-5 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">🎉</span>
                        <span className="text-sm">恭喜匹配成功！记得及时填写面试反馈，这将帮助系统为你和他人匹配到更合适的练习伙伴哦～</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-4 bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                        onClick={() => dispatch({ type: 'TOGGLE_BANNER' })}
                      >
                        我知道了
                      </Button>
                    </div>
                  )}
                  {state.activeTab === 'matches' && (
                    <div className="flex items-center justify-between p-4 mb-5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">🎯</span>
                        <span className="text-sm">已成功匹配！建议主动联系对方，约定模拟面试时间，体验更佳哦～</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-4 bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
                        onClick={() => dispatch({ type: 'TOGGLE_GUIDE' })}
                      >
                        查看面试指南
                      </Button>
                    </div>
                  )}
                  {state.showGuide && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h2 className="text-lg font-bold mb-2">面试流程指引</h2>
                        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700 mb-4">
                          <li>主动联系对方，约定模拟面试时间（建议30-60分钟）。</li>
                          <li>双方可轮流扮演面试官和候选人，提前准备问题。</li>
                          <li>面试结束后，互相给出反馈和建议。</li>
                          <li>有问题可随时查看平台FAQ或联系客服。</li>
                        </ol>
                        <button
                          className="mt-2 px-4 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium"
                          onClick={() => dispatch({ type: 'TOGGLE_GUIDE' })}
                        >
                          关闭
                        </button>
                      </div>
                    </div>
                  )}
                  {state.successfulMatches.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
                      {state.successfulMatches.map((match) => (
                        <Card key={match.id} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
                          <CardHeader>
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg mr-3">
                                {(match.username || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <CardTitle className="text-lg text-gray-800">{match.username || '匿名用户'}</CardTitle>
                                <CardDescription className="text-sm text-gray-500">
                                  {match.jobType || '未设置'} · {match.experienceLevel || '未设置'}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {match.bio && (
                              <p className="text-sm text-gray-600">{match.bio}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {match.practicePreferences?.technicalInterview && (
                                <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">技术面</span>
                              )}
                              {match.practicePreferences?.behavioralInterview && (
                                <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">行为面</span>
                              )}
                              {match.practicePreferences?.caseAnalysis && (
                                <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">案例分析</span>
                              )}
                            </div>
                            {match.contactInfo && (
                              <div className="text-sm text-gray-600">
                                <p className="font-medium mb-1">联系方式：</p>
                                {match.contactInfo.email && (
                                  <a href={`mailto:${match.contactInfo.email}`} className="text-blue-600 hover:text-blue-800 underline block">
                                    {match.contactInfo.email}
                                  </a>
                                )}
                                {match.contactInfo.wechat && (
                                  <p>微信：{match.contactInfo.wechat}</p>
                                )}
                                {match.contactInfo.linkedin && (
                                  <p>LinkedIn：{match.contactInfo.linkedin}</p>
                                )}
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="flex flex-col items-start space-y-4">
                            <div className="flex items-center justify-between w-full">
                              <Button 
                                variant="default"
                                size="sm"
                                onClick={() => handleShowContactTemplates(match)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                联系模板
                              </Button>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium mr-2">是否完成面试？</span>
                                <label className="inline-flex items-center mr-3">
                                  <input
                                    type="radio"
                                    name={`interview_${match.id}`}
                                    value="yes"
                                    checked={state.interviewStatus[match.id] === 'yes'}
                                    onChange={() => handleInterviewChange(match.id, 'yes')}
                                    className="mr-1"
                                  />
                                  是
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`interview_${match.id}`}
                                    value="no"
                                    checked={state.interviewStatus[match.id] === 'no'}
                                    onChange={() => handleInterviewChange(match.id, 'no')}
                                    className="mr-1"
                                  />
                                  否
                                </label>
                              </div>
                            </div>
                            {state.interviewStatus[match.id] === 'yes' && (
                              <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  请填写你的面试反馈：
                                </label>
                                <textarea
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-sm resize-vertical min-h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                  rows={3}
                                  value={state.feedbacks[match.id] || ''}
                                  onChange={e => handleFeedbackChange(match.id, e.target.value)}
                                  placeholder="请描述你的面试体验、收获或建议"
                                  disabled={state.submitted[match.id]}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleFeedbackSubmit(match.id)}
                                  disabled={state.submitted[match.id] || !state.feedbacks[match.id]}
                                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                                >
                                  {state.submitted[match.id] ? '已提交' : '提交反馈'}
                                </Button>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full">
                      <Card className="mx-auto">
                        <CardContent className="text-center py-12">
                          <p className="text-xl mb-4 text-gray-700">暂无成功匹配</p>
                          <p className="text-gray-500">继续浏览候选人，找到合适的练习伙伴吧！</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </>
              )}
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
    </AuthLayout>
  );
}