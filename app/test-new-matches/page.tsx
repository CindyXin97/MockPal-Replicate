'use client';

import React, { useReducer } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import '@/styles/success.css';

// 简化的状态管理
interface TestState {
  contactStatus: { [key: number]: 'yes' | 'no' | undefined };
  interviewStatus: { [key: number]: 'yes' | 'no' | undefined };
  feedbacks: { [key: number]: string };
  submitted: { [key: number]: boolean };
}

const initialState: TestState = {
  contactStatus: {},
  interviewStatus: {},
  feedbacks: {},
  submitted: {},
};

type TestAction =
  | { type: 'SET_CONTACT_STATUS'; payload: { matchId: number; status: 'yes' | 'no' } }
  | { type: 'SET_INTERVIEW_STATUS'; payload: { matchId: number; status: 'yes' | 'no' } }
  | { type: 'SET_FEEDBACK'; payload: { matchId: number; feedback: string } }
  | { type: 'SUBMIT_FEEDBACK'; payload: number };

function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case 'SET_CONTACT_STATUS':
      return {
        ...state,
        contactStatus: {
          ...state.contactStatus,
          [action.payload.matchId]: action.payload.status,
        },
      };
    case 'SET_INTERVIEW_STATUS':
      return {
        ...state,
        interviewStatus: {
          ...state.interviewStatus,
          [action.payload.matchId]: action.payload.status,
        },
      };
    case 'SET_FEEDBACK':
      return {
        ...state,
        feedbacks: {
          ...state.feedbacks,
          [action.payload.matchId]: action.payload.feedback,
        },
      };
    case 'SUBMIT_FEEDBACK':
      return {
        ...state,
        submitted: {
          ...state.submitted,
          [action.payload]: true,
        },
      };
    default:
      return state;
  }
}

export default function TestNewMatches() {
  const [state, dispatch] = useReducer(testReducer, initialState);

  const matches = [
    {
      id: 1,
      matchId: 101, // 模拟的匹配记录ID
      username: '张三',
      jobType: 'DA',
      experienceLevel: '应届',
      bio: '热爱数据分析，擅长Python和SQL',
      contactInfo: {
        email: 'qq007523@gmail.com',
        wechat: 'testweixin123'
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
      practicePreferences: {
        technicalInterview: true,
        behavioralInterview: false,
        caseAnalysis: true
      }
    },
    {
      id: 2,
      matchId: 102, // 模拟的匹配记录ID
      username: '李四',
      jobType: 'DS',
      experienceLevel: '1-3年',
      bio: '机器学习工程师，专注于推荐系统',
      contactInfo: {
        email: 'lisi@example.com',
        linkedin: 'https://linkedin.com/in/lisi'
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
      practicePreferences: {
        technicalInterview: true,
        behavioralInterview: true,
        caseAnalysis: false
      }
    }
  ];

  const handleFeedbackChange = (matchId: number, feedback: string) => {
    dispatch({ type: 'SET_FEEDBACK', payload: { matchId, feedback } });
  };

  const handleFeedbackSubmit = (matchId: number) => {
    dispatch({ type: 'SUBMIT_FEEDBACK', payload: matchId });
  };

  const handleShowContactTemplates = (match: any) => {
    alert(`查看 ${match.username} 的联系模板功能`);
  };

  const getUserAchievementData = (userId: number) => {
    return { icon: '🌱', level: '新用户', showMoon: false };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>新版成功匹配界面测试</CardTitle>
          <p className="text-gray-600">展示简洁的生产环境风格 + 4个特定功能</p>
        </CardHeader>
        <CardContent>
          {/* Banner已移除 */}
          
          {/* 成功匹配列表 */}
          <div className="cards-container">
            {matches.map((match) => (
              <div key={match.id} className="card">
                <div className="card-header">
                  {/* 1. 头像要和profile同步 */}
                  <div className="avatar">
                    <img 
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${match.username}`}
                      alt={match.username || '用户头像'}
                      className="w-12 h-12 rounded-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="name">{match.username || '匿名用户'}</div>
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
                      {match.jobType || '未设置'} · {match.experienceLevel || '未设置'}
                    </div>
                    {/* 3. 显示匹配于几天前 */}
                    {match.createdAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const matchTime = new Date(match.createdAt);
                          const now = new Date();
                          const diffInHours = Math.floor((now.getTime() - matchTime.getTime()) / (1000 * 60 * 60));
                          
                          if (diffInHours < 24) {
                            return `匹配于${diffInHours}小时前`;
                          } else {
                            const diffInDays = Math.floor(diffInHours / 24);
                            return `匹配于${diffInDays}天前`;
                          }
                        })()}
                      </div>
                    )}
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
                  </div>
                  
                  {/* 2. 联系方式参考格式 */}
                  {match.contactInfo && (
                    <div className="contact mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">联系方式：</div>
                      <div className="space-y-1 text-sm">
                        {match.contactInfo.email && (
                          <div className="contact-item">
                            <span className="contact-title">📧 邮箱: </span>
                            <span>{match.contactInfo.email}</span>
                          </div>
                        )}
                        {match.contactInfo.wechat && (
                          <div className="contact-item">
                            <span className="contact-title">💬 微信: </span>
                            <span>{match.contactInfo.wechat}</span>
                          </div>
                        )}
                        {match.contactInfo.linkedin && (
                          <div className="contact-item">
                            <span className="contact-title">🔗 领英: </span>
                            <span>查看资料</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <button
                      onClick={() => handleShowContactTemplates(match)}
                      className="contact-button"
                    >
                      查看联系模板
                    </button>
                  </div>
                  
                  {/* 4. 修改后的反馈流程 */}
                  <div className="feedback-flow mt-3 p-2 bg-gray-50 rounded-md">
                    {/* 是否添加联系方式？ */}
                    <div className="mb-2">
                      <div className="text-sm font-medium text-gray-700 mb-1">📋 是否添加联系方式？</div>
                      <label className="inline-flex items-center mr-4">
                        <input
                          type="radio"
                          name={`contact_${match.id}`}
                          value="yes"
                          checked={state.contactStatus?.[match.id] === 'yes'}
                          onChange={() => dispatch({ type: 'SET_CONTACT_STATUS', payload: { matchId: match.id, status: 'yes' } })}
                          className="mr-1"
                        />
                        是
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={`contact_${match.id}`}
                          value="no"
                          checked={state.contactStatus?.[match.id] === 'no'}
                          onChange={() => dispatch({ type: 'SET_CONTACT_STATUS', payload: { matchId: match.id, status: 'no' } })}
                          className="mr-1"
                        />
                        否
                      </label>
                    </div>
                    
                    {/* 是否进行面试？- 只在添加联系方式后显示 */}
                    {state.contactStatus?.[match.id] === 'yes' && (
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">🎯 是否进行面试？</div>
                        <label className="inline-flex items-center mr-4">
                          <input
                            type="radio"
                            name={`interview_${match.id}`}
                            value="yes"
                            checked={state.interviewStatus[match.id] === 'yes'}
                            onChange={() => dispatch({ type: 'SET_INTERVIEW_STATUS', payload: { matchId: match.id, status: 'yes' } })}
                            className="mr-1"
                          />
                          是
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name={`interview_${match.id}`}
                            value="no"
                            checked={state.interviewStatus[match.id] === 'no'}
                            onChange={() => dispatch({ type: 'SET_INTERVIEW_STATUS', payload: { matchId: match.id, status: 'no' } })}
                            className="mr-1"
                          />
                          否
                        </label>
                      </div>
                    )}
                    
                    {/* 面试反馈 - 只在进行面试后显示 */}
                    {state.contactStatus?.[match.id] === 'yes' && state.interviewStatus[match.id] === 'yes' && (
                      <div className="feedback-section">
                        {state.submitted[match.id] ? (
                          // 已提交的反馈 - 折叠显示
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-green-600">✅</span>
                              <span className="text-sm font-medium text-green-800">面试反馈已提交</span>
                            </div>
                            {state.feedbacks[match.id] && (
                              <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                                <strong>你的反馈：</strong>
                                <p className="mt-1">{state.feedbacks[match.id]}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          // 未提交的反馈 - 展开表单
                          <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">✍️ 请填写你的面试反馈：</label>
                            <textarea
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              rows={3}
                              value={state.feedbacks[match.id] || ''}
                              onChange={e => handleFeedbackChange(match.id, e.target.value)}
                              placeholder="请描述你的面试体验、收获或建议"
                            />
                            <button
                              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400"
                                                                        onClick={() => handleFeedbackSubmit(match.matchId || match.id)}
                              disabled={!state.feedbacks[match.id]}
                            >
                              提交反馈
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">✅ 实现的4个特性 + 最新修改：</h3>
            <ul className="text-sm space-y-1">
              <li>1. ✅ 头像与profile同步 (使用dicebear)</li>
              <li>2. ✅ 联系方式格式：📧 邮箱: xxx, 💬 微信: xxx, 🔗 领英: xxx</li>
              <li>3. ✅ 显示"匹配于X小时前/X天前"</li>
              <li>4. ✅ 新反馈流程：是否添加联系方式？→ 是否进行面试？→ 请填写面试反馈</li>
              <li>5. ✅ 移除了匹配界面的banner</li>
              <li>6. ✅ 缩小了反馈问题的字体和间距</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 