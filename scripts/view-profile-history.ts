import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { getUserProfileHistory, getFieldHistory, formatHistoryRecord } from '@/lib/profile-history';

async function viewProfileHistory() {
  const userId = process.argv[2] ? parseInt(process.argv[2]) : 1;
  const fieldName = process.argv[3];

  try {
    console.log(`\n📜 查看 User ${userId} 的资料修改历史\n`);
    console.log('='.repeat(80) + '\n');

    if (fieldName) {
      // 查看特定字段的历史
      console.log(`🔍 字段: ${fieldName}\n`);
      const result = await getFieldHistory(userId, fieldName);
      
      if (!result.success || result.history.length === 0) {
        console.log(`❌ 没有找到字段 "${fieldName}" 的修改记录\n`);
        process.exit(0);
      }

      console.log(`找到 ${result.history.length} 条记录:\n`);
      
      result.history.forEach((record: any, index: number) => {
        const formatted = formatHistoryRecord(record);
        console.log(`${index + 1}. ${formatted.时间} - ${formatted.操作类型}`);
        console.log(`   ${fieldName}: ${(record as any)[fieldName]}`);
        console.log('');
      });
    } else {
      // 查看所有历史
      const result = await getUserProfileHistory(userId, 50);
      
      if (!result.success || result.history.length === 0) {
        console.log(`❌ User ${userId} 没有修改历史记录\n`);
        console.log('💡 可能的原因:');
        console.log('   1. 该用户还未创建或修改过资料');
        console.log('   2. 历史记录功能刚刚添加，之前的修改没有记录\n');
        process.exit(0);
      }

      console.log(`找到 ${result.history.length} 条修改记录:\n`);
      
      result.history.forEach((record: any, index: number) => {
        const formatted = formatHistoryRecord(record);
        console.log(`${index + 1}. ${formatted.时间}`);
        console.log(`   操作: ${formatted.操作类型}`);
        if (formatted.修改字段) {
          console.log(`   修改字段: ${formatted.修改字段}`);
        }
        console.log(`   经验水平: ${formatted.经验水平 || '未设置'}`);
        console.log(`   岗位类型: ${formatted.岗位类型 || '未设置'}`);
        console.log(`   目标公司: ${formatted.目标公司 || '未设置'}`);
        console.log(`   学校: ${formatted.学校 || '未设置'}`);
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('✅ 查询完成\n');

    // 使用说明
    if (!fieldName) {
      console.log('💡 使用提示:');
      console.log(`   查看所有历史: npx tsx scripts/view-profile-history.ts ${userId}`);
      console.log(`   查看特定字段: npx tsx scripts/view-profile-history.ts ${userId} experienceLevel`);
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

viewProfileHistory();

