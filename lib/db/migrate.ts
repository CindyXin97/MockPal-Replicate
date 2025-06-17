import { db } from './index';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// 加载环境变量
config();

async function migrate() {
  try {
    // 读取迁移文件
    const migrationFiles = fs.readdirSync(path.join(process.cwd(), 'lib/db/migrations'))
      .filter(file => file.endsWith('.sql'))
      .sort();

    // 执行每个迁移文件
    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const migration = fs.readFileSync(
        path.join(process.cwd(), 'lib/db/migrations', file),
        'utf-8'
      );
      
      await db.execute(migration);
      console.log(`Migration ${file} completed successfully`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate(); 