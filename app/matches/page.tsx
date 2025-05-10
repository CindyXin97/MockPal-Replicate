'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { userAtom, potentialMatchesAtom, currentMatchIndexAtom } from '@/lib/store';
import { AuthLayout } from '@/components/auth-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { fetchPotentialMatches, likeUser, dislikeUser, fetchSuccessfulMatches } from '@/app/actions/matching';
import { Match } from '@/lib/store';

export default function MatchesPage() {
  const router = useRouter();
  const [user] = useAtom(userAtom);
  const [potentialMatches, setPotentialMatches] = useAtom(potentialMatchesAtom);
  const [currentMatchIndex, setCurrentMatchIndex] = useAtom(currentMatchIndexAtom);
  const [successfulMatches, setSuccessfulMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');

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
      if (potentialResult.success && 'matches' in potentialResult) {
        setPotentialMatches(potentialResult.matches);
        setCurrentMatchIndex(0);
      } else if (potentialResult.message) {
        toast.error(potentialResult.message);
      }

      // Load successful matches
      const successfulResult = await fetchSuccessfulMatches(user.id);
      if (successfulResult.success && 'matches' in successfulResult) {
        setSuccessfulMatches(successfulResult.matches);
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
        if (result.match) {
          // If it's a match, reload the successful matches
          toast.success(result.message || '匹配成功！');
          const successfulResult = await fetchSuccessfulMatches(user.id);
          if (successfulResult.success && 'matches' in successfulResult) {
            setSuccessfulMatches(successfulResult.matches);
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

  return (
    <AuthLayout>
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
                <Card className="w-full max-w-2xl mx-auto">
                  <CardHeader className="text-center">
                    <Avatar className="w-24 h-24 mx-auto">
                      <div className="flex items-center justify-center w-full h-full bg-primary text-primary-foreground text-2xl font-bold">
                        {currentMatch.username.charAt(0).toUpperCase()}
                      </div>
                    </Avatar>
                    <CardTitle className="mt-4 text-2xl">{currentMatch.username}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">岗位类型</p>
                        <p className="font-medium">{currentMatch.jobType}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">经验水平</p>
                        <p className="font-medium">{currentMatch.experienceLevel}</p>
                      </div>
                    </div>

                    {(currentMatch.targetCompany || currentMatch.targetIndustry) && (
                      <div className="grid grid-cols-2 gap-4">
                        {currentMatch.targetCompany && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">目标公司</p>
                            <p className="font-medium">{currentMatch.targetCompany}</p>
                          </div>
                        )}
                        {currentMatch.targetIndustry && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">目标行业</p>
                            <p className="font-medium">{currentMatch.targetIndustry}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">期望练习内容</p>
                      <div className="flex gap-2 flex-wrap">
                        {currentMatch.practicePreferences?.technicalInterview && (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                            技术面
                          </span>
                        )}
                        {currentMatch.practicePreferences?.behavioralInterview && (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                            行为面
                          </span>
                        )}
                        {currentMatch.practicePreferences?.caseAnalysis && (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                            案例分析
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center gap-4">
                    <Button variant="outline" size="lg" onClick={handleDislike}>
                      跳过
                    </Button>
                    <Button size="lg" onClick={handleLike}>
                      匹配
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="w-full max-w-2xl mx-auto">
                  <CardContent className="text-center py-12">
                    <p className="text-xl mb-4">没有更多候选人了</p>
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
                              {match.jobType} · {match.experienceLevel}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">练习内容</p>
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
                        <div className="space-y-1">
                          <p className="text-sm font-medium">联系方式</p>
                          {match.contactInfo?.email && (
                            <p className="text-sm">
                              <span className="font-medium">邮箱：</span>
                              {match.contactInfo.email}
                            </p>
                          )}
                          {match.contactInfo?.wechat && (
                            <p className="text-sm">
                              <span className="font-medium">微信：</span>
                              {match.contactInfo.wechat}
                            </p>
                          )}
                          {!match.contactInfo?.email && !match.contactInfo?.wechat && (
                            <p className="text-sm text-muted-foreground">用户未提供联系方式</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="w-full">
                  <CardContent className="text-center py-12">
                    <p className="text-xl mb-4">暂无匹配成功的用户</p>
                    <p className="text-muted-foreground">
                      去「浏览候选人」选项卡匹配感兴趣的用户吧！
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
} 