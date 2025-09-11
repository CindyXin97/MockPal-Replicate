'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/base-layout';
import { MatchStatusCard } from '@/components/match-status-card';
import { SmartReminderBanner } from '@/components/smart-reminder-banner';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const TestFeedbackV2Page = () => {
  const [matches, setMatches] = useState([
    {
      id: 1,
      partnerName: '张小明',
      contactStatus: 'not_contacted',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天前
      contactUpdatedAt: undefined,
    },
    {
      id: 2,
      partnerName: '李小红',
      contactStatus: 'contacted',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5天前
      contactUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1天前更新
    },
    {
      id: 3,
      partnerName: '王小华',
      contactStatus: 'scheduled',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天前
      contactUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天前更新
    }
  ]);

  const [showReminder, setShowReminder] = useState(true);

  const handleStatusUpdate = (matchId: number, newStatus: string) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, contactStatus: newStatus, contactUpdatedAt: new Date().toISOString() }
        : match
    ));
  };

  const pendingMatches = matches
    .filter(match => match.contactStatus === 'not_contacted')
    .map(match => ({
      id: match.id,
      partnerName: match.partnerName,
      daysAgo: Math.floor((Date.now() - new Date(match.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      contactStatus: match.contactStatus
    }));

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              🔄 渐进式反馈系统 v2.0
            </CardTitle>
            <p className="text-center text-gray-600">
              解决硬绑定问题的智能反馈机制
            </p>
          </CardHeader>
        </Card>

        {/* 智能提醒横幅 */}
        {showReminder && (
          <SmartReminderBanner
            pendingMatches={pendingMatches}
            onDismiss={() => setShowReminder(false)}
            onUpdateStatus={(matchId) => {
              console.log('跳转到匹配', matchId);
              // 这里可以滚动到对应的匹配卡片
            }}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 核心改进 */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                <CheckCircle size={20} />
                核心改进
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  ✅ 零阻断体验
                </Badge>
                <p className="text-sm text-gray-700">用户可以立即继续浏览，不会被强制中断</p>
              </div>
              
              <div className="space-y-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  🕐 合理时间窗口
                </Badge>
                <p className="text-sm text-gray-700">给用户足够时间安排和进行面试</p>
              </div>
              
              <div className="space-y-2">
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  📊 渐进式收集
                </Badge>
                <p className="text-sm text-gray-700">分阶段收集数据，更加自然</p>
              </div>
            </CardContent>
          </Card>

          {/* 用户体验流程 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                <Clock size={20} />
                时间线设计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">1</div>
                  <span className="text-sm">匹配成功 - 立即可继续</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">2</div>
                  <span className="text-sm">智能提醒 - 3天后温和提醒</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">3</div>
                  <span className="text-sm">状态跟踪 - 用户主动更新</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">4</div>
                  <span className="text-sm">持续优化 - 基于数据改进</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 数据收集优势 */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                <AlertTriangle size={20} />
                数据收集
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">仍然能收集到：</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 联系成功率</li>
                  <li>• 面试安排率</li>
                  <li>• 面试完成率</li>
                  <li>• 用户活跃度</li>
                  <li>• 匹配质量指标</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">额外优势：</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 更高的数据质量</li>
                  <li>• 更好的用户体验</li>
                  <li>• 更长期的用户留存</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 匹配状态卡片示例 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 匹配状态管理</h2>
          
          {matches.map((match) => (
            <MatchStatusCard
              key={match.id}
              match={match}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>

        {/* 说明文档 */}
        <Card className="mt-8 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              📖 系统说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🎯 解决的问题</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 单向匹配无反馈对象的问题</li>
                  <li>• 匹配后需要时间安排的现实情况</li>
                  <li>• 硬绑定破坏用户体验的问题</li>
                  <li>• 数据收集与用户体验的平衡</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">💡 设计原则</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 用户体验优先，不强制阻断</li>
                  <li>• 渐进式数据收集</li>
                  <li>• 智能提醒，温和引导</li>
                  <li>• 多入口反馈，方便更新</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default TestFeedbackV2Page; 