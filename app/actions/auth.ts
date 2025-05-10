'use server';

import { authenticateUser, registerUser } from '@/lib/auth';

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

  if (!username || !password || !confirmPassword) {
    return { success: false, message: '请填写所有必填字段' };
  }

  if (password !== confirmPassword) {
    return { success: false, message: '两次输入的密码不一致' };
  }

  if (password.length < 6) {
    return { success: false, message: '密码长度至少为6位' };
  }

  return registerUser(username, password);
} 