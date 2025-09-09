'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartReminderBanner } from '@/components/smart-reminder-banner';
import '@/styles/success.css';

export default function TestImprovedMatches() {
  const [matches, setMatches] = useState([
    {
      id: 1,
      username: '张三',
      jobType: 'DA',
      experienceLevel: '应届',
      bio: '热爱数据分析，擅长Python和SQL',
      contactInfo: {
        email: 'zhangsan@example.com',
        wechat: 'zhangsan123'
      },
      contactStatus: 'contacted',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
      practicePreferences: {
        technicalInterview: true,
        behavioralInterview: false,
        caseAnalysis: true
      }
    },
    {
      id: 2,
      username: '李四',
      jobType: 'DS',
      experienceLevel: '1-3年',
      bio: '机器学习工程师，专注于推荐系统',
      contactInfo: {
        email: 'lisi@example.com',
        linkedin: 'linkedin.com/in/lisi'
      },
      contactStatus: 'contacted',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1天前
      practicePreferences: {
        technicalInterview: true,
        behavioralInterview: true,
        caseAnalysis: false
      }
    },
    {
      id: 3,
      username: '王五',
      jobType: 'DE',
      experienceLevel: '3-5年',
      bio: '数据工程师，熟悉大数据处理框架',
      contactInfo: {
        email: 'wangwu@example.com',
        wechat: 'wangwu456'
      },
      contactStatus: 'completed',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
      practicePreferences: {
        technicalInterview: false,
        behavioralInterview: true,
        caseAnalysis: true
      }
    }
  ]);

  // 模拟用户成就数据
  const getUserAchievementData = (userId: number) => {
    const achievements = {
      1: { level: '新用户', icon: '🌱', showMoon: false },
      2: { level: '面试新手', icon: '⭐', showMoon: false },
      3: { level: '面试达人', icon: '🌙', showMoon: true }
    };
    return achievements[userId as keyof typeof achievements] || { level: '新用户', icon: '🌱', showMoon: false };
  };

  const updateMatchStatus = (matchId: number, newStatus: string) => {
    setMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, contactStatus: newStatus }
        : match
    ));
    console.log(`更新匹配 ${matchId} 状态为 ${newStatus}`);
  };

  const pendingMatches = matches
    .filter(match => !match.contactStatus || match.contactStatus === 'not_contacted')
    .map(match => ({
      id: match.id,
      partnerName: match.username,
      daysAgo: Math.floor((Date.now() - new Date(match.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      contactStatus: match.contactStatus || 'not_contacted'
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-blue-600">
              🎯 改进后的匹配界面演示
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-600">
              <p className="mb-4">这个页面展示了改进后的匹配界面功能：</p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">✨ 智能提醒横幅</h3>
                  <p className="text-blue-700">缩小了尺寸，更加紧凑简洁</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">⏰ 时间显示</h3>
                  <p className="text-green-700">显示"匹配于X小时前"</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">🎛️ 状态选择器</h3>
                  <p className="text-purple-700">右上角下拉选择匹配状态</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">🔄 原有界面</h3>
                  <p className="text-orange-700">保持原来的卡片布局和样式</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 智能提醒横幅 */}
        {pendingMatches.length > 0 && (
          <SmartReminderBanner
            pendingMatches={pendingMatches}
            onDismiss={() => console.log('用户关闭了提醒')}
            onUpdateStatus={(matchId) => console.log(`跳转到匹配 ${matchId}`)}
          />
        )}

        {/* 成功匹配卡片 */}
        <div className="cards-container">
          {matches.map((match) => (
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
                  <div className="flex items-center gap-1 mb-1">
                    {(() => {
                      const achievement = getUserAchievementData(match.id);
                      return (
                        <>
                          <span className="text-sm">{achievement.icon}</span>
                          <span className="text-xs font-medium text-gray-600">{achievement.level}</span>
                          {achievement.showMoon && (
                            <span className="text-blue-400 text-xs">🌙</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="title">
                    {match.jobType} · {match.experienceLevel}
                  </div>
                  {/* 添加匹配时间显示 */}
                  <div className="text-xs text-gray-500 mt-1">
                    匹配于 {(() => {
                      const hours = Math.floor((Date.now() - new Date(match.createdAt).getTime()) / (1000 * 60 * 60));
                      if (hours < 24) return `${hours}小时前`;
                      const days = Math.floor(hours / 24);
                      return `${days}天前`;
                    })()}
                  </div>
                </div>
                {/* 右上角状态选择器 */}
                <div className="absolute top-2 right-2">
                  <select 
                    className="text-xs px-2 py-1 rounded border border-gray-300 bg-white shadow-sm"
                    value={match.contactStatus || 'not_contacted'}
                    onChange={(e) => updateMatchStatus(match.id, e.target.value)}
                  >
                    <option value="not_contacted">🕐 还未联系</option>
                    <option value="contacted">💬 已联系</option>
                    <option value="scheduled">📅 已安排面试</option>
                    <option value="completed">✅ 已完成面试</option>
                    <option value="no_response">❌ 对方未回应</option>
                  </select>
                </div>
              </div>
              <div className="card-body">
                <div className="intro">{match.bio}</div>
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
                </div>
                                                  <div className="contact">
                  <div className="contact-title">联系方式：</div>
                  {match.contactInfo?.email && (
                    <div className="contact-item">📧 邮箱: {match.contactInfo.email}</div>
                  )}
                  {match.contactInfo?.wechat && (
                    <div className="contact-item">💬 微信: {match.contactInfo.wechat}</div>
                  )}
                  {match.contactInfo?.linkedin && (
                    <div className="contact-item">🔗 领英: {match.contactInfo.linkedin}</div>
                  )}
                </div>
              </div>
                             <div className="card-footer">
                 <button className="contact-button">
                   查看联系模板
                 </button>
               </div>
               
               {/* 面试反馈表单 - 当联系状态不是"还未联系"时显示 */}
               {match.contactStatus && match.contactStatus !== 'not_contacted' && (
                 <div className="feedback-form">
                   <div className="status">
                     是否完成面试？
                     <label>
                       <input
                         type="radio"
                         name={`interview_${match.id}`}
                         value="yes"
                         onChange={() => console.log('面试完成')}
                       />
                       是
                     </label>
                     <label>
                       <input
                         type="radio"
                         name={`interview_${match.id}`}
                         value="no"
                         onChange={() => console.log('面试未完成')}
                       />
                       否
                     </label>
                   </div>
                   <div className="feedback-form">
                     <label>请填写你的面试反馈：</label>
                     <textarea
                       className="feedback-form textarea"
                       rows={3}
                       placeholder="请描述你的面试体验、收获或建议"
                     />
                     <button className="contact-button">
                       提交反馈
                     </button>
                   </div>
                 </div>
               )}
            </div>
          ))}
        </div>

        {/* 说明卡片 */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📝 功能说明</h3>
                           <div className="space-y-3 text-sm text-gray-600">
               <div className="flex items-start gap-3">
                 <span className="text-blue-600 font-semibold min-w-0 flex-shrink-0">智能提醒：</span>
                 <span>横幅调整为更长但更窄的尺寸，显示待更新匹配信息</span>
               </div>
               <div className="flex items-start gap-3">
                 <span className="text-green-600 font-semibold min-w-0 flex-shrink-0">时间显示：</span>
                 <span>每个匹配卡片显示"匹配于X小时前"或"匹配于X天前"</span>
               </div>
               <div className="flex items-start gap-3">
                 <span className="text-purple-600 font-semibold min-w-0 flex-shrink-0">状态管理：</span>
                 <span>右上角下拉菜单可以更新联系状态，支持5种状态切换</span>
               </div>
               <div className="flex items-start gap-3">
                 <span className="text-orange-600 font-semibold min-w-0 flex-shrink-0">头像更新：</span>
                 <span>使用dicebear生成的个性化头像，与profile页面保持一致</span>
               </div>
               <div className="flex items-start gap-3">
                 <span className="text-red-600 font-semibold min-w-0 flex-shrink-0">面试反馈：</span>
                 <span>当状态设为"已完成面试"时，显示面试反馈表单</span>
               </div>
               <div className="flex items-start gap-3">
                 <span className="text-gray-600 font-semibold min-w-0 flex-shrink-0">联系方式：</span>
                 <span>完整显示所有联系方式，包括邮箱、微信、LinkedIn</span>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 