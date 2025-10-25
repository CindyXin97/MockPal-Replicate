'use client';

import { useEffect, useState } from 'react';

export default function TestAPIResponse() {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/stats')
      .then(res => res.json())
      .then(data => {
        setApiData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 API Response 测试页面</h1>
      <p className="text-gray-600 mb-6">
        这个页面直接显示 <code>/api/user/stats</code> 返回的原始数据
      </p>

      {apiData?.success && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">📊 活动统计</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500 mb-1">本周活动</div>
                <div className="text-3xl font-bold text-blue-600">
                  {apiData.data.activity?.thisWeek ?? 'N/A'}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  📝 {apiData.data.activity?.thisWeekPosts ?? 0} 
                  {' '}💬 {apiData.data.activity?.thisWeekComments ?? 0}
                  {' '}📖 {apiData.data.activity?.thisWeekViews ?? 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500 mb-1">本月活动</div>
                <div className="text-3xl font-bold text-purple-600">
                  {apiData.data.activity?.thisMonth ?? 'N/A'}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  📝 {apiData.data.activity?.thisMonthPosts ?? 0}
                  {' '}💬 {apiData.data.activity?.thisMonthComments ?? 0}
                  {' '}📖 {apiData.data.activity?.thisMonthViews ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">📋 完整 JSON 响应</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {!apiData?.success && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">❌ API 错误</h2>
          <pre className="text-sm">{JSON.stringify(apiData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

