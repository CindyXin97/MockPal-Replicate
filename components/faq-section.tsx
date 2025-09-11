'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQ[] = [
  {
    id: '1',
    question: '匹配机制是如何工作的？',
    answer: 'MockPal基于您填写的标签进行智能匹配，包括岗位类型(DA/DS/DE)、经验水平、目标公司和行业等。系统会优先匹配具有相似背景和互补需求的用户，确保双方都能从练习中受益。'
  },
  {
    id: '2',
    question: '我的个人信息和隐私安全吗？',
    answer: '我们非常重视用户隐私安全。个人信息仅在匹配成功后才会相互可见，包括联系方式。我们采用业界标准的数据加密技术，不会将您的信息用于任何商业目的。您可以随时修改隐私设置。'
  },
  {
    id: '3',
    question: 'MockPal是免费的吗？',
    answer: '是的！MockPal的核心功能完全免费使用，包括创建档案、浏览匹配、进行面试练习等。我们相信优质的面试准备资源应该人人可得，因此不设置任何付费门槛。'
  },
  {
    id: '4',
    question: '如果匹配的伙伴不合适怎么办？',
    answer: '每个用户每天可以浏览5个新的潜在匹配对象。如果发现不合适，您可以选择跳过。我们的算法会根据您的选择不断优化，为您推荐更合适的练习伙伴。'
  },
  {
    id: '5',
    question: '面试练习的形式是怎样的？',
    answer: '匹配成功后，您可以通过平台内提供的联系方式与伙伴协调具体的练习时间和形式。可以选择视频通话、语音通话等方式，根据双方的偏好和时间安排灵活进行。'
  },
  {
    id: '6',
    question: '如何提高匹配成功率？',
    answer: '完善您的个人档案是关键！填写详细的标签信息、工作经验、目标岗位等。真诚的自我介绍和明确的练习需求描述也能帮助您找到更合适的练习伙伴。'
  }
];

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="w-full py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            常见问题
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            关于MockPal你可能想了解的问题，我们都为你准备了答案
          </p>
        </div>

        {/* FAQ列表 */}
        <div className="space-y-4">
          {faqData.map((faq) => {
            const isOpen = openItems.has(faq.id);
            
            return (
              <div
                key={faq.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg"
              >
                {/* 问题标题 */}
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 transition-transform duration-200" style={{transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5" style={{color: '#2b6cb0'}} />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* 答案内容 */}
                <div
                  id={`faq-answer-${faq.id}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6">
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed mt-4">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部联系信息 */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <p className="text-gray-700 mb-2">
              没有找到你想要的答案？
            </p>
            <p className="text-sm text-gray-600">
              欢迎通过 
              <a 
                href="mailto:support@mockpals.com" 
                className="font-medium hover:underline"
                style={{color: '#2b6cb0'}}
              >
                support@mockpals.com
              </a> 
              联系我们
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}