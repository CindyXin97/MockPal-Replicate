import 'dotenv/config';
import { db } from '../lib/db';
import { users, userInterviewPosts } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 创建假的用户面试分享数据
 * 用于测试社区功能
 */

// 真实感的面试分享内容
const fakePosts = [
  {
    company: 'Meta',
    position: 'Data Scientist',
    questionType: 'technical',
    difficulty: 'hard',
    question: '我面了Meta的DS岗位二面，面试官让我设计一个推荐系统。具体是给Facebook用户推荐可能认识的人（People You May Know）。\n\n我当时的思路是：\n1. 先用共同好友数作为基础特征\n2. 加上地理位置、工作经历、教育背景等\n3. 用协同过滤算法\n\n但是面试官问我如果用户是新用户怎么办？冷启动问题我有点卡住了... 大家有什么好的解决方案吗？',
    interviewDate: new Date('2024-10-15'),
  },
  {
    company: 'Google',
    position: 'Product Analyst',
    questionType: 'case_study',
    difficulty: 'medium',
    question: '今天面了Google PA的case study，题目是：YouTube的日活突然下降了10%，你会怎么分析？\n\n我的分析框架：\n- 先看是全球还是某个地区\n- 检查是不是统计口径变了\n- 看用户细分（年龄、设备等）\n- 检查产品是否有bug或新功能上线\n\n面试官还追问了如果是竞品导致的怎么办，我说可以做用户调研和竞品分析。\n\n感觉答得还行，但不知道有没有遗漏什么重要的点？',
    interviewDate: new Date('2024-10-12'),
  },
  {
    company: 'Amazon',
    position: 'Data Analyst',
    questionType: 'technical',
    difficulty: 'medium',
    question: '面了Amazon的DA岗位，SQL题：有两个表，orders和customers，要找出每个月新增的paying customers（首次下单的用户）。\n\n我用的方法是：\n```sql\nWITH first_orders AS (\n  SELECT \n    customer_id,\n    MIN(order_date) as first_order_date\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT \n  DATE_TRUNC(\'month\', first_order_date) as month,\n  COUNT(DISTINCT customer_id) as new_customers\nFROM first_orders\nGROUP BY 1\nORDER BY 1;\n```\n\n但面试官问我如果数据量特别大怎么优化？我有点懵，有人知道吗？',
    interviewDate: new Date('2024-10-10'),
  },
  {
    company: 'Netflix',
    position: 'Data Scientist',
    questionType: 'stats',
    difficulty: 'hard',
    question: 'Netflix DS面试，统计题：\n\n如果我们要做A/B test，测试新的推荐算法对用户观看时长的影响。怎么设计实验？需要多大的样本量？\n\n我说：\n- 设定显著性水平α=0.05，power=0.8\n- 假设MDE（最小可检测效应）是提升5%\n- 用公式计算样本量\n\n但面试官问如果用户行为有很强的季节性（周末vs工作日），怎么处理？\n\n我当时说可以用stratified sampling按weekday/weekend分层，但不确定是不是最佳答案。大家怎么看？',
    interviewDate: new Date('2024-10-08'),
  },
  {
    company: 'Apple',
    position: 'Data Analyst',
    questionType: 'behavioral',
    difficulty: 'easy',
    question: '今天Apple的行为面试，问我：\n\n"Tell me about a time when you had to present complex data insights to non-technical stakeholders."\n\n我分享了之前做的一个用户留存分析项目，本来想展示cohort analysis和retention curve，但是产品经理们看不懂。\n\n我后来改成了：\n- 用简单的折线图\n- 配上具体数字和百分比\n- 讲故事而不是讲技术\n- 重点放在"so what"和actionable insights\n\n面试官追问了如果stakeholder不同意你的结论怎么办，我说会准备备用方案和数据支撑。\n\n感觉这一轮还挺顺利的！大家面Apple都遇到什么behavioral题目？',
    interviewDate: new Date('2024-10-05'),
  },
  {
    company: 'Microsoft',
    position: 'Data Scientist',
    questionType: 'technical',
    difficulty: 'medium',
    question: '面了Microsoft的ML工程题：\n\n给定用户的历史搜索记录，预测用户的下一次搜索query。可以用什么模型？\n\n我当时说了几个方案：\n1. LSTM/GRU处理序列数据\n2. Transformer模型（像BERT）\n3. 简单的N-gram模型\n\n面试官问我怎么评估模型效果，我说可以用perplexity和top-k accuracy。\n\n但是后来问到production deployment，我有点答不上来... 有做过这种搜索推荐系统的朋友吗？求指点！',
    interviewDate: new Date('2024-10-03'),
  },
  {
    company: 'Uber',
    position: 'Data Analyst',
    questionType: 'case_study',
    difficulty: 'hard',
    question: 'Uber DA面试case：\n\n"Uber Eats的订单量在某个城市突然增长了50%，你怎么分析这是好事还是坏事？"\n\n我的思路：\n1. 先看是真实增长还是数据异常\n2. 看unit economics - 是profitable growth吗？\n3. 检查补贴/促销活动\n4. 看用户质量（留存率、复购率）\n5. 检查供给端（餐厅、配送员）是否能支撑\n\n面试官说很好，但是追问：如果发现是因为竞品出了事故（比如DoorDash系统崩溃），我们应该怎么应对？\n\n这个问题有点tricky，我说的是关注长期留存而不是短期增长，不知道对不对？',
    interviewDate: new Date('2024-10-01'),
  },
  {
    company: 'TikTok',
    position: 'Data Scientist',
    questionType: 'technical',
    difficulty: 'hard',
    question: 'TikTok DS面试，算法题：\n\n设计一个算法来检测视频内容是否是重复的（比如re-upload或稍作修改）。\n\n我说可以用：\n- Perceptual hashing（感知哈希）\n- 提取视频关键帧，用CNN生成embedding\n- 用cosine similarity比较\n\n面试官问scale问题：如果平台每天有上亿个视频上传，怎么做到real-time检测？\n\n我提到了：\n- 用Locality Sensitive Hashing (LSH)加速相似度搜索\n- 分布式计算\n- 用Approximate Nearest Neighbor (ANN)\n\n但具体实现细节我不太确定... 有大佬能分享一下吗？',
    interviewDate: new Date('2024-09-28'),
  },
  {
    company: 'Airbnb',
    position: 'Data Analyst',
    questionType: 'technical',
    difficulty: 'medium',
    question: 'Airbnb DA面试SQL题：\n\n有一个bookings表，求每个host的平均booking gap（两次预订之间的天数）。\n\n我的SQL：\n```sql\nWITH booking_gaps AS (\n  SELECT \n    host_id,\n    checkin_date,\n    LAG(checkout_date) OVER (PARTITION BY host_id ORDER BY checkin_date) as prev_checkout,\n    DATEDIFF(checkin_date, prev_checkout) as gap_days\n  FROM bookings\n)\nSELECT \n  host_id,\n  AVG(gap_days) as avg_gap\nFROM booking_gaps\nWHERE gap_days IS NOT NULL\nGROUP BY host_id;\n```\n\n面试官说思路对的，但是问如果gap是负数怎么办（overlapping bookings）？\n\n我说可以加WHERE gap_days > 0的条件，但不确定这样会不会miss掉什么edge case？',
    interviewDate: new Date('2024-09-25'),
  },
  {
    company: 'LinkedIn',
    position: 'Data Scientist',
    questionType: 'stats',
    difficulty: 'medium',
    question: 'LinkedIn DS面试，概率题：\n\n假设LinkedIn有一个功能是推荐"你可能认识的人"。如果随机推荐，用户点击率是1%。现在用了新算法，测试了100个用户，有3个人点击了。问：新算法是否比随机推荐更好？\n\n我用了binomial test：\n- H0: p = 0.01\n- H1: p > 0.01\n- 观测到3/100 = 3%\n\n算出p-value大概是0.08，在α=0.05下不能拒绝H0。\n\n但面试官说这个test power太低了，应该用什么方法？我有点懵...\n\n有统计大神能解释一下吗？是不是应该先做power analysis确定样本量？',
    interviewDate: new Date('2024-09-22'),
  }
];

async function createFakePosts() {
  try {
    console.log('🚀 开始创建假的用户分享数据...\n');

    // 1. 检查或创建测试用户
    const testUserEmail = 'test.user@mockpal.com';
    let testUser = await db
      .select()
      .from(users)
      .where(eq(users.email, testUserEmail))
      .limit(1);

    let testUserId: number;

    if (testUser.length === 0) {
      console.log('📝 创建测试用户...');
      const newUser = await db
        .insert(users)
        .values({
          email: testUserEmail,
          name: 'MockPal 测试用户',
          passwordHash: 'dummy_hash',
          emailVerified: new Date(),
        })
        .returning();
      testUserId = newUser[0].id;
      console.log(`✅ 测试用户已创建 (ID: ${testUserId})\n`);
    } else {
      testUserId = testUser[0].id;
      console.log(`✅ 使用现有测试用户 (ID: ${testUserId})\n`);
    }

    // 2. 创建假的面试分享
    console.log('📝 插入假的面试分享...\n');

    for (const post of fakePosts) {
      const result = await db
        .insert(userInterviewPosts)
        .values({
          userId: testUserId,
          company: post.company,
          position: post.position,
          questionType: post.questionType,
          difficulty: post.difficulty,
          question: post.question,
          interviewDate: post.interviewDate,
          isAnonymous: false,
          status: 'active',
          viewsCount: Math.floor(Math.random() * 50), // 随机浏览量
        })
        .returning();

      console.log(`✅ ${post.company} - ${post.position} (${post.difficulty})`);
    }

    console.log(`\n🎉 成功创建 ${fakePosts.length} 条假的用户分享！`);
    console.log('\n💡 提示：这些分享都关联到测试用户 test.user@mockpal.com');
    console.log('💡 刷新页面即可看到这些内容！\n');

  } catch (error) {
    console.error('❌ 创建失败:', error);
    throw error;
  }
}

// 运行脚本
createFakePosts()
  .then(() => {
    console.log('✅ 脚本执行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });

