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
    
    // 查询用户数据
    const users = await sql`
      SELECT 
        u.id, 
        u.email, 
        u.username, u.name, 
        u.image,
        p.job_type,
        p.experience_level,
        p.bio
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY u.id
    `;
    
    return NextResponse.json({
      success: true,
      message: `找到 ${users.length} 个用户`,
      users
    });
  } catch (error) {
    console.error('Database query error:', error);
    
    return NextResponse.json({
      success: false,
      error: `查询失败: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}
