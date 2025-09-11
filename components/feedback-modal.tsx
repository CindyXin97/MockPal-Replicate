'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Check, MessageCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  partnerName: string;
  onSubmit: (completed: boolean, content?: string) => Promise<void>;
  onClose?: () => void;
  isSubmitting?: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  partnerName,
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showTextArea, setShowTextArea] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (selectedOption === null) return;
    
    try {
      await onSubmit(selectedOption, feedback.trim() || undefined);
      // 重置状态
      setSelectedOption(null);
      setFeedback('');
      setShowTextArea(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleOptionSelect = (completed: boolean) => {
    setSelectedOption(completed);
    if (!completed) {
      // 如果选择了"未完成"，可能想了解原因
      setShowTextArea(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-800 flex-1">
              📝 面试反馈
            </CardTitle>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            你与 <span className="font-semibold text-blue-600">{partnerName}</span> 的面试练习
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 主要问题 */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
              你们完成面试练习了吗？
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* 完成按钮 */}
              <button
                onClick={() => handleOptionSelect(true)}
                disabled={isSubmitting}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedOption === true
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Check size={24} className={selectedOption === true ? 'text-green-600' : 'text-gray-400'} />
                  <span className="font-semibold">✅ 完成了</span>
                  <span className="text-xs text-gray-500">进行了面试练习</span>
                </div>
              </button>

              {/* 未完成按钮 */}
              <button
                onClick={() => handleOptionSelect(false)}
                disabled={isSubmitting}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedOption === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <X size={24} className={selectedOption === false ? 'text-red-600' : 'text-gray-400'} />
                  <span className="font-semibold">❌ 未完成</span>
                  <span className="text-xs text-gray-500">没有进行练习</span>
                </div>
              </button>
            </div>
          </div>

          {/* 可选的详细反馈 */}
          {(selectedOption !== null || showTextArea) && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MessageCircle size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600">
                  想分享更多吗？（可选）
                </span>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  selectedOption === true 
                    ? "分享你的面试体验..." 
                    : "遇到了什么问题吗？"
                }
                disabled={isSubmitting}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-400 text-right">
                {feedback.length}/500
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={selectedOption === null || isSubmitting}
              className={`flex-1 py-3 font-semibold transition-all duration-200 ${
                selectedOption === true
                  ? 'bg-green-600 hover:bg-green-700'
                  : selectedOption === false
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>提交中...</span>
                </div>
              ) : (
                '提交反馈'
              )}
            </Button>
          </div>

          {/* 说明文字 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              💡 提交反馈后才能继续浏览新的候选人
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 