'use server';

import { sendPasswordSetupEmail, setPassword } from '@/lib/auth';

// 邮箱+密码注册 - 发送设置密码链接
export async function registerWithEmail(email: string, inviteCode?: string) {
  if (!email) {
    return { success: false, message: '请输入邮箱地址' };
  }

  return sendPasswordSetupEmail(email, inviteCode);
}

// 设置密码
export async function setUserPassword(email: string, token: string, password: string, confirmPassword: string) {
  if (!email || !token || !password || !confirmPassword) {
    return { success: false, message: '请填写所有必填字段' };
  }

  if (password !== confirmPassword) {
    return { success: false, message: '两次输入的密码不一致' };
  }

  if (password.length < 6) {
    return { success: false, message: '密码长度至少为6位' };
  }

  return setPassword(email, token, password);
}

