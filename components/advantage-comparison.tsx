'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface ComparisonItem {
  feature: string;
  mockpal: boolean;
  traditional: boolean;
  description: string;
}

const comparisonData: ComparisonItem[] = [
  {
    feature: '专为数据岗位设计',
    mockpal: true,
    traditional: false,
    description: '针对DA/DS/DE岗位的专业题库和匹配算法'
  },
  {
    feature: '真人一对一练习',
    mockpal: true,
    traditional: false,
    description: '与同行求职者进行真实互动练习'
  },
  {
    feature: '智能匹配系统',
    mockpal: true,
    traditional: false,
    description: '基于标签自动匹配最合适的练习伙伴'
  },
  {
    feature: '即时反馈优化',
    mockpal: true,
    traditional: true,
    description: '练习后获得详细的面试表现反馈'
  },
  {
    feature: '免费使用',
    mockpal: true,
    traditional: false,
    description: '核心功能完全免费，无隐藏费用'
  },
  {
    feature: '时间灵活安排',
    mockpal: true,
    traditional: false,
    description: '随时找到在线的练习伙伴进行面试'
  }
];

export function AdvantageComparison() {
  return (
    <section className="w-full py-16 px-4" style={{backgroundColor: '#f5f7fa'}}>
      <div className="max-w-6xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            为什么选择 <span style={{color: '#2b6cb0'}}>MockPal</span>？
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            专为数据岗位求职者打造，与传统面试准备方式的全面对比
          </p>
        </div>

        {/* 对比表格 */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-0 border-b border-gray-200" style={{backgroundColor: '#eef4ff'}}>
            <div className="col-span-12 md:col-span-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900">功能特性</h3>
            </div>
            <div className="col-span-6 md:col-span-3 p-6 text-center border-l border-gray-200">
              <h3 className="text-lg font-bold" style={{color: '#2b6cb0'}}>MockPal</h3>
            </div>
            <div className="col-span-6 md:col-span-3 p-6 text-center border-l border-gray-200">
              <h3 className="text-lg font-semibold text-gray-600">传统方式</h3>
            </div>
          </div>

          {/* 对比内容 */}
          {comparisonData.map((item, index) => (
            <div 
              key={index}
              className="grid grid-cols-12 gap-0 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="col-span-12 md:col-span-6 p-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{item.feature}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <div className="col-span-6 md:col-span-3 p-6 text-center border-l border-gray-200">
                {item.mockpal ? (
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{backgroundColor: '#2b6cb0'}}>
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="col-span-6 md:col-span-3 p-6 text-center border-l border-gray-200">
                {item.traditional ? (
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 底部强调 */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white rounded-lg p-6 shadow-md">
            <p className="text-lg font-medium text-gray-900 mb-2">
              🎯 专业性 + 💼 实用性 + 🆓 免费使用
            </p>
            <p className="text-gray-600">
              这就是MockPal为数据岗位求职者提供的独特价值
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}