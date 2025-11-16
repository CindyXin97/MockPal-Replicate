'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom } from '@/lib/store';

interface InviteCodeInfo {
  inviteCode: string;
  timesUsed: number;
  totalReferrals: number;
}

export function InviteCodeCard() {
  const [inviteInfo, setInviteInfo] = useState<InviteCodeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [language] = useAtom(languageAtom);
  const t = useMemo(() => {
    if (language === 'en') {
      return {
        title: 'Invite Friends',
        copied: 'Copied',
        copy: 'Copy',
        joined: (n: number) => `${n} friends joined`,
        usedTimes: (n: number) => `Used ${n} times`,
        hint: '💡 When a friend registers with your invite code, you get +2 daily match quotas',
        toastCopied: 'Invite code copied!',
        toastCopyFailed: 'Copy failed',
        fetchFailed: 'Failed to fetch invite code',
      };
    }
    return {
      title: '邀请好友',
      copied: '已复制',
      copy: '复制',
      joined: (n: number) => `${n} 位好友已加入`,
      usedTimes: (n: number) => `使用次数 ${n}`,
      hint: '💡 好友使用你的邀请码注册，你将获得 +2 每日匹配配额',
      toastCopied: '邀请码已复制！',
      toastCopyFailed: '复制失败',
      fetchFailed: '获取邀请码失败',
    };
  }, [language]);

  useEffect(() => {
    fetchInviteCode();
  }, []);

  const fetchInviteCode = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invite-codes');
      const data = await response.json();
      if (data.success) {
        setInviteInfo(data.data);
      } else {
        toast.error(data.message || t.fetchFailed);
      }
    } catch (error) {
      console.error('Failed to fetch invite code:', error);
      toast.error(t.fetchFailed);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteInfo) return;

    try {
      await navigator.clipboard.writeText(inviteInfo.inviteCode);
      setCopied(true);
      toast.success(t.toastCopied);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(t.toastCopyFailed);
    }
  };

  if (loading) {
    return (
      <Card className="border-l-4 border-l-green-400 bg-gradient-to-br from-green-50/30 to-emerald-50/20 animate-pulse">
        <CardContent className="pt-3 pb-3">
          <div className="h-6 bg-green-100 rounded w-1/3 mb-3"></div>
          <div className="h-10 bg-green-100 rounded w-full mb-3"></div>
          <div className="h-4 bg-green-100 rounded w-2/3"></div>
        </CardContent>
      </Card>
    );
  }

  if (!inviteInfo) return null;

  return (
    <Card className="border-l-4 border-l-green-400 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-green-50/30 to-emerald-50/20">
      <CardContent className="pt-3 pb-3">
        {/* 标题 */}
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-1 mb-2">
          <span className="text-lg">🎁</span> {t.title}
        </h2>

        {/* 邀请码 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 p-2 bg-white rounded-md border border-green-200 font-mono text-center text-lg font-bold text-green-600">
            {inviteInfo.inviteCode}
          </div>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="h-9 px-3 border-green-300 text-green-600 hover:bg-green-50 font-medium"
          >
            {copied ? (
              <>
                <Check size={14} className="mr-1" />
                {t.copied}
              </>
            ) : (
              <>
                <Copy size={14} className="mr-1" />
                {t.copy}
              </>
            )}
          </Button>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600">
            <span className="font-medium text-green-700">{inviteInfo.totalReferrals}</span> {t.joined(inviteInfo.totalReferrals).replace(/^\d+\s*/, '')}
          </div>
          <div className="text-gray-600">
            {t.usedTimes(inviteInfo.timesUsed).replace(/\d+\s*/, '')} <span className="font-medium text-green-700">{inviteInfo.timesUsed}</span>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-100">
          <p className="text-xs text-green-700">
            {t.hint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

