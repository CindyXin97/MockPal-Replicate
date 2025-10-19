import 'dotenv/config';
import { db } from '../lib/db';
import { userInterviewPosts } from '../lib/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * 更新Apple帖子的内容为更自然的版本
 */

const newQuestion = `今天Apple面试遇到一个behavioral question，问我有没有给非技术的人讲解过数据分析的经历。

我当时举了一个例子，之前做用户留存分析的时候，本来准备了cohort analysis和retention curve这些图表，结果产品经理们一脸懵。后来我发现他们其实不care这些技术细节，就改成了很简单的折线图，加上一些具体的数字和百分比，然后就像讲故事一样跟他们解释为什么会出现这个趋势，以及我们可以做什么。

面试官还追问说如果他们不同意我的结论怎么办，我说我一般会准备几个备用方案，用不同的数据角度来支撑。

说实话不知道答得怎么样，但感觉气氛还不错。想问问大家面Apple的时候都遇到过什么behavioral题？有点好奇他们主要看重什么...`;

async function updateApplePost() {
  try {
    console.log('🔄 更新Apple帖子内容...\n');

    // 查找Apple的帖子
    const applePosts = await db
      .select()
      .from(userInterviewPosts)
      .where(
        and(
          eq(userInterviewPosts.company, 'Apple'),
          eq(userInterviewPosts.position, 'Data Analyst')
        )
      );

    if (applePosts.length === 0) {
      console.log('❌ 未找到Apple - Data Analyst的帖子');
      return;
    }

    // 更新帖子内容
    for (const post of applePosts) {
      await db
        .update(userInterviewPosts)
        .set({ 
          question: newQuestion
        })
        .where(eq(userInterviewPosts.id, post.id));

      console.log(`✅ 已更新帖子 ID: ${post.id}`);
      console.log(`   公司: Apple`);
      console.log(`   职位: Data Analyst`);
      console.log(`   新内容更自然、更口语化！\n`);
    }

    console.log('💡 刷新页面即可看到更新后的内容！\n');

  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  }
}

// 运行脚本
updateApplePost()
  .then(() => {
    console.log('✅ 脚本执行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });

