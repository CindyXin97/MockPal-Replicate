'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Language = 'zh' | 'en';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqData: Record<Language, FAQ[]> = {
  zh: [
    {
      id: '1',
      question: '匹配机制是如何工作的？',
      answer:
        'MockPal基于您填写的标签进行智能匹配，包括岗位类型（DA/DS/DE）、经验水平、目标公司和行业等。系统会优先匹配具有相似背景和互补需求的用户，确保双方都能从练习中受益。',
    },
    {
      id: '2',
      question: '我的个人信息和隐私安全吗？',
      answer:
        '我们非常重视用户隐私安全。个人信息仅在匹配成功后才会相互可见，包括联系方式。我们采用业界标准的数据加密技术，不会将您的信息用于任何商业目的。您可以随时修改隐私设置。',
    },
    {
      id: '3',
      question: 'MockPal是免费的吗？',
      answer:
        '是的！MockPal的核心功能完全免费使用，包括创建档案、浏览匹配、进行面试练习等。我们相信优质的面试准备资源应该人人可得，因此不设置任何付费门槛。',
    },
    {
      id: '4',
      question: '如果匹配的伙伴不合适怎么办？',
      answer:
        '每个用户每天可以浏览4个新的潜在匹配对象。如果发现不合适，您可以选择跳过。我们的算法会根据您的选择不断优化，为您推荐更合适的练习伙伴。',
    },
    {
      id: '5',
      question: '面试练习的形式是怎样的？',
      answer:
        '匹配成功后，您可以通过平台内提供的联系方式与伙伴协调具体的练习时间和形式。可以选择视频通话、语音通话等方式，根据双方的偏好和时间安排灵活进行。',
    },
    {
      id: '6',
      question: '如何提高匹配成功率？',
      answer:
        '完善您的个人档案是关键！填写详细的标签信息、工作经验、目标岗位等。真诚的自我介绍和明确的练习需求描述也能帮助您找到更合适的练习伙伴。',
    },
  ],
  en: [
    {
      id: '1',
      question: 'How does the matching work?',
      answer:
        'MockPal matches you based on the tags you complete—role type (DA/DS/DE), experience level, target companies, industries, and more. We prioritise partners with similar backgrounds and complementary goals so both sides benefit.',
    },
    {
      id: '2',
      question: 'Is my information safe?',
      answer:
        'Absolutely. Your personal details are only visible after a successful match, including any contact information. We use industry-standard encryption and never share your data for commercial purposes. You can adjust privacy settings at any time.',
    },
    {
      id: '3',
      question: 'Is MockPal free to use?',
      answer:
        'Yes! MockPal’s core features—creating a profile, browsing matches, and running mock interviews—are completely free. We believe quality interview prep should be accessible to everyone, so there are no hidden fees.',
    },
    {
      id: '4',
      question: 'What if a match isn’t a good fit?',
      answer:
        'You can review up to four new potential matches each day. If someone doesn’t fit, simply skip them and our algorithm will continue refining recommendations for better partners.',
    },
    {
      id: '5',
      question: 'How do practice sessions take place?',
      answer:
        'Once you match, you can coordinate via the provided contact methods to choose the best format: video, voice, or whatever works for both of you. Schedule sessions flexibly based on your availability.',
    },
    {
      id: '6',
      question: 'How can I increase my match rate?',
      answer:
        'Completing your profile thoroughly is key. Fill in detailed tags, work history, and target roles. A genuine introduction and clear practice goals also help you attract the right partners.',
    },
  ],
};

const sectionTexts: Record<Language, { heading: string; subtitle: string }> = {
  zh: {
    heading: '常见问题',
    subtitle: '关于MockPal你可能想了解的问题，我们都为你准备了答案',
  },
  en: {
    heading: 'Frequently Asked Questions',
    subtitle: 'Everything you might want to know about MockPal, answered in one place.',
  },
};

interface FAQSectionProps {
  language: Language;
}

export function FAQSection({ language }: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const data = faqData[language];
  const texts = sectionTexts[language];

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
    <div className="w-full py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            {texts.heading}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {texts.subtitle}
          </p>
        </div>

        {/* FAQ列表 */}
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          {data.map((faq) => {
            const isOpen = openItems.has(faq.id);

            return (
              <div
                key={faq.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg"
              >
                {/* 问题标题 */}
                <button
                  className="w-full p-3 sm:p-4 lg:p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 pr-3 sm:pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 transition-transform duration-200" style={{transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" style={{color: '#2b6cb0'}} />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* 答案内容 */}
                <div
                  id={`faq-answer-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-question-${faq.id}`}
                  className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 text-gray-700"
                  style={{
                    display: isOpen ? 'block' : 'none',
                    animation: isOpen ? 'slideDown 0.3s ease forwards' : 'none'
                  }}
                >
                  <p className="text-xs sm:text-sm lg:text-base leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}