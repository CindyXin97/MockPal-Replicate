'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { userAtom, potentialMatchesAtom, currentMatchIndexAtom } from '@/lib/store';
import { AuthLayout } from '@/components/auth-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { fetchPotentialMatches, likeUser, dislikeUser, fetchSuccessfulMatches } from '@/app/actions/matching';
import type { Match } from '@/lib/store';
import React from 'react';

export default function MatchesPage() {
  const router = useRouter();
  const [user] = useAtom(userAtom);
  const [potentialMatches, setPotentialMatches] = useAtom(potentialMatchesAtom);
  const [currentMatchIndex, setCurrentMatchIndex] = useAtom(currentMatchIndexAtom);
  const [successfulMatches, setSuccessfulMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [interviewStatus, setInterviewStatus] = useState<{ [key: number]: 'yes' | 'no' | undefined }>({});
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState<{ [key: number]: boolean }>({});
  const [showBanner, setShowBanner] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load potential matches
      const potentialResult = await fetchPotentialMatches(user.id);
      if (potentialResult.success && 'matches' in potentialResult && potentialResult.matches) {
        setPotentialMatches(potentialResult.matches);
        setCurrentMatchIndex(0);
      } else if (potentialResult.message) {
        toast.error(potentialResult.message);
      }

      // Load successful matches
      const successfulResult = await fetchSuccessfulMatches(user.id);
      if (successfulResult.success && 'matches' in successfulResult && successfulResult.matches) {
        setSuccessfulMatches(successfulResult.matches.filter(match => match !== null) as Match[]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('获取匹配失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || potentialMatches.length === 0 || currentMatchIndex >= potentialMatches.length) {
      return;
    }

    const targetUser = potentialMatches[currentMatchIndex];
    try {
      const result = await likeUser(user.id, targetUser.id);
      
      if (result.success) {
        if ('match' in result && result.match) {
          // If it's a match, reload the successful matches
          toast.success(result.message || '匹配成功！');
          const successfulResult = await fetchSuccessfulMatches(user.id);
          if (successfulResult.success && 'matches' in successfulResult && successfulResult.matches) {
            setSuccessfulMatches(successfulResult.matches.filter(match => match !== null) as Match[]);
          }
        } else {
          toast.success(result.message || '已收到你的喜欢！');
        }
        
        // Move to next potential match
        setCurrentMatchIndex(currentMatchIndex + 1);
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('操作失败，请稍后再试');
    }
  };

  const handleDislike = async () => {
    if (!user || potentialMatches.length === 0 || currentMatchIndex >= potentialMatches.length) {
      return;
    }

    const targetUser = potentialMatches[currentMatchIndex];
    try {
      const result = await dislikeUser(user.id, targetUser.id);
      
      if (result.success) {
        // Move to next potential match
        setCurrentMatchIndex(currentMatchIndex + 1);
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

  const currentMatch = potentialMatches.length > 0 && currentMatchIndex < potentialMatches.length
    ? potentialMatches[currentMatchIndex]
    : null;

  const handleInterviewChange = (id: number, value: 'yes' | 'no') => {
    setInterviewStatus(prev => ({ ...prev, [id]: value }));
  };

  const handleFeedbackChange = (id: number, value: string) => {
    setFeedbacks(prev => ({ ...prev, [id]: value }));
  };

  const handleFeedbackSubmit = async (matchId: number) => {
    if (!user) return;
    const interviewStatusValue = interviewStatus[matchId];
    const feedbackContent = feedbacks[matchId] || '';
    setSubmitted(prev => ({ ...prev, [matchId]: true }));
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
      setSubmitted(prev => ({ ...prev, [matchId]: false }));
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col min-h-screen pt-20">
        <div className="w-full max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="browse">浏览候选人</TabsTrigger>
              <TabsTrigger value="matches">成功匹配</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">加载中...</div>
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
                      </div>
                      <div className="grid grid-cols-2 gap-8 my-6">
                        <div>
                          <div className="text-blue-500 font-semibold flex items-center gap-1 text-base">岗位类型</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.jobType || '未设置'}</div>
                          <div className="mt-4 text-blue-500 font-semibold flex items-center gap-1 text-base">目标公司</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.targetCompany || '未设置'}</div>
                        </div>
                        <div>
                          <div className="text-blue-500 font-semibold flex items-center gap-1 text-base">经验水平</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.experienceLevel || '未设置'}</div>
                          <div className="mt-4 text-blue-500 font-semibold flex items-center gap-1 text-base">目标行业</div>
                          <div className="font-bold text-lg text-gray-700">{currentMatch.targetIndustry || '未设置'}</div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-6 mt-8">
                        <Button variant="outline" size="lg" className="rounded-full px-8 py-2 text-lg font-bold border-blue-200 text-blue-500 bg-white hover:bg-blue-50 shadow transition-all">
                          跳过
                        </Button>
                        <Button size="lg" className="rounded-full px-8 py-2 text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow hover:scale-105 transition-all">
                          匹配
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="w-full max-w-2xl mx-auto">
                      <CardContent className="text-center py-12">
                        <p className="text-xl mb-4">今日推荐已用完，请明天再来哦～</p>
                        <Button onClick={resetMatches}>重新加载</Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="matches" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">加载中...</div>
              ) : (
                <>
                  {activeTab === 'matches' && showBanner && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-700 p-4 mb-4 flex items-center justify-between">
                      <span>🎉 恭喜匹配成功！记得及时填写面试反馈，这将帮助系统为你和他人匹配到更合适的练习伙伴哦～</span>
                      <button
                        onClick={() => setShowBanner(false)}
                        className="ml-4 px-3 py-1 rounded bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-medium transition-colors"
                      >
                        我知道了
                      </button>
                    </div>
                  )}
                  {activeTab === 'matches' && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 mb-4 rounded flex items-center justify-between">
                      <span>🎯 已成功匹配！建议主动联系对方，约定模拟面试时间，体验更佳哦～</span>
                      <button
                        className="ml-4 px-3 py-1 rounded bg-blue-300 hover:bg-blue-400 text-blue-900 font-medium transition-colors"
                        onClick={() => setShowGuide(true)}
                      >
                        查看面试指南
                      </button>
                    </div>
                  )}
                  {showGuide && (
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
                          onClick={() => setShowGuide(false)}
                        >
                          关闭
                        </button>
                      </div>
                    </div>
                  )}
                  {successfulMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {successfulMatches.map((match) => (
                        <Card key={match.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <div className="flex items-center justify-center w-full h-full bg-primary text-primary-foreground font-bold">
                                  {match.username.charAt(0).toUpperCase()}
                                </div>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{match.username}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {match.jobType || '未设置'} · {match.experienceLevel || '未设置'}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-2">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">期望练习内容</p>
                              <div className="flex gap-2 flex-wrap">
                                {match.practicePreferences?.technicalInterview && (
                                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                                    技术面
                                  </span>
                                )}
                                {match.practicePreferences?.behavioralInterview && (
                                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                                    行为面
                                  </span>
                                )}
                                {match.practicePreferences?.caseAnalysis && (
                                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                                    案例分析
                                  </span>
                                )}
                              </div>
                            </div>
                            {match.contactInfo && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium">联系方式</p>
                                {match.contactInfo.email && (
                                  <p className="text-sm text-muted-foreground">
                                    邮箱：{match.contactInfo.email}
                                  </p>
                                )}
                                {match.contactInfo.wechat && (
                                  <p className="text-sm text-muted-foreground">
                                    微信：{match.contactInfo.wechat}
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="mt-4 flex items-center gap-4">
                              <span className="text-sm font-medium">是否进行面试？</span>
                              <label className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  name={`interview_${match.id}`}
                                  value="yes"
                                  checked={interviewStatus[match.id] === 'yes'}
                                  onChange={() => handleInterviewChange(match.id, 'yes')}
                                />
                                是
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  name={`interview_${match.id}`}
                                  value="no"
                                  checked={interviewStatus[match.id] === 'no'}
                                  onChange={() => handleInterviewChange(match.id, 'no')}
                                />
                                否
                              </label>
                            </div>
                            {interviewStatus[match.id] === 'yes' && (
                              <div className="mt-2">
                                <label className="block text-sm font-medium mb-1">请填写你的面试反馈：</label>
                                <textarea
                                  className="w-full border rounded p-2 mb-2"
                                  rows={3}
                                  value={feedbacks[match.id] || ''}
                                  onChange={e => handleFeedbackChange(match.id, e.target.value)}
                                  placeholder="请描述你的面试体验、收获或建议"
                                  disabled={submitted[match.id]}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleFeedbackSubmit(match.id)}
                                  disabled={submitted[match.id] || !feedbacks[match.id]}
                                >
                                  {submitted[match.id] ? '已提交' : '提交反馈'}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="w-full max-w-2xl mx-auto">
                      <CardContent className="text-center py-12">
                        <p className="text-xl mb-4">暂无成功匹配</p>
                        <p className="text-muted-foreground mb-4">
                          继续浏览候选人，找到你的练习伙伴
                        </p>
                        <Button onClick={() => setActiveTab('browse')}>浏览候选人</Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthLayout>
  );
}