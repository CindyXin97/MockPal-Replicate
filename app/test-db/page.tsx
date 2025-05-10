'use client';

import { useState } from 'react';
import { neon } from '@neondatabase/serverless';

export default function TestDbPage() {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function testConnection() {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await fetch('/api/test-db');
      const data = await result.json();
      
      if (data.success) {
        setMessage(data.message);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error testing DB connection:', err);
      setError('测试连接失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">数据库连接测试</h1>
      
      <button 
        onClick={testConnection}
        disabled={loading}
        className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? '测试中...' : '测试数据库连接'}
      </button>
      
      {message && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 