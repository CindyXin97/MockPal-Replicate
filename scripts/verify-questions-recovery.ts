import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function verifyQuestionsRecovery() {
  try {
    console.log('✅ 验证题库恢复状态...\n');
    
    // 总题目数量
    const totalCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
    console.log(`📚 总题目数量: ${totalCount[0].count} 道题目`);
    
    if (totalCount[0].count >= 60) {
      console.log('🎉 题库恢复成功！题目数量充足');
    } else if (totalCount[0].count >= 40) {
      console.log('⚠️  题库部分恢复，题目数量基本满足需求');
    } else {
      console.log('❌ 题库恢复不完整，题目数量不足');
    }
    
    // 按公司分布
    console.log('\n🏢 按公司分布:');
    const byCompany = await sql`
      SELECT company, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY company 
      ORDER BY count DESC
    `;
    
    byCompany.forEach((item: any) => {
      console.log(`   📊 ${item.company}: ${item.count} 道题目`);
    });
    
    // 按职位分布
    console.log('\n💼 按职位分布:');
    const byPosition = await sql`
      SELECT position, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY position 
      ORDER BY count DESC
    `;
    
    byPosition.forEach((item: any) => {
      console.log(`   📊 ${item.position}: ${item.count} 道题目`);
    });
    
    // 按题目类型分布
    console.log('\n📝 按题目类型分布:');
    const byType = await sql`
      SELECT question_type, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY question_type 
      ORDER BY count DESC
    `;
    
    byType.forEach((item: any) => {
      const typeNames: { [key: string]: string } = {
        'technical': '技术题',
        'case_study': '案例分析',
        'stats': '统计题',
        'behavioral': '行为题'
      };
      const typeName = typeNames[item.question_type] || item.question_type;
      console.log(`   📊 ${typeName}: ${item.count} 道题目`);
    });
    
    // 按难度分布
    console.log('\n🎯 按难度分布:');
    const byDifficulty = await sql`
      SELECT difficulty, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY difficulty 
      ORDER BY 
        CASE difficulty 
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2  
          WHEN 'hard' THEN 3
          ELSE 4
        END
    `;
    
    byDifficulty.forEach((item: any) => {
      const difficultyIcons: { [key: string]: string } = {
        'easy': '🟢',
        'medium': '🟡',
        'hard': '🔴'
      };
      const icon = difficultyIcons[item.difficulty] || '⚪';
      console.log(`   ${icon} ${item.difficulty}: ${item.count} 道题目`);
    });
    
    // 按来源分布
    console.log('\n📖 按来源分布:');
    const bySource = await sql`
      SELECT source, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY source 
      ORDER BY count DESC
    `;
    
    bySource.forEach((item: any) => {
      console.log(`   📊 ${item.source}: ${item.count} 道题目`);
    });
    
    // 验证数据完整性
    console.log('\n🔍 数据完整性检查:');
    
    const emptyQuestions = await sql`
      SELECT COUNT(*) as count 
      FROM interview_questions 
      WHERE question IS NULL OR question = '' OR LENGTH(TRIM(question)) = 0
    `;
    
    const emptyAnswers = await sql`
      SELECT COUNT(*) as count 
      FROM interview_questions 
      WHERE recommended_answer IS NULL OR recommended_answer = '' OR LENGTH(TRIM(recommended_answer)) = 0
    `;
    
    console.log(`   📝 空题目数量: ${emptyQuestions[0].count} (应为0)`);
    console.log(`   💡 空答案数量: ${emptyAnswers[0].count} (应为0)`);
    
    if (emptyQuestions[0].count === 0 && emptyAnswers[0].count === 0) {
      console.log('   ✅ 数据完整性检查通过');
    } else {
      console.log('   ⚠️  发现数据完整性问题');
    }
    
    // 显示最近添加的题目
    console.log('\n🆕 最近添加的题目 (前5道):');
    const recentQuestions = await sql`
      SELECT company, position, question_type, difficulty, 
             LEFT(question, 80) as question_preview,
             created_at
      FROM interview_questions 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    recentQuestions.forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. 【${item.company}】${item.position} - ${item.difficulty}`);
      console.log(`      ${item.question_preview}...`);
      console.log(`      📅 ${new Date(item.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // 最终状态评估
    console.log('🎯 恢复状态评估:');
    const score = totalCount[0].count >= 60 ? '完美' : 
                 totalCount[0].count >= 50 ? '良好' : 
                 totalCount[0].count >= 40 ? '基本满足' : '需要改进';
    
    console.log(`   📈 恢复评分: ${score}`);
    console.log(`   📚 题目覆盖: ${byCompany.length} 家公司`);
    console.log(`   💼 职位覆盖: ${byPosition.length} 个职位`);
    console.log(`   📝 类型覆盖: ${byType.length} 种题型`);
    
    if (totalCount[0].count >= 60) {
      console.log('\n🎉 恭喜！题库已完全恢复！');
      console.log('✅ 您现在可以正常使用 www.mockpals.com 进行面试练习');
      console.log('✅ 所有匹配功能都应该正常工作');
      console.log('✅ 题目内容丰富，覆盖多个公司和职位');
    } else {
      console.log('\n⚠️  题库恢复基本完成，但建议继续补充题目');
      console.log('💡 可以运行更多种子脚本来增加题目数量');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    console.log('\n🔧 可能的问题:');
    console.log('   1. 数据库连接问题');
    console.log('   2. interview_questions表不存在');
    console.log('   3. 权限不足');
    process.exit(1);
  }
}

// 运行验证
verifyQuestionsRecovery().then(() => {
  console.log('\n✨ 题库恢复验证完成');
  process.exit(0);
}); 