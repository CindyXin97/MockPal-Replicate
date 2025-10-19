'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white relative overflow-hidden">
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <CardContent className="p-8 relative">
            {/* 标题区域 */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                匹配成功
              </h2>
              <p className="text-gray-600 text-base">
                你和 <span className="font-semibold text-gray-800">{partnerName}</span> 互相喜欢
              </p>
            </div>

            {/* 接下来的步骤 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-5">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">📱</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">联系TA约定时间</p>
                    <p className="text-xs text-gray-600">获取联系方式，约定1小时</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">🎯</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">查看真题进行Mock</p>
                    <p className="text-xs text-gray-600">20-25分钟Mock + 10-15分钟反馈</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">提交反馈</p>
                    <p className="text-xs text-gray-600">完成反馈可升级，优先被推荐</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 按钮区域 */}
            <div className="space-y-2">
              <Button
                onClick={handleStartContact}
                className="w-full text-white font-medium py-3 rounded-lg transition-all"
                style={{ backgroundColor: '#2b6cb0' }}
              >
                联系TA
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full border bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-lg transition-all"
              >
                继续浏览
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

