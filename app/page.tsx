'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { AdvantageComparison } from '@/components/advantage-comparison';
import { FAQSection } from '@/components/faq-section';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  // 滚动动画hooks - 为4个步骤卡片分别创建
  const step1 = useScrollAnimation({ threshold: 0.3 });
  const step2 = useScrollAnimation({ threshold: 0.3 });
  const step3 = useScrollAnimation({ threshold: 0.3 });
  const step4 = useScrollAnimation({ threshold: 0.3 });

  return (
    <div className="min-h-screen w-full">
      <Header />
      
      {/* 横幅区域 - 浅蓝色背景，完全自适应 */}
      <section 
        className="w-full text-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: '#eef4ff',
          minHeight: 'calc(60vh - 80px)', // 减小高度到60vh
          paddingTop: '80px' // 增加与header的距离，整体往下移
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* 增加顶部间距，让标题往下移 */}
          <div className="pt-6 sm:pt-8 lg:pt-10">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 lg:mb-6 animate-fadeInDown"
              style={{ animationDelay: '0ms' }}
            >
              <span style={{ color: '#2b6cb0' }}>找到你的</span><span style={{ color: '#157ff1' }}>面试伙伴</span>
            </h1>
            <p
              className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10 text-gray-600 max-w-3xl mx-auto animate-fadeInDown"
              style={{ animationDelay: '150ms' }}
            >
              专为数据岗位求职者设计的模拟面试匹配平台
            </p>
          </div>

          {/* 三个功能卡片 - 完全响应式，增加宽度和下移 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mt-6 sm:mt-8 lg:mt-10 max-w-6xl mx-auto">
            <div
              className="bg-white rounded-xl p-5 sm:p-6 lg:p-7 text-center transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] animate-fadeInUp"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.05)',
                animationDelay: '300ms'
              }}
            >
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-xl sm:text-2xl"
                style={{
                  backgroundColor: '#e2e8f0',
                  color: '#2b6cb0'
                }}
              >
                📝
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-3" style={{ color: '#2b6cb0' }}>
                填写标签
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                岗位类型、经验水平、目标公司/行业等标签快速描述你的需求
              </p>
            </div>

            <div
              className="bg-white rounded-xl p-5 sm:p-6 lg:p-7 text-center transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] animate-fadeInUp"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.05)',
                animationDelay: '450ms'
              }}
            >
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-xl sm:text-2xl"
                style={{
                  backgroundColor: '#e2e8f0',
                  color: '#2b6cb0'
                }}
              >
                🤝
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-3" style={{ color: '#2b6cb0' }}>
                匹配伙伴
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                根据你的标签匹配适合的练习伙伴，浏览候选人并选择喜欢的对象
              </p>
            </div>

            <div
              className="bg-white rounded-xl p-5 sm:p-6 lg:p-7 text-center transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] md:col-span-2 lg:col-span-1 animate-fadeInUp"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.05)',
                animationDelay: '600ms'
              }}
            >
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-xl sm:text-2xl"
                style={{
                  backgroundColor: '#e2e8f0',
                  color: '#2b6cb0'
                }}
              >
                🚀
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-3" style={{ color: '#2b6cb0' }}>
                开始练习
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                匹配成功后可查看联系方式，立即开始面试练习
              </p>
            </div>
          </div>

          {/* 按钮组 - 响应式 */}
          {!isAuthenticated || !user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6 sm:mt-8 lg:mt-10">
              <Button 
                asChild 
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white rounded transition-all"
                style={{
                  background: '#2b6cb0',
                  borderColor: '#2b6cb0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2c5282';
                  e.currentTarget.style.borderColor = '#2c5282';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2b6cb0';
                  e.currentTarget.style.borderColor = '#2b6cb0';
                }}
              >
                <Link href="/auth">立即登录</Link>
              </Button>
              <Button 
                asChild 
                variant="outline"
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold rounded transition-all"
                style={{
                  background: '#e2e8f0',
                  color: '#2b6cb0',
                  borderColor: '#2b6cb0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#cbd5e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                }}
              >
                <Link href="/auth?mode=register">免费注册</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {/* 步骤详细介绍区域 - 完全自适应全屏 */}
      <section className="w-full py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#f5f7fa' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 步骤 1: 填写个人资料 */}
          <div
            ref={step1.elementRef}
            className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 p-6 sm:p-8 lg:p-10 rounded-2xl mb-10 sm:mb-12 lg:mb-16 shadow-lg transition-all ${
              step1.isVisible ? 'animate-slideInLeft' : 'opacity-0'
            }`}
            style={{ backgroundColor: '#ffffff', minHeight: '320px' }}
          >
            <div className="lg:col-span-2 flex justify-center lg:justify-start">
              <div className="w-full max-w-[280px] h-[300px] flex items-center justify-center">
                <img 
                  src="/step1-form.jpg" 
                  alt="填写个人资料界面" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="lg:col-span-3 flex flex-col justify-center lg:pl-6">
              <h2 
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 flex items-center"
                style={{ color: '#2b6cb0' }}
              >
                <img 
                  src="/step1-profile-icon.svg" 
                  alt="填写个人资料图标" 
                  className="w-8 h-8 sm:w-10 sm:h-10 mr-3"
                />
                步骤 1: 填写个人资料
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-gray-600">
                提供岗位类型、经验水平、目标公司/行业以及想要练习的面试类型。完整的个人信息有助于系统为你匹配最合适的练习伙伴并推荐题目。
              </p>
            </div>
          </div>

          {/* 步骤 2: 浏览匹配候选人 */}
          <div
            ref={step2.elementRef}
            className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 p-6 sm:p-8 lg:p-10 rounded-2xl mb-10 sm:mb-12 lg:mb-16 shadow-lg transition-all ${
              step2.isVisible ? 'animate-slideInRight' : 'opacity-0'
            }`}
            style={{ backgroundColor: '#eef4ff', minHeight: '320px' }}
          >
            <div className="lg:col-span-3 flex flex-col justify-center">
              <h2 
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 flex items-center"
                style={{ color: '#2b6cb0' }}
              >
                <img 
                  src="/logo-icon.png" 
                  alt="MockPal Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 mr-3 rounded-full"
                />
                步骤 2: 浏览匹配候选人
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-gray-600">
                查看系统推荐的候选人资料，了解他们的目标和经验。如果符合你的需求，可以点击"匹配"；否则选择跳过，系统将继续为你寻找合适的伙伴。
              </p>
            </div>
            <div className="lg:col-span-2 flex justify-center lg:justify-end">
              <div className="w-full max-w-[280px] h-[300px] flex items-center justify-center">
                <img 
                  src="/step2-matching.jpg" 
                  alt="浏览匹配候选人界面" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* 步骤 3: 查看匹配名单 */}
          <div
            ref={step3.elementRef}
            className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 p-6 sm:p-8 lg:p-10 rounded-2xl mb-10 sm:mb-12 lg:mb-16 shadow-lg transition-all ${
              step3.isVisible ? 'animate-slideInLeft' : 'opacity-0'
            }`}
            style={{ backgroundColor: '#ffffff', minHeight: '320px' }}
          >
            <div className="lg:col-span-2 flex justify-center lg:justify-start">
              <div className="w-full max-w-[320px] h-[340px] flex items-center justify-center">
                <img 
                  src="/step3-match-card.jpg" 
                  alt="查看匹配名单界面" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="lg:col-span-3 flex flex-col justify-center lg:pl-6">
              <h2 
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 flex items-center"
                style={{ color: '#2b6cb0' }}
              >
                <img 
                  src="/step3-matches-icon.svg" 
                  alt="查看匹配名单图标" 
                  className="w-8 h-8 sm:w-10 sm:h-10 mr-3"
                />
                步骤 3: 查看匹配名单
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-gray-600">
                匹配成功后，你可以在个人中心查看所有成功匹配的伙伴名单。使用系统提供的模板主动联系对方，并共同约定练习时间。
              </p>
            </div>
          </div>

          {/* 步骤 4: 练习精选题目 */}
          <div
            ref={step4.elementRef}
            className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 p-6 sm:p-8 lg:p-10 rounded-2xl shadow-lg transition-all ${
              step4.isVisible ? 'animate-slideInRight' : 'opacity-0'
            }`}
            style={{ backgroundColor: '#eef4ff', minHeight: '320px' }}
          >
            <div className="lg:col-span-3 flex flex-col justify-center">
              <h2 
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 flex items-center"
                style={{ color: '#2b6cb0' }}
              >
                <img 
                  src="/step4-questions-icon.svg" 
                  alt="练习精选题目图标" 
                  className="w-8 h-8 sm:w-10 sm:h-10 mr-3"
                />
                步骤 4: 练习精选题目
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-gray-600">
                进入题库，获取涵盖技术、行为和案例分析的精选面试题目。与伙伴练习并相互反馈，逐步提升你的面试技巧。
              </p>
            </div>
            <div className="lg:col-span-2 flex justify-center lg:justify-end">
              <div className="w-full max-w-[320px] h-[340px] flex items-center justify-center">
                <img 
                  src="/interview-questions-hero.jpg" 
                  alt="练习精选题目界面" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* 为什么选择MockPal - 完全自适应全屏 */}
      <section className="w-full" style={{ backgroundColor: '#ffffff' }}>
        <AdvantageComparison />
      </section>
      
      {/* 常见问题FAQ - 完全自适应全屏 */}
      <section className="w-full" style={{ backgroundColor: '#f8fafc' }}>
        <FAQSection />
      </section>

      {/* 最终CTA区域 */}
      <section 
        className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 text-center"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 lg:mb-6">
            准备好开始练习了吗？
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            加入MockPal，找到合适的练习伙伴，一起提升面试技巧
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button 
              asChild 
              className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg transition-all bg-white text-blue-600 hover:bg-gray-100 border-0"
            >
              <Link href="/auth">立即开始</Link>
            </Button>
            <Button 
              asChild 
              variant="outline"
              className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg transition-all border-2 border-white text-white hover:bg-white hover:text-blue-600"
              style={{ 
                borderColor: 'white', 
                color: 'white',
                backgroundColor: 'transparent'
              }}
            >
              <Link href="/auth?mode=register" className="text-white">了解更多</Link>
            </Button>
          </div>

          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-blue-400">
            <p className="text-xs sm:text-sm text-blue-200">
              专业题库 · 真人匹配 · 完全免费 · 即刻开始
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
