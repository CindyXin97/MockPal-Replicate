'use client';

import Link from 'next/link';
import { useAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { isAuthenticatedAtom } from '@/lib/store';
import { PublicLayout } from '@/components/public-layout';

export default function Home() {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);

  return (
    <PublicLayout redirectIfAuthenticated={false}>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-4xl font-bold mb-6">MockPal</h1>
        <p className="text-xl mb-8 max-w-2xl">
          专为数据岗位(DA/DS/DE)求职者设计的模拟面试匹配平台
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl">
          <div className="flex flex-col items-center p-6 border rounded-lg">
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-xl font-bold mb-3">填写标签</h2>
            <p className="text-sm text-center text-muted-foreground">
              岗位类型、经验水平、目标公司/行业等标签快速描述你的需求
            </p>
          </div>
          
          <div className="flex flex-col items-center p-6 border rounded-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold mb-3">匹配伙伴</h2>
            <p className="text-sm text-center text-muted-foreground">
              基于标签匹配最适合的练习伙伴，浏览候选人并选择喜欢的对象
            </p>
          </div>
          
          <div className="flex flex-col items-center p-6 border rounded-lg">
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-xl font-bold mb-3">开始练习</h2>
            <p className="text-sm text-center text-muted-foreground">
              匹配成功后可查看联系方式，立即开始面试练习
            </p>
          </div>
        </div>
        
        <div className="space-y-4 mt-6">
          <Button asChild>
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild variant="outline" className="ml-4">
            <Link href="/register">注册</Link>
          </Button>
          <Button asChild variant="secondary" className="ml-4">
            <Link href="/test-db">测试数据库</Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
