'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestDbPage() {
  const [message, setMessage] = useState('');

  const testDbConnection = async () => {
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setMessage(JSON.stringify(data, null, 2));
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  const clearLocalStorage = () => {
    try {
      // Clear all localStorage
      localStorage.clear();
      // Clear specific items
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      setMessage('LocalStorage cleared successfully! Please refresh the page.');
    } catch (error) {
      setMessage(`Error clearing localStorage: ${error}`);
    }
  };

  const clearDatabase = async () => {
    try {
      setMessage('正在清空数据库...');
      const response = await fetch('/api/clear-db', {
        method: 'POST'
      });
      const data = await response.json();
      setMessage(JSON.stringify(data, null, 2));
    } catch (error) {
      setMessage(`Error clearing database: ${error}`);
    }
  };


  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Test & Debug Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={testDbConnection}>
              Test Database Connection
            </Button>
            <Button onClick={clearDatabase} variant="destructive">
              🗑️ Clear Database Data
            </Button>
            <Button onClick={clearLocalStorage} variant="outline">
              Clear LocalStorage (Fix Default Login)
            </Button>
          </div>
          {message && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {message}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 