'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/public-layout';
import { isAuthenticatedAtom, userAtom } from '@/lib/store';

export default function Home() {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [user] = useAtom(userAtom);

  return (
    <PublicLayout redirectIfAuthenticated={false}>
      <div className="container mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-16 sm:mb-20 lg:mb-24">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo-icon.png"
              alt="MockPal Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            找到你的面试伙伴
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-12">
            专为数据岗位(DA/DS/DE)求职者设计的模拟面试匹配平台
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16">
            {!isAuthenticated || !user ? (
              <>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/login">登录</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/register">注册</Link>
                </Button>
              </>
            ) : (
              <Button asChild className="w-full sm:w-auto">
                <Link href="/matches">开始匹配</Link>
              </Button>
            )}
            <Button asChild variant="ghost" className="w-full sm:w-auto border border-gray-200 text-gray-600 hover:bg-gray-100">
              <Link href="/test-db">测试数据库</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-16 sm:mb-20">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">填写标签</h3>
            <p className="text-gray-600">
              岗位类型、经验水平、目标公司/行业等标签快速描述你的需求
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">匹配伙伴</h3>
            <p className="text-gray-600">
              基于标签匹配最适合的练习伙伴，浏览候选人并选择喜欢的对象
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">开始练习</h3>
            <p className="text-gray-600">
              匹配成功后可查看联系方式，立即开始面试练习
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-16 sm:mb-20">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
            <p className="text-gray-600">活跃用户</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">1000+</div>
            <p className="text-gray-600">成功匹配</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">95%</div>
            <p className="text-gray-600">用户满意度</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">准备好开始你的面试练习了吗？</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            加入MockPal，与志同道合的伙伴一起提升面试技能，实现职业目标
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated || !user ? (
              <>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/register">立即注册</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/login">已有账号？登录</Link>
                </Button>
              </>
            ) : (
              <Button asChild className="w-full sm:w-auto">
                <Link href="/matches">开始匹配</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
