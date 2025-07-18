'use server';

import { authenticateUser, registerUser } from '@/lib/auth';
import { saveUserProfile } from '@/lib/profile';

// Login action
export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, message: '请输入用户名和密码' };
  }

  return authenticateUser(username, password);
}

// Register action
export async function register(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const targetCompany = formData.get('targetCompany') as string;
  const targetIndustry = formData.get('targetIndustry') as string;

  if (!username || !password || !confirmPassword || !targetCompany || !targetIndustry) {
    return { success: false, message: '请填写所有必填字段' };
  }

  if (password !== confirmPassword) {
    return { success: false, message: '两次输入的密码不一致' };
  }

  if (password.length < 6) {
    return { success: false, message: '密码长度至少为6位' };
  }

  const result = await registerUser(username, password);
  
  if (result.success && 'user' in result && result.user) {
    // 自动创建用户profile
    const profileData = {
      jobType: 'DA' as const,
      experienceLevel: '应届' as const,
      targetCompany,
      targetIndustry,
      technicalInterview: false,
      behavioralInterview: false,
      caseAnalysis: false,
    };
    
    await saveUserProfile(result.user.id, profileData);
  }

  return result;
} 