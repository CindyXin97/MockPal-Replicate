'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

interface MatchStatusCardProps {
  match: {
    id: number;
    partnerName: string;
    partnerAvatar?: string;
    contactStatus: string;
    createdAt: string;
    contactUpdatedAt?: string;
  };
  onStatusUpdate?: (matchId: number, status: string) => void;
}

const statusConfig = {
  not_contacted: {
    label: '还未联系',
    color: 'bg-gray-100 text-gray-700',
    icon: Clock,
    description: '匹配成功！可以开始联系了'
  },
  contacted: {
    label: '已联系',
    color: 'text-white',
    icon: MessageCircle,
    description: '太好了！你们已经开始沟通',
    style: { backgroundColor: '#2563EB' }
  },
  scheduled: {
    label: '已安排面试',
    color: 'bg-purple-100 text-purple-700',
    icon: Calendar,
    description: '面试时间已确定，加油！'
  },
  completed: {
    label: '已完成面试',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    description: '面试练习完成，希望对你有帮助'
  },
  no_response: {
    label: '对方未回应',
    color: 'bg-orange-100 text-orange-700',
    icon: AlertCircle,
    description: '没关系，继续寻找其他练习伙伴'
  }
};

export const MatchStatusCard: React.FC<MatchStatusCardProps> = ({ 
  match, 
  onStatusUpdate 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);

  const currentStatus = statusConfig[match.contactStatus as keyof typeof statusConfig] || statusConfig.not_contacted;
  const StatusIcon = currentStatus.icon;

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/matches/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          contactStatus: newStatus
        })
      });

      if (!response.ok) throw new Error('更新失败');

      toast.success('状态已更新！');
      onStatusUpdate?.(match.id, newStatus);
      setShowStatusOptions(false);
    } catch (error) {
      toast.error('更新失败，请稍后再试');
    } finally {
      setIsUpdating(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}小时前`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}天前`;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4" style={{borderLeftColor: '#3B82F6', borderColor: '#BFDBFE'}}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '2px solid #BFDBFE'}}>
              <Users size={20} style={{color: '#3B82F6'}} />
            </div>
            <div>
              <CardTitle className="text-lg">{match.partnerName}</CardTitle>
              <p className="text-sm text-gray-500">匹配于 {getTimeAgo(match.createdAt)}</p>
            </div>
          </div>
          
          <Badge className={`${currentStatus.color} border-0`} style={currentStatus.style}>
            <StatusIcon size={14} className="mr-1" />
            {currentStatus.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{currentStatus.description}</p>

        {!showStatusOptions ? (
          <Button
            onClick={() => setShowStatusOptions(true)}
            variant="outline"
            className="w-full"
            disabled={match.contactStatus === 'completed'}
          >
            {match.contactStatus === 'completed' ? '面试已完成' : '更新状态'}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">选择当前状态：</p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(statusConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={key}
                    onClick={() => handleStatusUpdate(key)}
                    disabled={isUpdating}
                    variant={match.contactStatus === key ? "default" : "outline"}
                    className="justify-start text-left h-auto py-3"
                  >
                    <Icon size={16} className="mr-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs opacity-70">{config.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
            <Button
              onClick={() => setShowStatusOptions(false)}
              variant="ghost"
              className="w-full mt-2"
              disabled={isUpdating}
            >
              取消
            </Button>
          </div>
        )}

        {match.contactUpdatedAt && (
          <p className="text-xs text-gray-400 text-center">
            状态更新于 {getTimeAgo(match.contactUpdatedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}; 