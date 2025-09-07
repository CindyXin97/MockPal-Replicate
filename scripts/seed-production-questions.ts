import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

// 面试题目数据
const interviewQuestions = [
  // Meta题目
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如果Facebook的用户参与度下降了5%，你会如何分析这个问题？',
    recommendedAnswer: '分析框架：1.定义问题范围 2.时间维度分析 3.用户分群分析 4.产品功能分析',
    tags: '用户分析,产品分析',
    source: '面试真题',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '产品分析师',
    questionType: 'case_study',
    difficulty: 'hard',
    question: '设计一个实验来测试Facebook新功能对用户留存的影响',
    recommendedAnswer: '实验设计：1.定义假设 2.选择指标 3.实验分组 4.样本大小计算 5.结果分析',
    tags: 'A/B测试,实验设计',
    source: '面试真题',
    year: 2024,
    isVerified: true
  },
  // Google题目
  {
    company: 'Google',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何设计一个推荐系统来提高YouTube的用户观看时长？',
    recommendedAnswer: '推荐系统设计：1.协同过滤 2.内容过滤 3.深度学习模型 4.实时更新',
    tags: '推荐系统,机器学习',
    source: '面试真题',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '产品分析师',
    questionType: 'stats',
    difficulty: 'medium',
    question: '解释p-value的含义，以及在A/B测试中如何使用',
    recommendedAnswer: 'p-value表示在零假设为真的情况下，观察到当前结果或更极端结果的概率',
    tags: '统计学,假设检验',
    source: '面试真题',
    year: 2024,
    isVerified: true
  },
  // Amazon题目
  {
    company: 'Amazon',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何分析Amazon Prime会员的流失原因？',
    recommendedAnswer: '流失分析：1.定义流失 2.生存分析 3.特征工程 4.预测模型',
    tags: '流失分析,生存分析',
    source: '面试真题',
    year: 2024,
    isVerified: true
  },
  // 更多题目...
  {
    company: 'Microsoft',
    position: '数据分析师',
    questionType: 'behavioral',
    difficulty: 'easy',
    question: '描述一次你处理复杂数据问题的经历',
    recommendedAnswer: '使用STAR方法：Situation, Task, Action, Result',
    tags: '行为面试,项目经验',
    source: '面试真题',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Netflix',
    position: '产品分析师',
    questionType: 'case_study',
    difficulty: 'hard',
    question: '如何评估Netflix新内容投资的ROI？',
    recommendedAnswer: 'ROI评估：1.成本分析 2.收益计算 3.用户价值 4.长期影响',
    tags: 'ROI分析,内容策略',
    source: '面试真题',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Uber',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '设计一个算法来优化Uber的司机配送效率',
    recommendedAnswer: '优化算法：1.需求预测 2.路径规划 3.动态定价 4.实时调度',
    tags: '优化算法,运营研究',
    source: '面试真题',
    year: 2024,
    isVerified: true
  }
];

async function seedProductionQuestions() {
  try {
    console.log('🌱 开始导入生产环境面试题目...');
    
    // 检查现有数据
    const existingCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
    console.log(`📊 当前数据库中有 ${existingCount[0].count} 道题目`);
    
    if (existingCount[0].count > 0) {
      console.log('⚠️  数据库中已有题目，清空后重新导入...');
      await sql`DELETE FROM interview_questions`;
    }
    
    // 批量插入数据
    let insertedCount = 0;
    for (const question of interviewQuestions) {
      try {
        await sql`
          INSERT INTO interview_questions (
            company, position, question_type, difficulty, question, 
            recommended_answer, tags, source, year, is_verified, created_at, updated_at
          ) VALUES (
            ${question.company}, ${question.position}, ${question.questionType}, 
            ${question.difficulty}, ${question.question}, ${question.recommendedAnswer}, 
            ${question.tags}, ${question.source}, ${question.year}, ${question.isVerified},
            NOW(), NOW()
          )
        `;
        insertedCount++;
      } catch (error) {
        console.error(`❌ 插入题目失败:`, question.company, question.question.substring(0, 50));
        console.error(error);
      }
    }
    
    console.log(`✅ 成功导入 ${insertedCount} 道面试题目！`);
    
    // 验证结果
    const finalCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
    console.log(`📈 数据库中现有 ${finalCount[0].count} 道题目`);
    
    // 显示公司分布
    const companyStats = await sql`
      SELECT company, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY company 
      ORDER BY count DESC
    `;
    
    console.log('🏢 公司分布:');
    companyStats.forEach((stat: any) => {
      console.log(`   ${stat.company}: ${stat.count} 道题目`);
    });
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedProductionQuestions();
}

export { seedProductionQuestions }; 