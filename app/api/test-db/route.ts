import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 获取环境变量中的数据库连接字符串
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return NextResponse.json({
        success: false, 
        error: '数据库连接字符串(DATABASE_URL)未设置'
      }, { status: 500 });
    }
    
    // 创建 Neon SQL 客户端
    const sql = neon(dbUrl);
    
    // 执行简单查询测试连接
    const result = await sql`SELECT NOW() as time`;
    
    return NextResponse.json({
      success: true,
      message: `数据库连接成功! 服务器时间: ${result[0].time}`,
      result
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      success: false,
      error: `数据库连接失败: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
} 