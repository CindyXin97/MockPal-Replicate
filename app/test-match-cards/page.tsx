'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '@/components/base-layout';
import { useProfile } from '@/lib/useProfile';
import { getUserAchievement } from '@/lib/achievements';
import '@/styles/success.css';

const MatchCardsTestPage = () => {
  const { data: session, status } = useSession();
  const user = session?.user?.id ? { id: parseInt(session.user.id) } : null;
  const { profile, isComplete } = useProfile(user?.id);
  const [currentUserAchievement, setCurrentUserAchievement] = useState<any>(null);
  const [showCurrentUser, setShowCurrentUser] = useState(false);

  // 获取当前用户的成就数据
  useEffect(() => {
    if (user?.id) {
      getUserAchievement(user.id).then(achievement => {
        setCurrentUserAchievement(achievement);
      }).catch(error => {
        console.error('获取用户成就失败:', error);
      });
    }
  }, [user?.id]);

  // 模拟不同状态的匹配数据
  const mockMatches = [
    {
      id: 1,
      matchId: 101,
      username: '张小明',
      jobType: 'DS',
      experienceLevel: '1-3年',
      targetCompany: '字节跳动',
      targetIndustry: '互联网',
      bio: '热爱数据科学，有丰富的机器学习项目经验，希望找到志同道合的练习伙伴一起提升面试技能！',
      practicePreferences: {
        technicalInterview: true,
        behavioralInterview: true,
        caseAnalysis: false,
        statsQuestions: true,
      },
      skills: ['Python', 'SQL', '机器学习'],
      contactInfo: {
        email: 'zhangxiaoming@example.com',
        wechat: 'zhang_xm_2024',
        linkedin: 'linkedin.com/in/zhangxiaoming',
      },
      contactStatus: 'not_contacted',
      createdAt: '2024-01-15T10:30:00Z',
      achievement: {
        icon: '⭐',
        level: '面试新手',
        experiencePoints: 3,
        showMoon: false,
      },
    },
    {
      id: 2,
      matchId: 102,
      username: '李小红',
      jobType: 'DA',
      experienceLevel: '应届',
      targetCompany: '腾讯',
      targetIndustry: '游戏',
      bio: '数据分析新人，正在学习SQL和Python，希望通过模拟面试快速提升技能！',
      practicePreferences: {
        technicalInterview: true,
        behavioralInterview: false,
        caseAnalysis: true,
        statsQuestions: false,
      },
      skills: ['Excel', 'Tableau'],
      contactInfo: {
        email: 'lixiaohong@example.com',
        wechat: 'li_xh_2024',
        linkedin: null,
      },
      contactStatus: 'contacted',
      createdAt: '2024-01-14T15:20:00Z',
      achievement: {
        icon: '🌱',
        level: '新用户',
        experiencePoints: 0,
        showMoon: false,
      },
    },
    {
      id: 3,
      matchId: 103,
      username: '王大伟',
      jobType: 'DE',
      experienceLevel: '3-5年',
      targetCompany: '阿里巴巴',
      targetIndustry: '电商',
      bio: '资深数据工程师，熟悉大数据处理流程，擅长Spark和Hadoop，愿意分享经验帮助新人成长。',
      practicePreferences: {
        technicalInterview: true,
        behavioralInterview: true,
        caseAnalysis: true,
        statsQuestions: true,
      },
      skills: ['Spark', 'Hadoop', 'Kafka'],
      contactInfo: {
        email: 'wangdawei@example.com',
        wechat: 'wang_dw_2024',
        linkedin: 'linkedin.com/in/wangdawei',
      },
      contactStatus: 'scheduled',
      createdAt: '2024-01-13T09:15:00Z',
      achievement: {
        icon: '🌟',
        level: '面试新星',
        experiencePoints: 7,
        showMoon: false,
      },
    },
    {
      id: 4,
      matchId: 104,
      username: '陈小美',
      jobType: 'DS',
      experienceLevel: '5年以上',
      targetCompany: 'Meta',
      targetIndustry: '社交媒体',
      bio: '机器学习专家，在推荐系统和NLP领域有丰富经验，正在准备FAANG面试，希望找到同样有经验的伙伴进行深度交流。',
      practicePreferences: {
        technicalInterview: true,
        behavioralInterview: true,
        caseAnalysis: true,
        statsQuestions: true,
      },
      skills: ['TensorFlow', 'PyTorch', 'NLP'],
      contactInfo: {
        email: 'chenxiaomei@example.com',
        wechat: 'chen_xm_2024',
        linkedin: 'linkedin.com/in/chenxiaomei',
      },
      contactStatus: 'completed',
      createdAt: '2024-01-12T14:45:00Z',
      achievement: {
        icon: '🌙',
        level: '面试达人',
        experiencePoints: 12,
        showMoon: true,
      },
    },
    {
      id: 5,
      matchId: 105,
      username: '刘小强',
      jobType: 'BA',
      experienceLevel: '3-5年',
      targetCompany: 'Google',
      targetIndustry: '云计算',
      bio: '商业分析师，擅长数据可视化和业务洞察，有丰富的A/B测试经验，正在准备产品分析师的面试。',
      practicePreferences: {
        technicalInterview: false,
        behavioralInterview: true,
        caseAnalysis: true,
        statsQuestions: true,
      },
      skills: ['PowerBI', 'SQL'],
      contactInfo: {
        email: 'liuxiaoqiang@example.com',
        wechat: 'liu_xq_2024',
        linkedin: 'linkedin.com/in/liuxiaoqiang',
      },
      contactStatus: 'no_response',
      createdAt: '2024-01-11T11:30:00Z',
      achievement: {
        icon: '👑',
        level: '面试导师',
        experiencePoints: 18,
        showMoon: true,
      },
    },
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

  // 渲染成就等级的函数
  const renderAchievement = (achievement: any) => {
    const levelStyle = getLevelStyle(achievement.level);
    
    return (
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm">{achievement.icon}</span>
        <div className="relative group">
          <span className={`text-xs font-medium px-2 py-1 rounded-md transition-all duration-200 cursor-help shadow-sm hover:shadow-md ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border} ${levelStyle.hover} border`}>
            {achievement.level}
          </span>
          {/* 悬停提示 */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            <div className="text-center">
              <div className="font-medium">{levelStyle.title}</div>
              <div className="text-gray-300 mt-1">{levelStyle.description}</div>
              <div className="text-gray-400 mt-1">经验值: {achievement.experiencePoints}</div>
            </div>
            {/* 小三角形箭头 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
        {achievement.showMoon && (
          <span className="text-xs text-blue-500">🌙</span>
        )}
      </div>
    );
  };

  // 获取联系状态样式
  const getContactStatusStyle = (status: string) => {
    const statusStyles: Record<string, { bg: string; text: string; icon: string; label: string }> = {
      'not_contacted': { bg: 'bg-gray-100', text: 'text-gray-600', icon: '⏳', label: '未联系' },
      'contacted': { bg: 'bg-blue-100', text: 'text-blue-600', icon: '📞', label: '已联系' },
      'scheduled': { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: '📅', label: '已约面' },
      'completed': { bg: 'bg-green-100', text: 'text-green-600', icon: '✅', label: '已完成' },
      'no_response': { bg: 'bg-red-100', text: 'text-red-600', icon: '❌', label: '无回应' },
      'current_user': { bg: 'bg-purple-100', text: 'text-purple-600', icon: '👤', label: '当前用户' },
    };
    return statusStyles[status] || statusStyles['not_contacted'];
  };

  // 计算匹配时间
  const getMatchTime = (createdAt: string) => {
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  // 生成当前用户的卡片数据
  const getCurrentUserCard = () => {
    if (!user || !profile) return null;

    const achievement = currentUserAchievement ? {
      icon: currentUserAchievement.currentLevel === '新用户' ? '🌱' :
            currentUserAchievement.currentLevel === '面试新手' ? '⭐' :
            currentUserAchievement.currentLevel === '面试新星' ? '🌟' :
            currentUserAchievement.currentLevel === '面试达人' ? '🌙' : '👑',
      level: currentUserAchievement.currentLevel,
      experiencePoints: currentUserAchievement.experiencePoints,
      showMoon: currentUserAchievement.currentLevel === '面试达人' || currentUserAchievement.currentLevel === '面试导师',
    } : {
      icon: '🌱',
      level: '新用户',
      experiencePoints: 0,
      showMoon: false,
    };

    return {
      id: user.id,
      matchId: user.id,
      username: profile.name || session?.user?.name || session?.user?.email || '当前用户',
      jobType: profile.jobType,
      experienceLevel: profile.experienceLevel,
      targetCompany: profile.targetCompany,
      targetIndustry: profile.targetIndustry,
      bio: profile.bio || '这是我的个人简介，还没有填写...',
      practicePreferences: {
        technicalInterview: profile.technicalInterview,
        behavioralInterview: profile.behavioralInterview,
        caseAnalysis: profile.caseAnalysis,
        statsQuestions: profile.statsQuestions,
      },
      skills: profile.skills || [],
      contactInfo: {
        email: profile.email,
        wechat: profile.wechat,
        linkedin: profile.linkedin,
      },
      contactStatus: 'current_user',
      createdAt: new Date().toISOString(),
      achievement,
    };
  };

  // 获取所有要显示的卡片
  const getAllCards = () => {
    const currentUserCard = getCurrentUserCard();
    if (showCurrentUser && currentUserCard) {
      return [currentUserCard, ...mockMatches];
    }
    return mockMatches;
  };

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              🎯 匹配卡片样式测试
            </CardTitle>
            <p className="text-center text-gray-600">
              展示不同状态和成就等级的匹配卡片样式效果
            </p>
            {user && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowCurrentUser(!showCurrentUser)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    showCurrentUser
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {showCurrentUser ? '👤 隐藏我的卡片' : '👤 显示我的卡片'}
                </button>
              </div>
            )}
            {!user && (
              <div className="text-center mt-4 text-gray-500">
                <p>请先登录以查看您自己的卡片样式</p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* 成就等级系统说明 */}
        <div className="rounded-lg p-4 mb-6 border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500">
          <div className="flex items-center">
            <span className="text-xl mr-3">🏆</span>
            <div className="text-sm text-blue-500/90">
              <p className="font-semibold mb-2">成就等级系统</p>
              <p className="leading-relaxed">
                完成面试获得经验，提升等级！🌱<span className="font-medium">新用户</span>(0次) → ⭐<span className="font-medium">面试新手</span>(1-4次) → 🌟<span className="font-medium">面试新星</span>(5-9次) → 🌙<span className="font-medium">面试达人</span>(10-14次) → 👑<span className="font-medium">面试导师</span>(15次+)
              </p>
            </div>
          </div>
        </div>

        {/* 匹配卡片展示 */}
        <div className="cards-container">
          {getAllCards().map((match) => {
            const statusStyle = getContactStatusStyle(match.contactStatus);
            return (
              <div key={match.id} className="card">
                <div className="card-header">
                  <div className="avatar">
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${match.username}`}
                      alt="avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="name">{match.username}</div>
                    {/* 显示用户成就等级 */}
                    {renderAchievement(match.achievement)}
                    <div className="title">
                      {match.jobType || '未设置'} · {match.experienceLevel || '未设置'}
                    </div>
                    {/* 添加匹配时间显示 */}
                    <div className="text-xs text-gray-500 mt-1">
                      匹配于 {getMatchTime(match.createdAt)}
                    </div>
                    {/* 联系状态标签 */}
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <span>{statusStyle.icon}</span>
                        <span>{statusStyle.label}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  {match.bio && (
                    <div className="intro">{match.bio}</div>
                  )}
                  
                  <div className="tags">
                    {match.practicePreferences?.technicalInterview && (
                      <span className="tag">技术面</span>
                    )}
                    {match.practicePreferences?.behavioralInterview && (
                      <span className="tag">行为面</span>
                    )}
                    {match.practicePreferences?.caseAnalysis && (
                      <span className="tag">案例分析</span>
                    )}
                    {match.practicePreferences?.statsQuestions && (
                      <span className="tag">统计题目</span>
                    )}
                  </div>
                  
                  {/* 技能展示 */}
                  {match.skills && match.skills.length > 0 && (
                    <div className="mt-4 mb-4">
                      <div className="text-xs font-medium text-gray-700 mb-2">💡 技能标签</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {match.skills.map((skill: string, index: number) => (
                          <span key={index} className="rounded-full px-2 py-0.5 flex items-center gap-1 text-xs font-medium shadow-sm bg-green-50 text-green-600 border border-green-200">
                            💡 {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 联系方式参考格式 */}
                  <div className="contact">
                    <div className="contact-title">联系方式：</div>
                    {match.contactInfo?.email && (
                      <div className="contact-item">
                        <span>📧 邮箱: {match.contactInfo.email}</span>
                      </div>
                    )}
                    {match.contactInfo?.wechat && (
                      <div className="contact-item">
                        <span>💬 微信: {match.contactInfo.wechat}</span>
                      </div>
                    )}
                    {match.contactInfo?.linkedin && (
                      <div className="contact-item">
                        <span>🔗 领英: {match.contactInfo.linkedin}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    {match.contactStatus === 'current_user' ? (
                      <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-md">
                        <p className="text-sm text-purple-700 font-medium">这是您自己的卡片</p>
                        <p className="text-xs text-purple-600 mt-1">其他用户看到您的卡片时就是这个样子</p>
                      </div>
                    ) : (
                      <button className="contact-button">
                        查看联系模板
                      </button>
                    )}
                  </div>
                  
                  {/* 反馈流程展示 */}
                  <div className="feedback-flow mt-3 p-2 bg-gray-50 rounded-md">
                    <div className="text-sm font-medium text-gray-700 mb-2">📋 面试反馈流程</div>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                        <span>是否添加联系方式？</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                        <span>是否进行面试？</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                        <span>填写面试反馈</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 样式说明 */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🎨 卡片样式说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">联系状态</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">⏳ 未联系</span>
                    <span>刚匹配成功，还未开始联系</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">📞 已联系</span>
                    <span>已添加联系方式并开始沟通</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs">📅 已约面</span>
                    <span>已约定面试时间</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">✅ 已完成</span>
                    <span>面试已完成并提交反馈</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">❌ 无回应</span>
                    <span>联系后对方无回应</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs">👤 当前用户</span>
                    <span>您自己的卡片样式</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">交互功能</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">🔗</span>
                    <span>查看联系模板</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">📋</span>
                    <span>三步反馈流程</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">🏆</span>
                    <span>成就等级悬停提示</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">⏰</span>
                    <span>匹配时间显示</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">💡</span>
                    <span>个人技能标签</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default MatchCardsTestPage;
