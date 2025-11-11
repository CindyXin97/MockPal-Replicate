'use client';

import { CheckCircle, XCircle } from 'lucide-react';

type Language = 'zh' | 'en';

interface ComparisonItem {
  feature: string;
  mockpal: boolean;
  traditional: boolean;
  description: string;
}

const comparisonData: Record<Language, ComparisonItem[]> = {
  zh: [
    {
      feature: '专为数据岗位设计',
      mockpal: true,
      traditional: false,
      description: '针对DA/DS/DE岗位的专业题库和匹配算法',
    },
    {
      feature: '真人一对一练习',
      mockpal: true,
      traditional: false,
      description: '与同行求职者进行真实互动练习',
    },
    {
      feature: '智能匹配系统',
      mockpal: true,
      traditional: false,
      description: '基于标签自动匹配最合适的练习伙伴',
    },
    {
      feature: '即时反馈优化',
      mockpal: true,
      traditional: true,
      description: '练习后获得详细的面试表现反馈',
    },
    {
      feature: '免费使用',
      mockpal: true,
      traditional: false,
      description: '核心功能完全免费，无隐藏费用',
    },
    {
      feature: '时间灵活安排',
      mockpal: true,
      traditional: false,
      description: '随时找到在线的练习伙伴进行面试',
    },
  ],
  en: [
    {
      feature: 'Built for data roles',
      mockpal: true,
      traditional: false,
      description: 'Specialised question bank and matching engine for DA, DS, and DE roles.',
    },
    {
      feature: 'Live 1:1 practice',
      mockpal: true,
      traditional: false,
      description: 'Practice with real peers who are preparing for the same interviews.',
    },
    {
      feature: 'Intelligent matching engine',
      mockpal: true,
      traditional: false,
      description: 'Automatically pairs you with the most compatible practice partner based on shared tags.',
    },
    {
      feature: 'Actionable feedback',
      mockpal: true,
      traditional: true,
      description: 'Receive detailed feedback after every session to keep improving.',
    },
    {
      feature: 'Free to use',
      mockpal: true,
      traditional: false,
      description: 'Core functionality is completely free with no hidden fees.',
    },
    {
      feature: 'Flexible scheduling',
      mockpal: true,
      traditional: false,
      description: 'Find available partners whenever you want to practice.',
    },
  ],
};

const sectionTexts: Record<
  Language,
  {
    titlePrefix: string;
    titleSuffix: string;
    subtitle: string;
    featureHeading: string;
    mockpalHeading: string;
    traditionalHeading: string;
  }
> = {
  zh: {
    titlePrefix: '为什么选择 ',
    titleSuffix: '？',
    subtitle: '专为数据岗位求职者打造，与传统面试准备方式的全面对比',
    featureHeading: '功能特性',
    mockpalHeading: 'MockPal',
    traditionalHeading: '传统方式',
  },
  en: {
    titlePrefix: 'Why choose ',
    titleSuffix: '?',
    subtitle: 'Purpose-built for data candidates, compared with traditional interview prep.',
    featureHeading: 'Key features',
    mockpalHeading: 'MockPal',
    traditionalHeading: 'Traditional prep',
  },
};

interface AdvantageComparisonProps {
  language: Language;
}

export function AdvantageComparison({ language }: AdvantageComparisonProps) {
  const data = comparisonData[language];
  const texts = sectionTexts[language];

  return (
    <div className="w-full py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            {texts.titlePrefix}
            <span style={{color: '#2b6cb0'}}>MockPal</span>
            {texts.titleSuffix}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {texts.subtitle}
          </p>
        </div>

        {/* 对比表格 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-0 border-b border-gray-200" style={{backgroundColor: '#eef4ff'}}>
            <div className="col-span-12 md:col-span-6 p-3 sm:p-4 lg:p-6">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{texts.featureHeading}</h3>
            </div>
            <div className="col-span-6 md:col-span-3 p-3 sm:p-4 lg:p-6 text-center border-l border-gray-200">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold" style={{color: '#2b6cb0'}}>{texts.mockpalHeading}</h3>
            </div>
            <div className="col-span-6 md:col-span-3 p-3 sm:p-4 lg:p-6 text-center border-l border-gray-200">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600">{texts.traditionalHeading}</h3>
            </div>
          </div>

          {/* 对比内容 */}
          {data.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-0 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="col-span-12 md:col-span-6 p-3 sm:p-4 lg:p-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">{item.feature}</h4>
                  <p className="text-xs sm:text-xs lg:text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <div className="col-span-6 md:col-span-3 p-3 sm:p-4 lg:p-6 text-center border-l border-gray-200">
                {item.mockpal ? (
                  <div className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full" style={{backgroundColor: '#2b6cb0'}}>
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-gray-300">
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="col-span-6 md:col-span-3 p-3 sm:p-4 lg:p-6 text-center border-l border-gray-200">
                {item.traditional ? (
                  <div className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full" style={{backgroundColor: '#2b6cb0'}}>
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-gray-300">
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}