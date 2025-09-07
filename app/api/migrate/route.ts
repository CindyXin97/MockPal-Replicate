import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  try {
    // 只允许在开发环境或通过特定密钥访问
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // 创建 user_achievements 表
    await sql`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        total_interviews INTEGER DEFAULT 0 NOT NULL,
        experience_points INTEGER DEFAULT 0 NOT NULL,
        current_level VARCHAR(50) DEFAULT '新用户' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)`;

    return NextResponse.json({ 
      success: true, 
      message: 'user_achievements表创建成功' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: '迁移失败: ' + (error as Error).message 
    }, { status: 500 });
  }
} 