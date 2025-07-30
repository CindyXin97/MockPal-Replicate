import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';

// Function to register a new user
export async function registerUser(username: string, password: string, targetCompany: string, targetIndustry: string) {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (existingUser.length > 0) {
      return { success: false, message: '用户名已存在' };
    }

    // Hash the password
    const passwordHash = await hash(password, 10);

    // Create the user
    const newUser = await db.insert(users).values({
      username,
      passwordHash,
    }).returning();

    // Create initial profile with target company and industry
    const { createProfile } = await import('@/lib/profile');
    await createProfile(newUser[0].id, {
      jobType: 'DA',
      experienceLevel: '应届',
      targetCompany,
      targetIndustry,
      technicalInterview: false,
      behavioralInterview: false,
      caseAnalysis: false,
      email: '',
      wechat: '',
      linkedin: '',
      bio: '',
    });

    return { 
      success: true, 
      user: { id: newUser[0].id, username: newUser[0].username } 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: '注册失败，请稍后再试' };
  }
}

// Function to authenticate a user
export async function authenticateUser(username: string, password: string) {
  try {
    // Find the user
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (user.length === 0) {
      return { success: false, message: '用户名或密码错误' };
    }

    // Verify password
    const passwordValid = await compare(password, user[0].passwordHash);
    
    if (!passwordValid) {
      return { success: false, message: '用户名或密码错误' };
    }

    return { 
      success: true, 
      user: { id: user[0].id, username: user[0].username } 
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: '登录失败，请稍后再试' };
  }
} 