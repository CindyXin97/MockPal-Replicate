/**
 * 查找资料不完整的用户
 */

import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/db/schema';
import { users, userProfiles } from '../lib/db/schema';
import { exists, eq } from 'drizzle-orm';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 初始化数据库连接
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function findIncompleteProfiles() {
  try {
    console.log('🔍 查找资料不完整的用户...\n');
    
    // 获取所有有profile的用户
    const allUsersWithProfiles = await db.query.users.findMany({
      where: exists(
        db.select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, users.id))
      ),
      with: {
        profile: true,
      },
    });
    
    console.log(`总用户数: ${allUsersWithProfiles.length}\n`);
    
    // 分类用户
    const completeUsers: any[] = [];
    const incompleteUsers: any[] = [];
    
    allUsersWithProfiles.forEach(user => {
      const profile = user.profile as any;
      
      if (!profile) {
        incompleteUsers.push({ user, reason: '没有资料' });
        return;
      }
      
      const hasBasicInfo = profile.jobType && profile.experienceLevel;
      const hasPracticeContent = (
        profile.technicalInterview ||
        profile.behavioralInterview ||
        profile.caseAnalysis ||
        profile.statsQuestions
      );
      const hasContactInfo = (
        (profile.email && profile.email.trim() !== '') ||
        (profile.wechat && profile.wechat.trim() !== '') ||
        (profile.linkedin && profile.linkedin.trim() !== '')
      );
      
      if (!hasBasicInfo || !hasPracticeContent || !hasContactInfo) {
        const reasons = [];
        if (!hasBasicInfo) reasons.push('缺少岗位/经验信息');
        if (!hasPracticeContent) reasons.push('未选择练习内容');
        if (!hasContactInfo) reasons.push('未填写联系方式');
        
        incompleteUsers.push({ 
          user, 
          profile,
          reason: reasons.join(', '),
          hasBasicInfo,
          hasPracticeContent,
          hasContactInfo
        });
      } else {
        completeUsers.push(user);
      }
    });
    
    console.log(`✅ 资料完整的用户: ${completeUsers.length} 人`);
    console.log(`❌ 资料不完整的用户: ${incompleteUsers.length} 人\n`);
    
    if (incompleteUsers.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('资料不完整的用户详情:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      incompleteUsers.forEach((item, index) => {
        const { user, profile, reason, hasBasicInfo, hasPracticeContent, hasContactInfo } = item;
        console.log(`${index + 1}. 用户ID: ${user.id}`);
        console.log(`   昵称: ${user.name || '未设置'}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   注册时间: ${user.createdAt}`);
        console.log(`   ❌ 问题: ${reason}`);
        
        if (profile) {
          console.log(`   详细信息:`);
          console.log(`     - 岗位类型: ${profile.jobType || '未填写'}`);
          console.log(`     - 经验水平: ${profile.experienceLevel || '未填写'}`);
          console.log(`     - 技术面: ${profile.technicalInterview || false}`);
          console.log(`     - 行为面: ${profile.behavioralInterview || false}`);
          console.log(`     - 案例分析: ${profile.caseAnalysis || false}`);
          console.log(`     - 统计题: ${profile.statsQuestions || false}`);
          console.log(`     - 邮箱: ${profile.email || '未填写'}`);
          console.log(`     - 微信: ${profile.wechat || '未填写'}`);
          console.log(`     - LinkedIn: ${profile.linkedin || '未填写'}`);
        }
        console.log('');
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 建议操作:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. 联系这些用户，提醒他们完善资料');
      console.log('2. 特别是"未选择练习内容"的用户，这会导致他们无法被推荐');
      console.log('3. 考虑在用户注册流程中强制要求选择至少一项练习内容');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
  } catch (error) {
    console.error('❌ 查询过程出错:', error);
  } finally {
    process.exit(0);
  }
}

// 运行查询
findIncompleteProfiles();

