'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, TrendingUp, Lock, CheckCircle } from 'lucide-react';

interface FirstMatchModalProps {
  isOpen: boolean;
  partnerName: string;
  onClose: () => void;
  onStartContact?: () => void;
}

export const FirstMatchModal: React.FC<FirstMatchModalProps> = ({
  isOpen,
  partnerName,
  onClose,
  onStartContact,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleStartContact = () => {
    onStartContact?.();
    handleClose();
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={20} />
          </button>

          {/* 装饰性背景 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>

          <CardContent className="p-8 relative">
            {/* 标题区域 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4 animate-bounce">
                <Sparkles className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🎊 太棒了！首次匹配成功！
              </h2>
              <p className="text-gray-600">
                你和 <span className="font-semibold text-blue-600">{partnerName}</span> 互相喜欢啦！
              </p>
            </div>

            {/* 提示信息 - 方案A */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg">📱</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">记得联系TA约时间</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">联系后回来打勾，提交反馈</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp size={16} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">完成反馈可升级，优先被推荐</p>
                </div>
              </div>
            </div>

            {/* 按钮区域 */}
            <div className="space-y-2">
              <Button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                继续浏览更多 🔍
              </Button>
              <Button
                onClick={handleStartContact}
                variant="outline"
                className="w-full border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-all"
              >
                联系TA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

