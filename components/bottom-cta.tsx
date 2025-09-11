'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Clock, Target } from 'lucide-react';

const features = [
  {
    icon: <Users className="w-5 h-5" />,
    text: '专业数据岗位求职者社区'
  },
  {
    icon: <Clock className="w-5 h-5" />,
    text: '24/7 随时找到练习伙伴'
  },
  {
    icon: <Target className="w-5 h-5" />,
    text: '针对性面试题库和反馈'
  }
];

export function BottomCTA() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [currentFeature, setCurrentFeature] = useState(0);

  // 自动轮播特性
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full py-20 px-4 overflow-hidden">
      {/* 背景渐变 */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2b6cb0 50%, #3730a3 100%)'
        }}
      />
      
      {/* 装饰性背景图案 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* 主标题 */}
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            准备好开始你的
            <br />
            <span className="text-yellow-300">面试练习之旅</span>
            了吗？
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            加入数千名数据专业人士，通过真实的模拟面试提升你的求职竞争力
          </p>
        </div>

        {/* 动态特性展示 */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 ${
                  index === currentFeature 
                    ? 'bg-white bg-opacity-20 scale-105 text-white' 
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <div className={`transition-colors duration-300 ${
                  index === currentFeature ? 'text-yellow-300' : 'text-current'
                }`}>
                  {feature.icon}
                </div>
                <span className="font-medium text-sm md:text-base text-gray-900">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 免费标记 */}
        <div className="inline-block bg-yellow-400 text-gray-900 px-6 py-2 rounded-full font-bold text-lg mb-8 shadow-lg">
          🎉 完全免费使用
        </div>

        {/* CTA按钮区域 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          {!isAuthenticated ? (
            <>
              <Button 
                asChild 
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-white text-blue-900 hover:bg-gray-100 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <Link href="/auth?mode=register" className="flex items-center gap-2">
                  立即开始匹配
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-900 transition-all duration-300"
              >
                <Link href="/auth">
                  已有账号？登录
                </Link>
              </Button>
            </>
          ) : (
            <Button 
              asChild 
              size="lg"
              className="px-8 py-4 text-lg font-semibold bg-white text-blue-900 hover:bg-gray-100 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <Link href="/matches" className="flex items-center gap-2">
                进入匹配页面
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          )}
        </div>

        {/* 底部小字说明 */}
        <div className="text-blue-200 text-sm">
          <p className="mb-2">
            ✓ 无需信用卡 &nbsp;&nbsp;•&nbsp;&nbsp; ✓ 注册仅需1分钟 &nbsp;&nbsp;•&nbsp;&nbsp; ✓ 立即开始练习
          </p>
          <p className="text-xs opacity-80">
            加入我们，与来自各大科技公司的数据专家一起提升面试技能
          </p>
        </div>
      </div>
    </section>
  );
}