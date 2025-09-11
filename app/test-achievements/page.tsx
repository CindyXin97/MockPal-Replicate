'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '@/components/base-layout';

const AchievementTestPage = () => {
  // 模拟不同等级的成就数据
  const achievements = [
    { icon: '🌱', level: '新用户', description: '刚加入平台的新成员', showMoon: false, experiencePoints: 0 },
    { icon: '⭐', level: '面试新手', description: '开始积累经验', showMoon: false, experiencePoints: 1 },
    { icon: '🌟', level: '面试新星', description: '积极的面试伙伴', showMoon: false, experiencePoints: 5 },
    { icon: '🌙', level: '面试达人', description: '完成第一阶段挑战', showMoon: true, experiencePoints: 10 },
    { icon: '👑', level: '面试导师', description: '经验丰富的面试专家', showMoon: true, experiencePoints: 15 },
  ];

  // 获取等级样式配置
  const getLevelStyle = (level: string) => {
    const levelStyles: Record<string, {
      bg: string;
      text: string;
      border: string;
      hover: string;
      title: string;
      description: string;
    }> = {
      '新用户': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        hover: 'hover:bg-green-200',
        title: '新用户标识',
        description: '刚注册的用户，还未完成面试练习'
      },
      '面试新手': {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-200',
        title: '面试新手',
        description: '开始积累面试经验，正在学习阶段'
      },
      '面试新星': {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-200',
        title: '面试新星',
        description: '积极参与面试练习，表现优秀'
      },
      '面试达人': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-200',
        title: '面试达人',
        description: '经验丰富的面试者，完成第一阶段挑战'
      },
      '面试导师': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        hover: 'hover:bg-red-200',
        title: '面试导师',
        description: '最高级别用户，经验丰富的面试专家'
      }
    };
    
    return levelStyles[level] || levelStyles['新用户'];
  };

  // 渲染成就等级的函数（与matches页面保持一致）
  const renderAchievement = (achievement: any) => {
    const levelStyle = getLevelStyle(achievement.level);
    
    return (
      <div className="flex flex-col items-center justify-center mt-2">
        {/* 成就图标和等级 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{achievement.icon}</span>
          <div className="relative group">
            <span className={`text-sm font-semibold px-2 py-1 rounded-md transition-all duration-200 cursor-help shadow-sm hover:shadow-md ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border} ${levelStyle.hover} border`}>
              {achievement.level}
            </span>
            {/* 悬停提示 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              <div className="text-center">
                <div className="font-medium">{levelStyle.title}</div>
                <div className="text-gray-300 mt-1">{levelStyle.description}</div>
              </div>
              {/* 小三角形箭头 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          {achievement.showMoon && (
            <span className="text-blue-400 text-lg">🌙</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              🏆 成就等级展示
            </CardTitle>
            <p className="text-center text-gray-600">
              这里展示了所有成就等级的标签样式效果
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  {/* 模拟用户头像 */}
                  <div className="w-20 h-20 rounded-full bg-blue-50 shadow flex items-center justify-center mb-4 border-4 border-white">
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=user${index}`}
                      alt="avatar"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                  
                  {/* 用户名 */}
                  <div className="font-bold text-lg text-gray-800 mb-2">
                    测试用户 {index + 1}
                  </div>
                  
                  {/* 成就等级显示 */}
                  {renderAchievement(achievement)}
                  
                  {/* 经验值信息 */}
                  <div className="mt-3 text-center">
                    <div className="text-xs text-gray-500">
                      经验值: {achievement.experiencePoints}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {achievement.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🎨 等级颜色说明</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-200 rounded-md text-xs font-semibold">新用户</span>
                <span>绿色 - 刚注册的用户，还未完成面试练习</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">面试新手</span>
                <span>蓝色 - 开始积累面试经验，正在学习阶段</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-xs font-semibold">面试新星</span>
                <span>紫色 - 积极参与面试练习，表现优秀</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-md text-xs font-semibold">面试达人</span>
                <span>黄色 - 经验丰富，完成第一阶段挑战，带有🌙标识</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-semibold">面试导师</span>
                <span>红色 - 最高级别，经验丰富的面试专家，带有🌙标识</span>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-700 font-medium">💡 交互提示</p>
                <p className="text-blue-600 text-xs mt-1">所有等级标签都支持鼠标悬停查看详细说明，并有颜色高亮效果</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default AchievementTestPage; 