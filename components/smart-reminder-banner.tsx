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
    <Card className="mb-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 max-w-4xl mx-auto">
      <CardContent className="px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Heart size={16} className="text-blue-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 text-sm">
                有 {pendingMatches.length} 个匹配需要更新状态
              </h3>
              <p className="text-xs text-gray-600">
                最早: <span className="font-medium text-blue-600">{oldestMatch.partnerName}</span> ({oldestMatch.daysAgo}天前)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onUpdateStatus?.(oldestMatch.id)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
              >
                <Clock size={12} className="mr-1" />
                更新
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}; 