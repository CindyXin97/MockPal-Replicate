import { db } from '@/lib/db';
import { userProfileHistory, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// 获取用户的资料修改历史
export async function getUserProfileHistory(userId: number, limit: number = 10) {
  try {
    const history = await db
      .select()
      .from(userProfileHistory)
      .where(eq(userProfileHistory.userId, userId))
      .orderBy(desc(userProfileHistory.createdAt))
      .limit(limit);

    return { success: true, history };
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return { success: false, message: '获取历史记录失败', history: [] };
  }
}

// 获取特定字段的修改历史
export async function getFieldHistory(userId: number, fieldName: string) {
  try {
    const history = await db
      .select()
      .from(userProfileHistory)
      .where(eq(userProfileHistory.userId, userId))
      .orderBy(desc(userProfileHistory.createdAt));

    // 过滤出包含该字段变更的记录
    const fieldHistory = history.filter(record => 
      record.changedFields?.includes(fieldName) || record.changeType === 'create'
    );

    return { success: true, history: fieldHistory };
  } catch (error) {
    console.error('获取字段历史失败:', error);
    return { success: false, message: '获取字段历史失败', history: [] };
  }
}

// 获取所有用户的修改统计
export async function getProfileChangeStats() {
  try {
    const stats = await db.execute(`
      SELECT 
        user_id,
        COUNT(*) as total_changes,
        COUNT(CASE WHEN change_type = 'create' THEN 1 END) as creates,
        COUNT(CASE WHEN change_type = 'update' THEN 1 END) as updates,
        MAX(created_at) as last_change
      FROM user_profile_history
      GROUP BY user_id
      ORDER BY total_changes DESC
    `);

    return { success: true, stats: stats.rows };
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return { success: false, message: '获取统计数据失败', stats: [] };
  }
}

// 比较两个时间点的资料差异
export function compareProfiles(oldProfile: any, newProfile: any) {
  const differences: { field: string; oldValue: any; newValue: any }[] = [];
  
  const fieldsToCompare = [
    'jobType', 'experienceLevel', 'targetCompany', 'targetIndustry',
    'technicalInterview', 'behavioralInterview', 'caseAnalysis', 'statsQuestions',
    'email', 'wechat', 'linkedin', 'bio', 'school'
  ];

  for (const field of fieldsToCompare) {
    if (oldProfile[field] !== newProfile[field]) {
      differences.push({
        field,
        oldValue: oldProfile[field],
        newValue: newProfile[field]
      });
    }
  }

  return differences;
}

// 格式化历史记录展示
export function formatHistoryRecord(record: any) {
  const fieldLabels: { [key: string]: string } = {
    jobType: '岗位类型',
    experienceLevel: '经验水平',
    targetCompany: '目标公司',
    targetIndustry: '目标行业',
    technicalInterview: '技术面试',
    behavioralInterview: '行为面试',
    caseAnalysis: '案例分析',
    statsQuestions: '统计题目',
    email: '邮箱',
    wechat: '微信',
    linkedin: 'LinkedIn',
    bio: '个人介绍',
    school: '学校'
  };

  const changeTypeLabels: { [key: string]: string } = {
    create: '创建',
    update: '更新',
    delete: '删除'
  };

  return {
    时间: new Date(record.createdAt).toLocaleString('zh-CN'),
    操作类型: changeTypeLabels[record.changeType] || record.changeType,
    修改字段: record.changedFields?.map((f: string) => fieldLabels[f] || f).join(', ') || '全部',
    岗位类型: record.jobType,
    经验水平: record.experienceLevel,
    目标公司: record.targetCompany,
    学校: record.school
  };
}

