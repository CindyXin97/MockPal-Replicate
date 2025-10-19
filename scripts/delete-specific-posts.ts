import 'dotenv/config';
import { db } from '../lib/db';
import { userInterviewPosts } from '../lib/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * 删除指定的用户分享帖子
 */

// 要删除的帖子（根据公司和职位）
const postsToDelete = [
  { company: 'Airbnb', position: 'Data Analyst' },
  { company: 'TikTok', position: 'Data Scientist' },
  { company: 'Microsoft', position: 'Data Scientist' },
  { company: 'Netflix', position: 'Data Scientist' },
  { company: 'Amazon', position: 'Data Analyst' },
];

async function deleteSpecificPosts() {
  try {
    console.log('🗑️  开始删除指定的帖子...\n');

    let totalDeleted = 0;

    for (const post of postsToDelete) {
      // 查找匹配的帖子
      const matchingPosts = await db
        .select()
        .from(userInterviewPosts)
        .where(
          and(
            eq(userInterviewPosts.company, post.company),
            eq(userInterviewPosts.position, post.position)
          )
        );

      if (matchingPosts.length === 0) {
        console.log(`⚠️  未找到: ${post.company} - ${post.position}`);
        continue;
      }

      // 删除所有匹配的帖子
      for (const matchedPost of matchingPosts) {
        await db
          .delete(userInterviewPosts)
          .where(eq(userInterviewPosts.id, matchedPost.id));
        
        totalDeleted++;
        console.log(`✅ 已删除: ${post.company} - ${post.position} (ID: ${matchedPost.id})`);
      }
    }

    console.log(`\n🎉 成功删除 ${totalDeleted} 条帖子！`);
    console.log('💡 刷新页面即可看到更新后的列表\n');

  } catch (error) {
    console.error('❌ 删除失败:', error);
    throw error;
  }
}

// 运行脚本
deleteSpecificPosts()
  .then(() => {
    console.log('✅ 脚本执行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });

