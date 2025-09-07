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
import '@/styles/success.css';

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
      
      // 加载所有用户的成就数据
      const allUserIds = [...potentialMatches, ...successfulMatches].map(match => match.id);
      if (allUserIds.length > 0) {
        loadUserAchievements(allUserIds);
      }
      
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
    
    // 先标记为已提交（乐观更新）
    dispatch({ type: 'SUBMIT_FEEDBACK', payload: matchId });
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          userId: user.id,
          interviewStatus: interviewStatusValue || '',
          content: feedbackContent,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
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

  // 获取用户成就数据
  const getUserAchievementData = (userId: number) => {
    const achievement = userAchievements[userId];
    if (!achievement) {
      return { 
        icon: '🌱', 
        level: '新用户', 
        description: '欢迎加入面试练习',
        showMoon: false
      };
    }

    const levelMap: { [key: string]: any } = {
      '新用户': { icon: '🌱', description: '欢迎加入面试练习', showMoon: false },
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

  // 渲染成就等级的函数
  const renderAchievement = (userId: number) => {
    const achievement = getUserAchievementData(userId);
    
    return (
      <div className="flex flex-col items-center justify-center mt-2">
        {/* 成就图标和等级 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{achievement.icon}</span>
          <span className="text-sm font-semibold text-gray-700">{achievement.level}</span>
          {achievement.showMoon && (
            <span className="text-blue-400 text-lg">🌙</span>
          )}
        </div>
        
        {/* 描述文字 */}
        <div className="text-xs text-gray-500 text-center">
          {achievement.description}
        </div>
      </div>
    );
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
              浏览候选人
            </button>
            <button
              className={state.activeTab === "matches" ? "active" : ""}
              onClick={() => dispatch({ type: "SET_TAB", payload: "matches" })}
            >
              成功匹配
            </button>
          </div>
        </div>

        {/* 响应式内容区域 */}
        <div className="responsive-container">
          <Tabs value={state.activeTab} onValueChange={(value) => dispatch({ type: 'SET_TAB', payload: value })} className="w-full">
            <TabsContent value="browse" className="space-y-4 mt-8">
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
                  <div className="flex justify-center gap-6 mt-8">
                    <div className="h-10 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-10 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </Card>
              ) : !isComplete ? (
                <Card className="w-full max-w-xl mx-auto rounded-3xl shadow-xl border-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-10 flex flex-col items-center mt-4">
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
                    <Card className="w-full max-w-lg mx-auto rounded-3xl shadow-xl border-0 bg-white p-5 mt-4">
                      <div className="flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full bg-blue-50 shadow flex items-center justify-center mb-4 border-4 border-white">
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
                    <Card className="w-full max-w-xl mx-auto rounded-[2.5rem] shadow-2xl border-0 bg-gradient-to-br from-blue-100 via-white to-blue-200 p-10 flex flex-col items-center mt-4">
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
            <TabsContent value="matches" className="space-y-4 mt-8">
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
                  {state.activeTab === 'matches' && state.showBanner && (
                    <div className="notification yellow">
                      <div className="message">
                        <span className="icon">🎉</span>
                        恭喜匹配成功！记得及时填写面试反馈，这将帮助系统为你和他人匹配到更合适的练习伙伴哦～
                      </div>
                      <div className="action">
                        <button onClick={() => dispatch({ type: 'TOGGLE_BANNER' })}>
                          我知道了
                        </button>
                      </div>
                    </div>
                  )}
                  {state.activeTab === 'matches' && (
                    <div className="notification blue">
                      <div className="message">
                        <span className="icon">🎯</span>
                        已成功匹配！建议主动联系对方，约定模拟面试时间，体验更佳哦～
                      </div>
                      <div className="action">
                        <button onClick={() => dispatch({ type: 'TOGGLE_GUIDE' })}>
                          查看面试指南
                        </button>
                      </div>
                    </div>
                  )}
                  {state.activeTab === 'matches' && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <span className="text-xl mr-3">🏆</span>
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-2">成就等级系统</p>
                          <p className="mb-2">完成面试获得经验，提升等级！每次成功面试都会让你更接近下一个成就！</p>
                          <div className="text-xs leading-relaxed">
                            🌱<span className="font-medium">新用户</span>(0次) → ⭐<span className="font-medium">面试新手</span>(1-4次) → 🌟<span className="font-medium">面试新星</span>(5-9次) → 🌙<span className="font-medium">面试达人</span>(10-14次) → 👑<span className="font-medium">面试导师</span>(15次+)
                          </div>
                        </div>
                      </div>
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
                    <div className="cards-container">
                      {state.successfulMatches.map((match) => (
                        <div key={match.id} className="card">
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
                                         <span className="text-blue-400 text-xs">🌙</span>
                                       )}
                                     </>
                                   );
                                 })()}
                               </div>
                              <div className="title">
                                {match.jobType || '未设置'} · {match.experienceLevel || '未设置'}
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
                                onClick={() => handleFeedbackSubmit(match.id)}
                                disabled={state.submitted[match.id] || !state.feedbacks[match.id]}
                              >
                                {state.submitted[match.id] ? '已提交' : '提交反馈'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
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