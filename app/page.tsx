'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/public-layout';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function handleResize() {
      const idealHeight = 900; // 理想内容高度
      // 只在内容高度大于窗口时缩放
      const ratio = window.innerHeight < idealHeight ? window.innerHeight / idealHeight : 1;
      setScale(ratio);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <PublicLayout redirectIfAuthenticated={false}>
      {/* 全屏背景渐变 */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-[70vh] items-center justify-center w-full">
        <div
          className="relative flex flex-col items-center justify-center text-center -mt-16"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center', height: scale < 1 ? `${900 * scale}px` : 'auto' }}
        >
          <div className="w-full max-w-5xl mx-auto">
            <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-gray-900">
              找到你的
              <span className="text-blue-500">面试伙伴</span>
            </h1>
            <p className="text-2xl mb-10 max-w-2xl text-gray-700 font-medium mx-auto">
              专为数据岗位(DA/DS/DE)求职者设计的模拟面试匹配平台
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 w-full">
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-gray-100 w-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
                <div className="text-4xl mb-3 bg-gray-100 rounded-full w-14 h-14 flex items-center justify-center">👤</div>
                <h2 className="text-xl font-bold mb-1 text-gray-900">填写标签</h2>
                <p className="text-base text-gray-500 leading-relaxed">
                  岗位类型、经验水平、目标公司/行业等标签快速描述你的需求
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-gray-100 w-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
                <div className="text-4xl mb-3 bg-gray-100 rounded-full w-14 h-14 flex items-center justify-center">🔍</div>
                <h2 className="text-xl font-bold mb-1 text-gray-900">匹配伙伴</h2>
                <p className="text-base text-gray-500 leading-relaxed">
                  基于标签匹配最适合的练习伙伴，浏览候选人并选择喜欢的对象
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-gray-100 w-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
                <div className="text-4xl mb-3 bg-gray-100 rounded-full w-14 h-14 flex items-center justify-center">🤝</div>
                <h2 className="text-xl font-bold mb-1 text-gray-900">开始练习</h2>
                <p className="text-base text-gray-500 leading-relaxed">
                  匹配成功后可查看联系方式，立即开始面试练习
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 justify-center mt-2">
              {!isAuthenticated || !user ? (
                <>
                  <Button asChild className="px-10 py-2 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md hover:from-blue-600 hover:to-indigo-600">
                    <Link href="/auth">登录</Link>
                  </Button>
                  <Button asChild variant="outline" className="px-10 py-2 text-lg font-semibold border-blue-500 text-blue-600 hover:bg-blue-50">
                    <Link href="/auth?mode=register">注册</Link>
                  </Button>
                </>
              ) : null}
              <Button asChild variant="ghost" className="px-10 py-2 text-lg font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100">
                <Link href="/test-db">测试数据库</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
