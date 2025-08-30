'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PublicLayout } from '@/components/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  return (
    <PublicLayout redirectIfAuthenticated={false}>
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-white to-gray-50 -z-10" aria-hidden="true"></div>
      <div className="flex min-h-[70vh] items-center justify-center w-full">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 bg-white relative z-10 -mt-16">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-center tracking-tight text-gray-900">
              查看您的邮箱
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              我们已经向{email ? (
                <>
                  <span className="font-semibold text-blue-600"> {email} </span>
                </>
              ) : '您的邮箱'}发送了一封包含登录链接的邮件。
            </p>
            <p className="text-gray-600">
              请点击邮件中的链接完成登录。
            </p>
            <p className="text-sm text-gray-500 mt-6">
              如果没有收到邮件，请检查垃圾邮件文件夹。
            </p>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    }>
      <VerifyRequestContent />
    </Suspense>
  );
}