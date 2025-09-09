'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/base-layout';
import { FeedbackModal } from '@/components/feedback-modal';

const TestFeedbackPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackSubmit = async (completed: boolean, content?: string) => {
    setIsSubmitting(true);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('反馈提交:', { completed, content });
    alert(`反馈已提交！\n完成状态: ${completed ? '是' : '否'}\n内容: ${content || '无'}`);
    
    setIsSubmitting(false);
    setShowModal(false);
  };

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              🧪 硬绑定反馈机制测试
            </CardTitle>
            <p className="text-center text-gray-600">
              测试新的反馈收集系统
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 功能说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-600">
                ✨ 新功能特点
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <p className="font-semibold">硬绑定机制</p>
                    <p className="text-sm text-gray-600">必须提供反馈才能继续浏览候选人</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-blue-500 mt-1">⚡</span>
                  <div>
                    <p className="font-semibold">轻量化设计</p>
                    <p className="text-sm text-gray-600">只需点击 ✅/❌，可选详细反馈</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-purple-500 mt-1">📊</span>
                  <div>
                    <p className="font-semibold">数据收集</p>
                    <p className="text-sm text-gray-600">为MVP阶段提供有价值的用户行为数据</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 mt-1">🚫</span>
                  <div>
                    <p className="font-semibold">防止跳过</p>
                    <p className="text-sm text-gray-600">用户无法绕过反馈直接浏览新匹配</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 测试控制 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">
                🎮 测试控制
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  打开反馈弹窗
                </Button>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">测试流程:</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. 点击上方按钮打开反馈弹窗</li>
                    <li>2. 选择 ✅完成 或 ❌未完成</li>
                    <li>3. 可选填写详细反馈</li>
                    <li>4. 点击提交按钮</li>
                    <li>5. 查看提交结果</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 用户流程说明 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              🔄 用户体验流程
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">👥</div>
                <h4 className="font-semibold text-blue-700">匹配成功</h4>
                <p className="text-xs text-gray-600 mt-1">用户与候选人匹配</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">💬</div>
                <h4 className="font-semibold text-green-700">进行面试</h4>
                <p className="text-xs text-gray-600 mt-1">双方联系进行练习</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl mb-2">📝</div>
                <h4 className="font-semibold text-orange-700">强制反馈</h4>
                <p className="text-xs text-gray-600 mt-1">必须提供面试反馈</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">🔄</div>
                <h4 className="font-semibold text-purple-700">继续匹配</h4>
                <p className="text-xs text-gray-600 mt-1">解锁新的候选人</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 反馈弹窗 */}
        <FeedbackModal
          isOpen={showModal}
          partnerName="测试用户"
          onSubmit={handleFeedbackSubmit}
          onClose={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      </div>
    </AuthLayout>
  );
};

export default TestFeedbackPage; 