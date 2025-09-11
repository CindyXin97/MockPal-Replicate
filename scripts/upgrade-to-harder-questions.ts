import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

// 更有挑战性的LeetCode题目
const harderLeetcodeQuestions = [
  // LinkedIn 题目 - 升级为更复杂的职业社交网络分析
  {
    company: 'LinkedIn',
    position: '数据分析师',
    oldDifficulty: 'easy',
    newDifficulty: 'hard',
    question: `**[579. Find Cumulative Salary of an Employee](https://leetcode.com/problems/find-cumulative-salary-of-an-employee/)**

💰 **题目描述:**
计算每个员工每个月的累计工资（排除最近一个月）

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 累计分析 (Cumulative Analysis)
- 窗口函数高级应用 (Advanced Window Functions)
- 薪资趋势分析 (Salary Trend Analysis)
- 时间序列累计计算 (Time Series Cumulative Calculation)`,
    recommendedAnswer: `**解题思路:**

这是一道复杂的累计工资计算题目：
1. **排除最新月份** - 每个员工排除最近一个月的记录
2. **累计计算** - 使用窗口函数计算累计工资
3. **多维排序** - 按员工和月份正确排序
4. **边界处理** - 处理员工只有一个月记录的情况

**SQL解决方案:**
\`\`\`sql
WITH ranked_salaries AS (
    SELECT 
        id,
        month,
        salary,
        ROW_NUMBER() OVER (PARTITION BY id ORDER BY month DESC) as rn
    FROM Employee
),
filtered_salaries AS (
    SELECT 
        id,
        month,
        salary
    FROM ranked_salaries
    WHERE rn > 1  -- 排除每个员工最近的一个月
)
SELECT 
    id,
    month,
    SUM(salary) OVER (
        PARTITION BY id 
        ORDER BY month 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as Salary
FROM filtered_salaries
ORDER BY id, month DESC;
\`\`\`

**关键知识点:**
- **ROW_NUMBER**: 识别每个员工的最新记录
- **滑动窗口**: ROWS BETWEEN实现最近3个月累计
- **复合排序**: 先按ID再按月份降序
- **累计分析**: 窗口函数实现动态累计计算
- **数据过滤**: 排除不需要的时间段`
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
    oldDifficulty: 'medium',
    newDifficulty: 'hard',
    question: `**[1892. Page Recommendations II](https://leetcode.com/problems/page-recommendations-ii/)**

🔗 **题目描述:**
基于朋友的朋友关系进行页面推荐（二度人脉推荐）

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 社交网络分析 (Social Network Analysis)
- 二度连接算法 (Second-degree Connection Algorithm)
- 复杂推荐系统 (Complex Recommendation System)
- 图遍历查询 (Graph Traversal Query)`,
    recommendedAnswer: `**解题思路:**

复杂的社交网络推荐系统：
1. **二度关系构建** - 找出朋友的朋友但不是直接朋友的人
2. **页面收集** - 收集二度朋友喜欢的页面
3. **权重计算** - 按推荐人数计算页面权重
4. **多层过滤** - 排除用户已喜欢和直接朋友推荐的页面

**SQL解决方案:**
\`\`\`sql
WITH user_direct_friends AS (
    -- 获取用户的直接朋友
    SELECT user2_id as friend_id
    FROM Friendship 
    WHERE user1_id = 1
    UNION
    SELECT user1_id as friend_id
    FROM Friendship 
    WHERE user2_id = 1
),
friends_of_friends AS (
    -- 获取朋友的朋友（二度连接）
    SELECT DISTINCT f2.user2_id as second_degree_friend
    FROM user_direct_friends df
    JOIN Friendship f2 ON (df.friend_id = f2.user1_id OR df.friend_id = f2.user2_id)
    WHERE f2.user2_id != 1 
      AND f2.user2_id NOT IN (SELECT friend_id FROM user_direct_friends)
    UNION
    SELECT DISTINCT f2.user1_id as second_degree_friend
    FROM user_direct_friends df
    JOIN Friendship f2 ON (df.friend_id = f2.user1_id OR df.friend_id = f2.user2_id)
    WHERE f2.user1_id != 1 
      AND f2.user1_id NOT IN (SELECT friend_id FROM user_direct_friends)
),
second_degree_recommendations AS (
    -- 收集二度朋友的页面喜好
    SELECT 
        l.page_id,
        COUNT(DISTINCT l.user_id) as recommendation_count
    FROM friends_of_friends fof
    JOIN Likes l ON fof.second_degree_friend = l.user_id
    WHERE l.page_id NOT IN (
        -- 排除用户已经喜欢的页面
        SELECT page_id FROM Likes WHERE user_id = 1
    )
    GROUP BY l.page_id
)
SELECT 
    page_id as recommended_page
FROM second_degree_recommendations
ORDER BY recommendation_count DESC, page_id;
\`\`\`

**关键知识点:**
- **图遍历**: 通过多次JOIN实现二度连接查询
- **复杂过滤**: 多层NOT IN排除已有关系
- **权重排序**: 按推荐人数排序提高准确性
- **社交算法**: 实现类似"朋友的朋友"推荐逻辑
- **网络分析**: 理解社交网络中的传播路径`
  },
  {
    company: 'LinkedIn',
    position: '数据分析师',
    oldDifficulty: 'medium',
    newDifficulty: 'hard',
    question: `**[1949. Strong Friendship](https://leetcode.com/problems/strong-friendship/)**

👥 **题目描述:**
找出强友谊关系（至少有3个共同朋友的朋友对）

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 强关系分析 (Strong Tie Analysis)
- 共同朋友算法 (Mutual Friends Algorithm)
- 社交网络密度 (Social Network Density)
- 关系强度量化 (Relationship Strength Quantification)`,
    recommendedAnswer: `**解题思路:**

复杂的社交关系强度分析：
1. **朋友关系标准化** - 将双向关系统一处理
2. **共同朋友计算** - 找出每对朋友的共同朋友数量
3. **强关系筛选** - 筛选出共同朋友≥3的关系
4. **结果格式化** - 确保较小用户ID在前

**SQL解决方案:**
\`\`\`sql
WITH normalized_friendship AS (
    -- 标准化朋友关系，确保user1 < user2
    SELECT 
        LEAST(user1_id, user2_id) as user1,
        GREATEST(user1_id, user2_id) as user2
    FROM Friendship
),
all_friendships AS (
    -- 创建所有朋友关系的完整视图
    SELECT user1_id as user1, user2_id as user2 FROM Friendship
    UNION
    SELECT user2_id as user1, user1_id as user2 FROM Friendship
),
mutual_friends AS (
    -- 计算每对直接朋友的共同朋友数量
    SELECT 
        nf.user1,
        nf.user2,
        COUNT(af1.user2) as common_friend
    FROM normalized_friendship nf
    JOIN all_friendships af1 ON nf.user1 = af1.user1
    JOIN all_friendships af2 ON nf.user2 = af2.user1
    WHERE af1.user2 = af2.user2  -- 共同朋友
      AND af1.user2 != nf.user1 AND af1.user2 != nf.user2  -- 排除自己
    GROUP BY nf.user1, nf.user2
)
SELECT 
    user1,
    user2,
    common_friend
FROM mutual_friends
WHERE common_friend >= 3
ORDER BY user1, user2;
\`\`\`

**关键知识点:**
- **关系标准化**: LEAST/GREATEST统一双向关系
- **自连接**: 通过多次连接同一表找共同元素
- **复杂计数**: 在多层连接中进行准确计数
- **社交分析**: 量化社交网络中的关系强度
- **图算法**: SQL实现图论中的共同邻居算法`
  },
  
  // Meta 题目 - 升级为复杂的社交媒体分析
  {
    company: 'Meta',
    position: '数据分析师',
    oldDifficulty: 'easy',
    newDifficulty: 'hard',
    question: `**[1097. Game Play Analysis V](https://leetcode.com/problems/game-play-analysis-v/)**

🎮 **题目描述:**
分析玩家留存率：计算首次登录后第二天继续游戏的玩家比例

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 用户留存分析 (User Retention Analysis)
- 队列分析 (Cohort Analysis)
- 首日留存率 (Day-1 Retention Rate)
- 用户生命周期 (User Lifecycle Analysis)`,
    recommendedAnswer: `**解题思路:**

复杂的用户留存率分析：
1. **首次登录识别** - 找出每个玩家的首次登录日期
2. **次日活跃检查** - 检查首次登录后第二天是否活跃
3. **留存率计算** - 计算整体的首日留存率
4. **精度控制** - 保留两位小数

**SQL解决方案:**
\`\`\`sql
WITH first_login AS (
    -- 找出每个玩家的首次登录日期
    SELECT 
        player_id,
        MIN(event_date) as install_dt
    FROM Activity
    GROUP BY player_id
),
day1_retention AS (
    -- 检查首次登录后第二天是否继续游戏
    SELECT 
        fl.player_id,
        fl.install_dt,
        CASE 
            WHEN a.event_date IS NOT NULL THEN 1 
            ELSE 0 
        END as retained
    FROM first_login fl
    LEFT JOIN Activity a ON fl.player_id = a.player_id 
        AND a.event_date = DATE_ADD(fl.install_dt, INTERVAL 1 DAY)
)
SELECT 
    install_dt,
    COUNT(player_id) as installs,
    ROUND(
        SUM(retained) * 1.0 / COUNT(player_id), 
        2
    ) as Day1_retention
FROM day1_retention
GROUP BY install_dt
ORDER BY install_dt;
\`\`\`

**关键知识点:**
- **MIN聚合**: 找出每个用户的首次事件
- **日期计算**: DATE_ADD进行精确的日期运算
- **LEFT JOIN**: 检查特定日期的活动记录
- **留存率公式**: 次日活跃用户数 / 新用户数
- **队列分析**: 按安装日期分组的留存分析`
  },
  {
    company: 'Meta',
    position: '数据分析师',
    oldDifficulty: 'easy',
    newDifficulty: 'hard',
    question: `**[1159. Market Analysis II](https://leetcode.com/problems/market-analysis-ii/)**

🛍️ **题目描述:**
分析用户购买行为：找出最喜欢的品牌是否为第二次购买的品牌

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 用户偏好分析 (User Preference Analysis)
- 购买行为建模 (Purchase Behavior Modeling)
- 品牌忠诚度 (Brand Loyalty)
- 复杂业务逻辑 (Complex Business Logic)`,
    recommendedAnswer: `**解题思路:**

复杂的用户购买偏好分析：
1. **最爱品牌识别** - 找出每个用户购买最多的品牌
2. **购买历史排序** - 按时间顺序排列用户的购买记录
3. **第二次购买** - 识别每个用户的第二次购买
4. **偏好匹配** - 判断最爱品牌是否为第二次购买品牌

**SQL解决方案:**
\`\`\`sql
WITH user_favorite_brand AS (
    -- 找出每个用户最喜欢的品牌（购买最多的）
    SELECT 
        u.user_id,
        u.favorite_brand
    FROM Users u
),
user_orders_ranked AS (
    -- 按购买时间排序用户的订单
    SELECT 
        o.buyer_id,
        i.brand,
        o.order_date,
        ROW_NUMBER() OVER (
            PARTITION BY o.buyer_id 
            ORDER BY o.order_date, o.order_id
        ) as order_rank
    FROM Orders o
    JOIN Items i ON o.item_id = i.item_id
),
second_purchase AS (
    -- 获取每个用户的第二次购买品牌
    SELECT 
        buyer_id,
        brand as second_brand
    FROM user_orders_ranked
    WHERE order_rank = 2
)
SELECT 
    u.user_id as seller_id,
    CASE 
        WHEN u.favorite_brand = sp.second_brand THEN 'yes'
        ELSE 'no'
    END as 2nd_item_fav_brand
FROM user_favorite_brand u
LEFT JOIN second_purchase sp ON u.user_id = sp.buyer_id
ORDER BY u.user_id;
\`\`\`

**关键知识点:**
- **ROW_NUMBER**: 按时间顺序为订单排序
- **复杂连接**: 多表连接获取品牌信息
- **条件逻辑**: CASE WHEN实现复杂的业务判断
- **LEFT JOIN**: 处理没有第二次购买的用户
- **用户画像**: 分析用户的购买偏好模式`
  },
  {
    company: 'Meta',
    position: '数据分析师',
    oldDifficulty: 'medium',
    newDifficulty: 'hard',
    question: `**[1225. Report Contiguous Dates](https://leetcode.com/problems/report-contiguous-dates/)**

📅 **题目描述:**
报告系统连续成功和失败的时间段

**标签:** Database, SQL  
**难度:** Hard

**相关概念:**
- 连续性分析 (Continuity Analysis)
- 系统稳定性监控 (System Stability Monitoring)
- 时间序列分组 (Time Series Grouping)
- 状态变化检测 (State Change Detection)`,
    recommendedAnswer: `**解题思路:**

复杂的系统状态连续性分析：
1. **状态统一** - 将成功和失败任务统一到一个视图
2. **连续分组** - 使用日期差值技巧识别连续的相同状态
3. **时间段计算** - 计算每个连续状态的开始和结束时间
4. **结果排序** - 按时间顺序输出结果

**SQL解决方案:**
\`\`\`sql
WITH all_tasks AS (
    -- 统一成功和失败任务
    SELECT fail_date as task_date, 'failed' as period_state
    FROM Failed
    WHERE fail_date BETWEEN '2019-01-01' AND '2019-12-31'
    
    UNION ALL
    
    SELECT success_date as task_date, 'succeeded' as period_state  
    FROM Succeeded
    WHERE success_date BETWEEN '2019-01-01' AND '2019-12-31'
),
grouped_tasks AS (
    -- 使用日期差值技巧进行连续性分组
    SELECT 
        task_date,
        period_state,
        ROW_NUMBER() OVER (ORDER BY task_date) as overall_rank,
        ROW_NUMBER() OVER (PARTITION BY period_state ORDER BY task_date) as state_rank,
        DATE_SUB(task_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY period_state ORDER BY task_date) DAY) as group_id
    FROM all_tasks
)
SELECT 
    period_state,
    MIN(task_date) as start_date,
    MAX(task_date) as end_date
FROM grouped_tasks
GROUP BY period_state, group_id
ORDER BY start_date;
\`\`\`

**关键知识点:**
- **UNION ALL**: 合并不同表的数据
- **日期分组技巧**: 日期减去排名识别连续组
- **双重ROW_NUMBER**: 全局排序和分组内排序
- **连续性检测**: SQL实现连续时间段的识别
- **系统监控**: 分析系统运行状态的时间模式`
  }
];

async function upgradeToHarderQuestions() {
  console.log('🔄 开始升级为更有挑战性的LeetCode题目...\n');
  
  try {
    let upgradedCount = 0;
    
    for (const question of harderLeetcodeQuestions) {
      // 删除旧的简单题目
      const deleteResult = await sql`
        DELETE FROM interview_questions 
        WHERE company = ${question.company} 
          AND position = ${question.position}
          AND question_type = 'technical'
          AND difficulty = ${question.oldDifficulty}
          AND source = 'LeetCode'
      `;
      
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
    
    // 验证升级结果
    const upgradedQuestions = await sql`
      SELECT company, position, difficulty, LEFT(question, 60) as question_preview
      FROM interview_questions 
      WHERE source = 'LeetCode' AND question_type = 'technical'
      ORDER BY company, position, 
        CASE difficulty 
          WHEN 'medium' THEN 2 
          WHEN 'hard' THEN 3 
        END
    `;
    
    console.log('\n📊 升级后的LeetCode题目难度分布:');
    upgradedQuestions.forEach((q, i) => {
      const difficultyIcon = q.difficulty === 'hard' ? '🔥' : '⚡';
      console.log(`${i + 1}. ${difficultyIcon} 【${q.company}】${q.position} - ${q.difficulty.toUpperCase()}`);
      console.log(`   ${q.question_preview}...\n`);
    });
    
    // 统计难度分布
    const difficultyStats = await sql`
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
    
    console.log('📈 新的难度分布:');
    difficultyStats.forEach(stat => {
      const icon = stat.difficulty === 'hard' ? '🔥' : '⚡';
      console.log(`   ${icon} ${stat.difficulty.toUpperCase()}: ${stat.count} 道`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as total FROM interview_questions`;
    console.log(`\n📚 总题目数: ${totalCount[0].total} 道\n`);
    
  } catch (error) {
    console.error('❌ 升级题目过程中出现错误:', error);
  }
}

export { upgradeToHarderQuestions };

// 如果直接运行此脚本
if (require.main === module) {
  upgradeToHarderQuestions();
} 