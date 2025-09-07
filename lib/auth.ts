import { db } from '@/lib/db';
import { users, verificationTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { emailService } from './email-service';

// 验证邮箱和密码登录
export async function authenticateWithEmailPassword(email: string, password: string) {
  try {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0) {
      return { success: false, message: '邮箱或密码错误' };
    }

    if (!user[0].passwordHash) {
      return { success: false, message: '该邮箱未设置密码，请使用邮箱验证登录' };
    }
    
    const passwordValid = await compare(password, user[0].passwordHash);
    
    if (!passwordValid) {
      return { success: false, message: '邮箱或密码错误' };
    }

    return { 
      success: true, 
      user: { 
        id: user[0].id, 
        email: user[0].email,
        name: user[0].name 
      } 
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: '登录失败，请稍后再试' };
  }
}

// 发送设置密码链接
export async function sendPasswordSetupEmail(email: string) {
  try {
    // 检查邮箱是否已注册
    let user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    // 如果用户不存在，创建新用户
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        email,
        emailVerified: null,
      }).returning();
      user = newUser;
    }
    
    // 如果用户已有密码，不允许重新注册
    if (user[0].passwordHash) {
      return { success: false, message: '该邮箱已注册，请直接登录' };
    }

    // 生成密码设置token
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24小时有效期

    // 保存token到数据库
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    });

    // 构建设置密码链接
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const setupUrl = `${baseUrl}/auth/set-password?token=${token}&email=${encodeURIComponent(email)}`;

    // 发送邮件
    await emailService.sendPasswordSetupEmail(email, setupUrl);

    return { success: true, message: '设置密码链接已发送到您的邮箱' };
  } catch (error) {
    console.error('Send password setup email error:', error);
    return { success: false, message: '发送邮件失败，请稍后再试' };
  }
}

// 设置密码
export async function setPassword(email: string, token: string, password: string) {
  try {
    // 验证token
    const validToken = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.identifier, email))
      .limit(1);

    if (validToken.length === 0 || validToken[0].token !== token) {
      return { success: false, message: '无效的验证链接' };
    }

    // 检查token是否过期
    if (new Date() > validToken[0].expires) {
      // 删除过期token
      await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
      return { success: false, message: '链接已过期，请重新申请' };
    }

    // 查找用户
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    // 设置密码
    const passwordHash = await hash(password, 10);
    await db.update(users).set({
      passwordHash,
      emailVerified: new Date(),
    }).where(eq(users.email, email));

    // 删除使用过的token
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

    // 创建用户profile
    const { createProfile } = await import('@/lib/profile');
    await createProfile(user[0].id, {
      jobType: 'DA',
      experienceLevel: '应届',
      targetCompany: '',
      targetIndustry: '',
      technicalInterview: false,
      behavioralInterview: false,
      caseAnalysis: false,
      statsQuestions: false,
      email: email,
      wechat: '',
      linkedin: '',
      bio: '',
    });

    return { success: true, message: '密码设置成功，请登录' };
  } catch (error) {
    console.error('Set password error:', error);
    return { success: false, message: '设置密码失败，请稍后再试' };
  }
}

