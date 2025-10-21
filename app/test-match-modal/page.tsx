'use client';

import { useState } from 'react';
import { FirstMatchModal } from '@/components/first-match-modal';
import { Button } from '@/components/ui/button';

export default function TestMatchModalPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="text-center space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            测试匹配成功弹窗
          </h1>
          <p className="text-gray-600 mb-6">
            点击下面的按钮预览新设计的匹配成功弹窗 ✨
          </p>
          
          <Button
            onClick={() => setIsOpen(true)}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            🎉 打开匹配成功弹窗
          </Button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>提示：</strong>
            </p>
            <ul className="text-xs text-gray-600 mt-2 space-y-1 text-left">
              <li>• 点击弹窗外部或右上角 X 可关闭</li>
              <li>• 注意查看飘落的庆祝动画</li>
              <li>• 心形图标有跳动效果</li>
              <li>• 渐变色彩和流畅动画</li>
            </ul>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <p>访问路径: <code className="bg-gray-200 px-2 py-1 rounded">localhost:3000/test-match-modal</code></p>
        </div>
      </div>

      <FirstMatchModal
        isOpen={isOpen}
        partnerName="Pathy"
        onClose={() => setIsOpen(false)}
        onStartContact={() => {
          console.log('点击了"马上联系TA"按钮');
          alert('在实际应用中，这里会跳转到匹配详情页面');
        }}
      />
    </div>
  );
}

