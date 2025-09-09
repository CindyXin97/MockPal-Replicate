import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 为其他公司升级更有挑战性的题目
const remainingCompanyUpgrades = [
  // Amazon 题目 - 升级为更复杂的电商分析
  {
    company: 'Amazon',
    position: '数据分析师',
    oldDifficulty: 'medium',
    newDifficulty: 'hard',
    question: `**[571. Find Median Given Frequency of Numbers](https://leetcode.com/problems/find-median-given-frequency-of-numbers/)**

📊 **题目描述:**
根据数字频率计算中位数（复杂统计分析）

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 统计学中位数 (Statistical Median)
- 频率分布分析 (Frequency Distribution Analysis)
- 累计频率计算 (Cumulative Frequency Calculation)
- 高级统计函数 (Advanced Statistical Functions)`,
    recommendedAnswer: `**解题思路:**

这是一道复杂的统计分析题目：
1. **累计频率计算** - 计算每个数字的累计频率
2. **中位数位置** - 找出中位数在频率分布中的位置
3. **边界判断** - 处理奇数和偶数总数的不同情况
4. **精确计算** - 确保中位数计算的准确性

**SQL解决方案:**
\`\`\`sql
WITH frequency_stats AS (
    -- 计算基础统计信息
    SELECT 
        num,
        frequency,
        SUM(frequency) OVER () as total_count,
        SUM(frequency) OVER (ORDER BY num) as cumulative_freq,
        SUM(frequency) OVER (ORDER BY num) - frequency as prev_cumulative_freq
    FROM Numbers
),
median_positions AS (
    -- 确定中位数位置
    SELECT 
        *,
        total_count / 2.0 as median_pos,
        CASE 
            WHEN total_count % 2 = 1 THEN (total_count + 1) / 2.0
            ELSE total_count / 2.0
        END as lower_median_pos,
        CASE 
            WHEN total_count % 2 = 1 THEN (total_count + 1) / 2.0
            ELSE (total_count / 2.0) + 1
        END as upper_median_pos
    FROM frequency_stats
),
median_candidates AS (
    -- 找出包含中位数的数字
    SELECT 
        num,
        frequency,
        total_count,
        cumulative_freq,
        prev_cumulative_freq,
        median_pos,
        CASE 
            WHEN total_count % 2 = 1 THEN
                CASE WHEN prev_cumulative_freq < (total_count + 1) / 2.0 
                     AND cumulative_freq >= (total_count + 1) / 2.0 
                     THEN num END
            ELSE
                CASE WHEN prev_cumulative_freq < total_count / 2.0 
                     AND cumulative_freq >= total_count / 2.0 
                     THEN num END
        END as lower_median,
        CASE 
            WHEN total_count % 2 = 1 THEN
                CASE WHEN prev_cumulative_freq < (total_count + 1) / 2.0 
                     AND cumulative_freq >= (total_count + 1) / 2.0 
                     THEN num END
            ELSE
                CASE WHEN prev_cumulative_freq < (total_count / 2.0 + 1) 
                     AND cumulative_freq >= (total_count / 2.0 + 1) 
                     THEN num END
        END as upper_median
    FROM median_positions
)
SELECT 
    ROUND(
        (MAX(lower_median) + MAX(upper_median)) / 2.0, 
        1
    ) as median
FROM median_candidates;
\`\`\`

**关键知识点:**
- **累计窗口函数**: SUM() OVER计算累计频率
- **中位数算法**: 处理奇偶数总数的不同逻辑
- **复杂条件**: 多重CASE WHEN实现复杂判断
- **统计分析**: 频率分布的中位数计算方法
- **精度控制**: ROUND函数保证结果精度`
  },
  
  // TikTok 题目 - 升级第一个medium为hard
  {
    company: 'TikTok',
    position: '数据分析师',
    oldDifficulty: 'medium',
    newDifficulty: 'hard',
    questionPattern: 'Find the Missing IDs',
    question: `**[601. Human Traffic of Stadium](https://leetcode.com/problems/human-traffic-of-stadium/)**

🏟️ **题目描述:**
找出连续3天或以上人流量都不少于100的记录

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 连续性分析 (Continuity Analysis)
- 滑动窗口分析 (Sliding Window Analysis)
- 时间序列模式识别 (Time Series Pattern Recognition)
- 业务规则复杂查询 (Complex Business Rule Query)`,
    recommendedAnswer: `**解题思路:**

复杂的连续性条件分析：
1. **基础过滤** - 筛选出人流量≥100的记录
2. **连续性检测** - 使用多种方法检测连续的3天或以上
3. **窗口分析** - 通过滑动窗口验证连续性
4. **结果合并** - 确保所有符合条件的记录都被包含

**SQL解决方案:**
\`\`\`sql
WITH qualified_days AS (
    -- 筛选人流量>=100的日期
    SELECT id, visit_date, people
    FROM Stadium
    WHERE people >= 100
),
consecutive_groups AS (
    -- 使用行号差值技巧识别连续组
    SELECT 
        id,
        visit_date,
        people,
        ROW_NUMBER() OVER (ORDER BY id) as rn,
        id - ROW_NUMBER() OVER (ORDER BY id) as group_id
    FROM qualified_days
),
valid_groups AS (
    -- 找出连续3天或以上的组
    SELECT 
        group_id,
        COUNT(*) as consecutive_days,
        MIN(id) as start_id,
        MAX(id) as end_id
    FROM consecutive_groups
    GROUP BY group_id
    HAVING COUNT(*) >= 3
),
result_ids AS (
    -- 获取所有符合条件的记录ID
    SELECT DISTINCT cg.id
    FROM consecutive_groups cg
    JOIN valid_groups vg ON cg.group_id = vg.group_id
)
SELECT 
    s.id,
    s.visit_date,
    s.people
FROM Stadium s
JOIN result_ids ri ON s.id = ri.id
ORDER BY s.visit_date;
\`\`\`

**关键知识点:**
- **连续性检测**: 行号差值技巧识别连续序列
- **分组聚合**: GROUP BY + HAVING筛选符合条件的组
- **多步骤查询**: 通过多个CTE实现复杂逻辑
- **业务规则**: 将复杂的业务需求转换为SQL逻辑
- **时间序列**: 处理时间相关的连续性问题`
  },
  
  // Google 题目 - 升级第一个medium为hard
  {
    company: 'Google',
    position: '数据分析师',
    oldDifficulty: 'medium',
    newDifficulty: 'hard',
    questionPattern: 'Page Recommendations',
    question: `**[615. Average Salary: Departments VS Company](https://leetcode.com/problems/average-salary-departments-vs-company/)**

💼 **题目描述:**
比较各部门与公司整体的平均工资差异（按月份）

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 对比分析 (Comparative Analysis)
- 多层聚合计算 (Multi-level Aggregation)
- 复杂业务指标 (Complex Business Metrics)
- 薪资基准分析 (Salary Benchmark Analysis)`,
    recommendedAnswer: `**解题思路:**

复杂的薪资对比分析：
1. **月度聚合** - 按月份和部门计算平均工资
2. **全公司基准** - 计算每月全公司平均工资
3. **对比分析** - 比较部门与公司整体的差异
4. **结果分类** - 根据差异情况进行分类

**SQL解决方案:**
\`\`\`sql
WITH monthly_dept_avg AS (
    -- 计算每月每部门平均工资
    SELECT 
        DATE_FORMAT(s.pay_date, '%Y-%m') as pay_month,
        e.department_id,
        AVG(s.amount) as dept_avg_salary
    FROM Salary s
    JOIN Employee e ON s.employee_id = e.employee_id
    GROUP BY DATE_FORMAT(s.pay_date, '%Y-%m'), e.department_id
),
monthly_company_avg AS (
    -- 计算每月全公司平均工资
    SELECT 
        DATE_FORMAT(pay_date, '%Y-%m') as pay_month,
        AVG(amount) as company_avg_salary
    FROM Salary
    GROUP BY DATE_FORMAT(pay_date, '%Y-%m')
),
salary_comparison AS (
    -- 比较部门与公司平均工资
    SELECT 
        mda.pay_month,
        mda.department_id,
        mda.dept_avg_salary,
        mca.company_avg_salary,
        CASE 
            WHEN mda.dept_avg_salary > mca.company_avg_salary THEN 'higher'
            WHEN mda.dept_avg_salary < mca.company_avg_salary THEN 'lower'
            ELSE 'same'
        END as comparison
    FROM monthly_dept_avg mda
    JOIN monthly_company_avg mca ON mda.pay_month = mca.pay_month
)
SELECT 
    pay_month,
    department_id,
    comparison
FROM salary_comparison
ORDER BY pay_month, department_id;
\`\`\`

**关键知识点:**
- **DATE_FORMAT**: 日期格式化进行月份分组
- **多层聚合**: 部门级别和公司级别的双重聚合
- **自连接对比**: 通过JOIN实现不同维度的对比
- **条件分类**: CASE WHEN实现业务逻辑分类
- **基准分析**: 建立基准线进行相对比较分析`
  },
  
  // Google 第二个题目升级
  {
    company: 'Google',
    position: '数据分析师',
    oldDifficulty: 'medium',
    newDifficulty: 'hard',
    questionPattern: 'All People Report',
    question: `**[1194. Tournament Winners](https://leetcode.com/problems/tournament-winners/)**

🏆 **题目描述:**
确定每组锦标赛的获胜者（复杂的竞赛积分计算）

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 竞赛积分系统 (Tournament Scoring System)
- 复杂排名计算 (Complex Ranking Calculation)
- 多维度聚合 (Multi-dimensional Aggregation)
- 胜负关系分析 (Win-Loss Relationship Analysis)`,
    recommendedAnswer: `**解题思路:**

复杂的锦标赛积分和排名系统：
1. **积分计算** - 为每个玩家计算总积分（胜利+3分，平局+1分）
2. **多维统计** - 统计胜场数、进球数等多个指标
3. **排名规则** - 按积分、胜场数、进球数的优先级排序
4. **分组获胜** - 确定每组的最终获胜者

**SQL解决方案:**
\`\`\`sql
WITH all_matches AS (
    -- 统一主场和客场的比赛记录
    SELECT 
        group_id,
        first_player as player_id,
        first_score as player_score,
        second_score as opponent_score,
        CASE 
            WHEN first_score > second_score THEN 3  -- 胜利
            WHEN first_score = second_score THEN 1  -- 平局
            ELSE 0  -- 失败
        END as points
    FROM Matches
    
    UNION ALL
    
    SELECT 
        group_id,
        second_player as player_id,
        second_score as player_score,
        first_score as opponent_score,
        CASE 
            WHEN second_score > first_score THEN 3  -- 胜利
            WHEN second_score = first_score THEN 1  -- 平局
            ELSE 0  -- 失败
        END as points
    FROM Matches
),
player_stats AS (
    -- 计算每个玩家的统计数据
    SELECT 
        group_id,
        player_id,
        SUM(points) as total_points,
        SUM(CASE WHEN points = 3 THEN 1 ELSE 0 END) as wins,
        SUM(player_score) as total_goals
    FROM all_matches
    GROUP BY group_id, player_id
),
ranked_players AS (
    -- 按规则排名：积分 > 胜场数 > 进球数 > 玩家ID
    SELECT 
        group_id,
        player_id,
        total_points,
        wins,
        total_goals,
        ROW_NUMBER() OVER (
            PARTITION BY group_id 
            ORDER BY total_points DESC, wins DESC, total_goals DESC, player_id ASC
        ) as rank_in_group
    FROM player_stats
)
SELECT 
    group_id,
    player_id
FROM ranked_players
WHERE rank_in_group = 1
ORDER BY group_id;
\`\`\`

**关键知识点:**
- **UNION ALL**: 合并主客场数据统一处理
- **复杂积分规则**: 多种情况的积分计算
- **多维排序**: ROW_NUMBER实现复杂排名规则
- **竞赛逻辑**: 理解体育竞赛的积分和排名系统
- **业务规则**: 将复杂的业务规则转换为SQL逻辑`
  }
];

async function upgradeRemainingCompanies() {
  console.log('🚀 开始为其他公司升级更有挑战性的题目...\n');
  
  try {
    let upgradedCount = 0;
    
    for (const question of remainingCompanyUpgrades) {
      // 删除旧题目
      if (question.questionPattern) {
        // 根据题目特征删除
        await sql`
          DELETE FROM interview_questions 
          WHERE company = ${question.company} 
            AND position = ${question.position}
            AND question_type = 'technical'
            AND difficulty = ${question.oldDifficulty}
            AND source = 'LeetCode'
            AND question LIKE ${`%${question.questionPattern}%`}
        `;
      } else {
        // 删除第一个匹配的题目
        await sql`
          DELETE FROM interview_questions 
          WHERE id IN (
            SELECT id FROM interview_questions
            WHERE company = ${question.company} 
              AND position = ${question.position}
              AND question_type = 'technical'
              AND difficulty = ${question.oldDifficulty}
              AND source = 'LeetCode'
            LIMIT 1
          )
        `;
      }
      
      // 插入新的复杂题目
      await sql`
        INSERT INTO interview_questions (
          company, position, question_type, difficulty, question, 
          recommended_answer, tags, source, year, is_verified
        ) VALUES (
          ${question.company}, ${question.position}, 'technical', ${question.newDifficulty},
          ${question.question}, ${question.recommendedAnswer}, 
          'SQL,LeetCode,数据分析,高难度', 'LeetCode', 2024, true
        )
      `;
      
      console.log(`✅ 升级 ${question.company} - ${question.oldDifficulty} → ${question.newDifficulty}`);
      console.log(`   ${question.question.match(/\*\*\[(.*?)\]/)?.[1] || '题目'}`);
      upgradedCount++;
    }
    
    console.log(`\n🎉 成功升级 ${upgradedCount} 道题目为更有挑战性的版本！`);
    
    // 验证最终结果
    const allLeetcode = await sql`
      SELECT company, position, difficulty, LEFT(question, 60) as question_preview
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical'
      ORDER BY company, position, 
        CASE difficulty 
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `;
    
    console.log('\n📊 最终的LeetCode题目难度分布:');
    allLeetcode.forEach((q, i) => {
      const difficultyIcon = q.difficulty === 'hard' ? '🔥' : '⚡';
      console.log(`${i + 1}. ${difficultyIcon} 【${q.company}】${q.position} - ${q.difficulty.toUpperCase()}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
    // 最终难度统计
    const finalStats = await sql`
      SELECT 
        difficulty,
        COUNT(*) as count 
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical'
      GROUP BY difficulty 
      ORDER BY 
        CASE difficulty 
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `;
    
    console.log('📈 最终难度分布:');
    finalStats.forEach(stat => {
      const icon = stat.difficulty === 'hard' ? '🔥' : '⚡';
      console.log(`   ${icon} ${stat.difficulty.toUpperCase()}: ${stat.count} 道`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`\n📚 总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 升级题目过程中出现错误:', error);
  }
}

export { upgradeRemainingCompanies };

// 如果直接运行此脚本
if (require.main === module) {
  upgradeRemainingCompanies();
} 