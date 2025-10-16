'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Clock, Heart } from 'lucide-react';

interface SmartReminderBannerProps {
  pendingMatches: Array<{
    id: number;
    partnerName: string;
    daysAgo: number;
    contactStatus: string;
  }>;
  onDismiss?: () => void;
  onUpdateStatus?: (matchId: number) => void;
}

export const SmartReminderBanner: React.FC<SmartReminderBannerProps> = ({
  pendingMatches,
  onDismiss,
  onUpdateStatus,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || pendingMatches.length === 0) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const oldestMatch = pendingMatches[0]; // 假设已经按时间排序

  return (
    <div className="mb-4 max-w-4xl mx-auto animate-slide-down">
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] rounded-xl overflow-hidden">
        <div className="bg-white rounded-xl">
          <CardContent className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                {/* 动画图标 */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                    <Heart size={20} className="text-white" fill="white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
                    {pendingMatches.length}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                    <span>✨ 别忘了更新匹配状态哦！</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    你和 <span className="font-semibold text-blue-600">{oldestMatch.partnerName}</span> 已匹配 <span className="font-medium text-purple-600">{oldestMatch.daysAgo}天</span>，记得打勾升级～
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    onClick={() => onUpdateStatus?.(oldestMatch.id)}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-4 py-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <Clock size={14} className="mr-1" />
                    去更新
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}; 