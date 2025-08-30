require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function checkUser() {
  try {
    console.log('Checking user Bob Chen...');
    
    // 查询用户信息
    const users = await sql`
      SELECT id, email, name, password_hash, created_at, updated_at 
      FROM users 
      WHERE email = 'bob@test.com'
    `;
    
    if (users.length === 0) {
      console.log('User not found!');
      return;
    }
    
    const user = users[0];
    console.log('User info:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password_hash,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
    
    // 查询用户资料
    const profiles = await sql`
      SELECT * FROM user_profiles 
      WHERE user_id = ${user.id}
    `;
    
    if (profiles.length > 0) {
      const profile = profiles[0];
      console.log('Profile info:', {
        userId: profile.user_id,
        jobType: profile.job_type,
        experienceLevel: profile.experience_level,
        targetCompany: profile.target_company,
        targetIndustry: profile.target_industry,
        technicalInterview: profile.technical_interview,
        behavioralInterview: profile.behavioral_interview,
        caseAnalysis: profile.case_analysis,
        email: profile.email,
        wechat: profile.wechat,
        linkedin: profile.linkedin,
        bio: profile.bio,
        updatedAt: profile.updated_at
      });
    } else {
      console.log('No profile found for this user');
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

checkUser();