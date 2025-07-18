'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { generateWeChatTemplate, generateWeChatFriendRequestTemplate, generateLinkedInTemplate, generateEmailTemplate, copyToClipboard } from '@/lib/contact-templates';
import type { Match } from '@/lib/store';

interface ContactTemplatesProps {
  match: Match;
  currentUser: { username: string; jobType?: string; experienceLevel?: string };
  onClose: () => void;
}

export function ContactTemplates({ match, currentUser, onClose }: ContactTemplatesProps) {
  const [activeTab, setActiveTab] = useState('wechat');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const wechatFriendRequestTemplate = generateWeChatFriendRequestTemplate(match, currentUser);
  const wechatTemplate = generateWeChatTemplate(match, currentUser);
  const linkedinTemplate = generateLinkedInTemplate(match, currentUser);
  const emailTemplate = generateEmailTemplate(match, currentUser);

  const handleCopy = async (text: string, tabName: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedTab(tabName);
      toast.success('模板已复制到剪贴板');
      setTimeout(() => setCopiedTab(null), 2000);
    } else {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">联系模板 - {match.username}</CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            选择以下任一方式联系你的匹配伙伴，模板已根据双方资料自动生成
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="wechat" className="flex items-center gap-2">
                <span className="text-green-600">💬</span>
                微信
              </TabsTrigger>
              <TabsTrigger value="wechat-friend" className="flex items-center gap-2">
                <span className="text-green-600">👋</span>
                微信好友申请
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="flex items-center gap-2">
                <span className="text-blue-600">💼</span>
                LinkedIn
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <span className="text-red-600">📧</span>
                邮箱
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="wechat" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">💬 微信聊天模板</h3>
                  <p className="text-sm text-green-700 mb-4">
                    复制以下内容，在微信聊天中发送给 {match.username}
                  </p>
                  <div className="bg-white border border-green-300 rounded p-4 whitespace-pre-wrap text-sm leading-relaxed">
                    {wechatTemplate}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={() => handleCopy(wechatTemplate, 'wechat')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {copiedTab === 'wechat' ? '✅ 已复制' : '📋 复制模板'}
                    </Button>
                    {match.contactInfo?.wechat && (
                      <Button variant="outline" className="text-green-600 border-green-600">
                        📱 微信: {match.contactInfo.wechat}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="wechat-friend" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">👋 微信好友申请模板</h3>
                  <p className="text-sm text-green-700 mb-4">
                    复制以下内容，在微信好友申请验证消息中使用（{wechatFriendRequestTemplate.length}/50字符）
                  </p>
                  <div className="bg-white border border-green-300 rounded p-4 whitespace-pre-wrap text-sm leading-relaxed">
                    {wechatFriendRequestTemplate}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    字数：{wechatFriendRequestTemplate.length}/50 字符
                    {wechatFriendRequestTemplate.length > 50 && (
                      <span className="text-red-500 ml-2">⚠️ 超出微信好友申请字数限制</span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={() => handleCopy(wechatFriendRequestTemplate, 'wechat-friend')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {copiedTab === 'wechat-friend' ? '✅ 已复制' : '📋 复制模板'}
                    </Button>
                    {match.contactInfo?.wechat && (
                      <Button variant="outline" className="text-green-600 border-green-600">
                        📱 微信: {match.contactInfo.wechat}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="linkedin" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">💼 LinkedIn联系模板</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    复制以下内容，在LinkedIn中发送消息给 {match.username}
                  </p>
                  <div className="bg-white border border-blue-300 rounded p-4 whitespace-pre-wrap text-sm leading-relaxed">
                    {linkedinTemplate}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={() => handleCopy(linkedinTemplate, 'linkedin')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {copiedTab === 'linkedin' ? '✅ 已复制' : '📋 复制模板'}
                    </Button>
                    {match.contactInfo?.linkedin && (
                      <Button variant="outline" className="text-blue-600 border-blue-600">
                        🔗 LinkedIn: {match.contactInfo.linkedin}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">📧 邮箱联系模板</h3>
                  <p className="text-sm text-red-700 mb-4">
                    复制以下内容，在邮箱中发送给 {match.username}
                  </p>
                  <div className="bg-white border border-red-300 rounded p-4 whitespace-pre-wrap text-sm leading-relaxed">
                    {emailTemplate}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={() => handleCopy(emailTemplate, 'email')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {copiedTab === 'email' ? '✅ 已复制' : '📋 复制模板'}
                    </Button>
                    {match.contactInfo?.email && (
                      <Button variant="outline" className="text-red-600 border-red-600">
                        📧 邮箱: {match.contactInfo.email}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 