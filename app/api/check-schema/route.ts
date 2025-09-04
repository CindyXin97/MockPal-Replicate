import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return NextResponse.json({
        success: false, 
        error: '数据库连接字符串(DATABASE_URL)未设置'
      }, { status: 500 });
    }
    
    const sql = neon(dbUrl);
    
    // 查询users表结构
    const usersSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    return NextResponse.json({
      success: true,
      message: 'users表结构',
      schema: usersSchema
    });
  } catch (error) {
    console.error('Database query error:', error);
    
    return NextResponse.json({
      success: false,
      error: `查询失败: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}
