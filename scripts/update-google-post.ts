import 'dotenv/config';
import { db } from '../lib/db';
import { userInterviewPosts } from '../lib/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * 更新Google帖子的内容为更自然的版本
 */

const newQuestion = `今天Google PA的case study面得我有点懵，问YouTube的日活突然掉了10%，让我分析原因。

我当时脑子里第一反应是先确认是全球性的还是某个地区的问题，然后想会不会是统计口径改了（之前遇到过类似的乌龙😅）。接着我说要看看是哪些用户群体受影响最大，比如是年轻用户还是老年用户，是mobile还是desktop。还有就是产品侧有没有什么变化，比如新功能上线或者bug之类的。

面试官听完之后追问，如果发现是竞品导致的呢？我说那可能需要做用户调研，看看用户为什么流失到竞品那边去了，然后做竞品分析看看他们最近有什么新动作。

回头想想感觉答得还算有逻辑，但总觉得可能漏了什么重要的分析角度？有没有大佬帮忙看看还能从哪些方面入手？`;

async function updateGooglePost() {
  try {
    console.log('🔄 更新Google帖子内容...\n');

    // 查找Google的帖子
    const googlePosts = await db
      .select()
      .from(userInterviewPosts)
      .where(
        and(
          eq(userInterviewPosts.company, 'Google'),
          eq(userInterviewPosts.position, 'Product Analyst')
        )
      );

    if (googlePosts.length === 0) {
      console.log('❌ 未找到Google - Product Analyst的帖子');
      return;
    }

    // 更新帖子内容
    for (const post of googlePosts) {
      await db
        .update(userInterviewPosts)
        .set({ 
          question: newQuestion
        })
        .where(eq(userInterviewPosts.id, post.id));

      console.log(`✅ 已更新帖子 ID: ${post.id}`);
      console.log(`   公司: Google`);
      console.log(`   职位: Product Analyst`);
      console.log(`   新内容更自然、更口语化！\n`);
    }

    console.log('💡 刷新页面即可看到更新后的内容！\n');

  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  }
}

// 运行脚本
updateGooglePost()
  .then(() => {
    console.log('✅ 脚本执行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });

